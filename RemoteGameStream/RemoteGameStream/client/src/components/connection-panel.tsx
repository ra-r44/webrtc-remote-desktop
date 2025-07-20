import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebRTC } from "@/hooks/use-webrtc";
import { Copy, Play, Square, Info, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectionPanelProps {
  mode: 'host' | 'viewer';
  sessionId: string | null;
  connectionState: string;
  connectionStats: {
    latency: string;
    bandwidth: string;
    quality: string;
  };
}

export function ConnectionPanel({ mode, sessionId, connectionState, connectionStats }: ConnectionPanelProps) {
  const { toast } = useToast();
  const { 
    createSession, 
    joinSession, 
    startScreenShare, 
    stopScreenShare, 
    isScreenSharing,
    isConnected 
  } = useWebRTC(mode);
  
  const [connectSessionId, setConnectSessionId] = useState('');
  const [videoQuality, setVideoQuality] = useState('medium');
  const [frameRate, setFrameRate] = useState('30');

  const handleCopySessionId = async () => {
    if (sessionId) {
      try {
        await navigator.clipboard.writeText(sessionId);
        toast({
          title: "Session ID copied",
          description: "Session ID has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy session ID to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateSession = async () => {
    try {
      await createSession();
      toast({
        title: "Session created",
        description: "Your session is ready for connections",
      });
    } catch (error) {
      toast({
        title: "Session creation failed",
        description: "Unable to create session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinSession = async () => {
    if (!connectSessionId.trim()) {
      toast({
        title: "Session ID required",
        description: "Please enter a valid session ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await joinSession(connectSessionId.trim().toUpperCase());
      toast({
        title: "Connecting...",
        description: "Attempting to join session",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to join session. Please check the session ID.",
        variant: "destructive",
      });
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
        toast({
          title: "Screen sharing stopped",
          description: "Your screen is no longer being shared",
        });
      } else {
        await startScreenShare({ videoQuality, frameRate: parseInt(frameRate) });
        toast({
          title: "Screen sharing started",
          description: "Your screen is now being shared",
        });
      }
    } catch (error) {
      toast({
        title: "Screen sharing error",
        description: "Failed to toggle screen sharing. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <CardDescription>
          Establish secure peer-to-peer connection for screen sharing and file transfer
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {mode === 'host' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Info className="text-primary mr-2 w-4 h-4" />
                <span className="font-medium text-primary">Host Mode Active</span>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Share your screen and files with remote viewers. Your session ID will be generated automatically.
              </p>
              
              {sessionId ? (
                <div className="space-y-3">
                  <Label htmlFor="sessionId">Session ID</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="sessionId"
                      value={sessionId}
                      readOnly
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopySessionId}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Share this ID with viewers to allow them to connect to your session
                  </p>
                </div>
              ) : (
                <Button onClick={handleCreateSession} className="w-full">
                  Create Session
                </Button>
              )}
            </div>

            {sessionId && (
              <>
                {/* Screen Sharing Controls */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Screen Sharing</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isScreenSharing ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {isScreenSharing ? 'Sharing active' : 'Ready to share'}
                      </span>
                    </div>
                    <Button 
                      onClick={handleToggleScreenShare}
                      variant={isScreenSharing ? "destructive" : "default"}
                      size="sm"
                    >
                      {isScreenSharing ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Sharing
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Sharing
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quality Settings */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Quality Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="videoQuality">Video Quality</Label>
                      <Select value={videoQuality} onValueChange={setVideoQuality}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High (1080p)</SelectItem>
                          <SelectItem value="medium">Medium (720p)</SelectItem>
                          <SelectItem value="low">Low (480p)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="frameRate">Frame Rate</Label>
                      <Select value={frameRate} onValueChange={setFrameRate}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                          <SelectItem value="15">15 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Eye className="text-emerald-600 mr-2 w-4 h-4" />
                <span className="font-medium text-emerald-800">Viewer Mode Active</span>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                Connect to a host's session to view their screen and transfer files.
              </p>
              
              <div className="space-y-3">
                <Label htmlFor="connectSessionId">Enter Session ID</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="connectSessionId"
                    placeholder="HD7X-9K2L-P4M8"
                    value={connectSessionId}
                    onChange={(e) => setConnectSessionId(e.target.value.toUpperCase())}
                    className="font-mono text-sm uppercase"
                  />
                  <Button onClick={handleJoinSession} disabled={!connectSessionId.trim()}>
                    Connect
                  </Button>
                </div>
              </div>
            </div>

            {/* Connection Progress */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Connection Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Signaling Server</span>
                  <span className="text-success font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Peer Discovery</span>
                  <span className={`font-medium ${
                    isConnected ? 'text-success' : 'text-warning'
                  }`}>
                    {isConnected ? 'Connected' : 'Searching...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">WebRTC Connection</span>
                  <span className={`font-medium ${
                    connectionState === 'connected' ? 'text-success' : 'text-gray-400'
                  }`}>
                    {connectionState || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{connectionStats.latency}</div>
            <div className="text-xs text-gray-500">Latency (ms)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{connectionStats.bandwidth}</div>
            <div className="text-xs text-gray-500">Bandwidth</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{connectionStats.quality}</div>
            <div className="text-xs text-gray-500">Quality</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
