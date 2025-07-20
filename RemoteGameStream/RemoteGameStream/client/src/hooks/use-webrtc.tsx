import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPeerConnection, createSessionId } from "@/lib/webrtc-utils";

interface WebRTCStats {
  latency: string;
  bandwidth: string;
  quality: string;
}

interface ScreenShareOptions {
  videoQuality: string;
  frameRate: number;
}

export function useWebRTC(mode: 'host' | 'viewer') {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>('');
  const [iceConnectionState, setIceConnectionState] = useState<string>('');
  const [signalingState, setSignalingState] = useState<string>('');
  const [dataChannelState, setDataChannelState] = useState<string>('');
  const [connectionStats, setConnectionStats] = useState<WebRTCStats>({
    latency: '--',
    bandwidth: '--',
    quality: '--'
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleSignalingMessage(message).catch(error => {
          console.error('Error handling WebSocket message:', error);
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection error",
        description: "Lost connection to signaling server",
        variant: "destructive",
      });
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSignalingMessage = async (message: any) => {
    const { type, sessionId: msgSessionId, data } = message;

    switch (type) {
      case 'session-created':
        setSessionId(msgSessionId);
        break;

      case 'session-joined':
        if (data?.participantJoined && mode === 'host') {
          // Create offer for new participant
          await createOffer();
        } else if (!data?.participantJoined) {
          setIsConnected(true);
        }
        break;

      case 'session-error':
        toast({
          title: "Session error",
          description: data?.error || "Unknown session error",
          variant: "destructive",
        });
        break;

      case 'offer':
        await handleOffer(data);
        break;

      case 'answer':
        await handleAnswer(data);
        break;

      case 'ice-candidate':
        await handleIceCandidate(data);
        break;
    }
  };

  const createSession = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: createSessionId() }),
      });

      const session = await response.json();
      setSessionId(session.sessionId);

      // Join the session as host
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'join-session',
          sessionId: session.sessionId,
          data: { isHost: true }
        }));
      }

      return session.sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, []);

  const joinSession = useCallback(async (targetSessionId: string) => {
    try {
      // Check if session exists
      const response = await fetch(`/api/sessions/${targetSessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }

      setSessionId(targetSessionId);

      // Join the session as viewer
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'join-session',
          sessionId: targetSessionId,
          data: { isHost: false }
        }));
      }

      return targetSessionId;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }, []);

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = createPeerConnection();
      setupPeerConnectionEvents();
    }

    const pc = peerConnectionRef.current;

    // Add local stream if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Create data channel for file transfer
    const dataChannel = pc.createDataChannel('fileTransfer', {
      ordered: true
    });
    dataChannelRef.current = dataChannel;
    setupDataChannelEvents(dataChannel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'offer',
        sessionId,
        data: offer
      }));
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = createPeerConnection();
      setupPeerConnectionEvents();
    }

    const pc = peerConnectionRef.current;

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'answer',
        sessionId,
        data: answer
      }));
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  };

  const setupPeerConnectionEvents = () => {
    const pc = peerConnectionRef.current!;

    pc.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          sessionId,
          data: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      setSignalingState(pc.signalingState);
    };

    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;
      setupDataChannelEvents(dataChannel);
    };
  };

  const setupDataChannelEvents = (dataChannel: RTCDataChannel) => {
    dataChannel.onopen = () => {
      setDataChannelState('open');
      console.log('Data channel opened');
    };

    dataChannel.onclose = () => {
      setDataChannelState('closed');
      console.log('Data channel closed');
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  };

  const startScreenShare = useCallback(async (options: ScreenShareOptions) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          mediaSource: 'screen',
          width: { ideal: options.videoQuality === 'high' ? 1920 : options.videoQuality === 'medium' ? 1280 : 854 },
          height: { ideal: options.videoQuality === 'high' ? 1080 : options.videoQuality === 'medium' ? 720 : 480 },
          frameRate: { ideal: options.frameRate }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      localStreamRef.current = stream;
      setIsScreenSharing(true);

      // Add tracks to peer connection if it exists
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream);
        });

        // Renegotiate
        await createOffer();
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        localStreamRef.current = null;
      };

    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, [sessionId]);

  const stopScreenShare = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setIsScreenSharing(false);

      // Remove tracks from peer connection
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        senders.forEach(sender => {
          if (sender.track) {
            peerConnectionRef.current!.removeTrack(sender);
          }
        });

        // Renegotiate
        await createOffer();
      }
    }
  }, []);

  // Update connection stats periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (peerConnectionRef.current && isConnected) {
        try {
          const stats = await peerConnectionRef.current.getStats();
          let latency = '--';
          let bandwidth = '--';
          let quality = '--';

          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              latency = report.currentRoundTripTime ? `${Math.round(report.currentRoundTripTime * 1000)}` : '--';
            }
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
              if (report.bytesReceived) {
                const mbps = (report.bytesReceived * 8) / (1024 * 1024);
                bandwidth = `${mbps.toFixed(1)} Mbps`;
              }
              if (report.framesPerSecond) {
                quality = `${report.framesPerSecond} FPS`;
              }
            }
          });

          setConnectionStats({ latency, bandwidth, quality });
        } catch (error) {
          console.error('Error getting connection stats:', error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    sessionId,
    isConnected,
    isScreenSharing,
    remoteStream,
    connectionState,
    iceConnectionState,
    signalingState,
    dataChannelState,
    connectionStats,
    dataChannel: dataChannelRef.current,
    createSession,
    joinSession,
    startScreenShare,
    stopScreenShare,
  };
}
