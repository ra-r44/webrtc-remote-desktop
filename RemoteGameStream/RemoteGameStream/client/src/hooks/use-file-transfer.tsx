import { useState, useEffect, useRef, useCallback } from "react";
import { useWebRTC } from "./use-webrtc";
import { nanoid } from "nanoid";

interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'downloading' | 'completed' | 'failed';
  speed?: string;
  startTime?: number;
}

interface TransferStats {
  filesSent: number;
  filesReceived: number;
  dataTransferred: string;
  avgSpeed: string;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export function useFileTransfer(sessionId: string | null) {
  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
  const [stats, setStats] = useState<TransferStats>({
    filesSent: 0,
    filesReceived: 0,
    dataTransferred: '0 MB',
    avgSpeed: '0 MB/s'
  });

  const pendingTransfers = useRef<Map<string, any>>(new Map());
  const receivingFiles = useRef<Map<string, { chunks: ArrayBuffer[], totalSize: number, receivedSize: number, metadata: any }>>(new Map());

  const { dataChannel } = useWebRTC('host'); // Mode doesn't matter for data channel access

  useEffect(() => {
    if (dataChannel) {
      dataChannel.onmessage = handleDataChannelMessage;
    }
  }, [dataChannel]);

  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'file-transfer-start':
          handleFileTransferStart(data);
          break;
        case 'file-transfer-chunk':
          handleFileTransferChunk(data);
          break;
        case 'file-transfer-complete':
          handleFileTransferComplete(data);
          break;
      }
    } catch (error) {
      // Handle binary data (file chunks)
      console.log('Received binary data chunk');
    }
  };

  const handleFileTransferStart = (data: any) => {
    const { transferId, filename, fileSize, fileType } = data;
    
    // Create new transfer entry
    const transfer: FileTransferItem = {
      id: transferId,
      name: filename,
      size: fileSize,
      type: fileType,
      progress: 0,
      status: 'downloading'
    };

    setTransfers(prev => [...prev, transfer]);

    // Initialize receiving file
    receivingFiles.current.set(transferId, {
      chunks: [],
      totalSize: fileSize,
      receivedSize: 0,
      metadata: { filename, fileType }
    });
  };

  const handleFileTransferChunk = (data: any) => {
    const { transferId, chunkIndex, chunk } = data;
    const receivingFile = receivingFiles.current.get(transferId);
    
    if (receivingFile) {
      // Convert base64 chunk back to ArrayBuffer
      const binaryString = atob(chunk);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      receivingFile.chunks[chunkIndex] = bytes.buffer;
      receivingFile.receivedSize += bytes.length;
      
      const progress = Math.round((receivingFile.receivedSize / receivingFile.totalSize) * 100);
      
      setTransfers(prev => prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, progress }
          : transfer
      ));
    }
  };

  const handleFileTransferComplete = (data: any) => {
    const { transferId } = data;
    const receivingFile = receivingFiles.current.get(transferId);
    
    if (receivingFile) {
      // Reconstruct file from chunks
      const blob = new Blob(receivingFile.chunks, { type: receivingFile.metadata.fileType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = receivingFile.metadata.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      setTransfers(prev => prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: 'completed', progress: 100 }
          : transfer
      ));
      
      receivingFiles.current.delete(transferId);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        filesReceived: prev.filesReceived + 1
      }));
    }
  };

  const sendFile = useCallback(async (file: File) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }

    const transferId = nanoid();
    const transfer: FileTransferItem = {
      id: transferId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'uploading',
      startTime: Date.now()
    };

    setTransfers(prev => [...prev, transfer]);

    try {
      // Send file metadata
      dataChannel.send(JSON.stringify({
        type: 'file-transfer-start',
        transferId,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type
      }));

      // Read file and send in chunks
      const arrayBuffer = await file.arrayBuffer();
      const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
        const chunk = arrayBuffer.slice(start, end);
        
        // Convert chunk to base64 for transmission
        const bytes = new Uint8Array(chunk);
        const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        const base64Chunk = btoa(binary);
        
        dataChannel.send(JSON.stringify({
          type: 'file-transfer-chunk',
          transferId,
          chunkIndex: i,
          chunk: base64Chunk
        }));

        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        const elapsed = Date.now() - transfer.startTime!;
        const speed = elapsed > 0 ? (((i + 1) * CHUNK_SIZE) / 1024 / 1024) / (elapsed / 1000) : 0;
        
        setTransfers(prev => prev.map(t => 
          t.id === transferId 
            ? { ...t, progress, speed: `${speed.toFixed(1)} MB/s` }
            : t
        ));

        // Small delay to prevent overwhelming the data channel
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Send completion message
      dataChannel.send(JSON.stringify({
        type: 'file-transfer-complete',
        transferId
      }));

      setTransfers(prev => prev.map(t => 
        t.id === transferId 
          ? { ...t, status: 'completed', progress: 100 }
          : t
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        filesSent: prev.filesSent + 1
      }));

    } catch (error) {
      console.error('Error sending file:', error);
      setTransfers(prev => prev.map(t => 
        t.id === transferId 
          ? { ...t, status: 'failed' }
          : t
      ));
    }
  }, [dataChannel]);

  // Update transfer statistics
  useEffect(() => {
    const totalBytes = transfers.reduce((sum, transfer) => 
      transfer.status === 'completed' ? sum + transfer.size : sum, 0
    );
    
    const totalMB = totalBytes / (1024 * 1024);
    const completedTransfers = transfers.filter(t => t.status === 'completed');
    const totalTime = completedTransfers.reduce((sum, transfer) => {
      if (transfer.startTime) {
        return sum + (Date.now() - transfer.startTime);
      }
      return sum;
    }, 0);
    
    const avgSpeed = totalTime > 0 ? (totalMB / (totalTime / 1000)) : 0;

    setStats(prev => ({
      ...prev,
      dataTransferred: `${totalMB.toFixed(1)} MB`,
      avgSpeed: `${avgSpeed.toFixed(1)} MB/s`
    }));
  }, [transfers]);

  return {
    transfers,
    stats,
    sendFile
  };
}
