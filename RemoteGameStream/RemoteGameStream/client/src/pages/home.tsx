import { useState } from "react";
import { ConnectionPanel } from "@/components/connection-panel";
import { FileTransferPanel } from "@/components/file-transfer-panel";
import { RemoteScreenViewer } from "@/components/remote-screen-viewer";
import { ConnectionInfo } from "@/components/connection-info";
import { useWebRTC } from "@/hooks/use-webrtc";
import { Monitor, Eye } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<'host' | 'viewer'>('host');
  const { 
    connectionState, 
    sessionId, 
    isConnected,
    remoteStream,
    connectionStats,
    iceConnectionState,
    signalingState,
    dataChannelState
  } = useWebRTC(mode);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Monitor className="text-primary text-2xl" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Remote Desktop</h1>
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">WebRTC Powered</span>
            </div>
            
            {/* Mode Selection */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setMode('host')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                    mode === 'host' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Host</span>
                </button>
                <button 
                  onClick={() => setMode('viewer')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                    mode === 'viewer' 
                      ? 'bg-primary text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Viewer</span>
                </button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400 animate-pulse'
                }`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <ConnectionPanel 
              mode={mode} 
              sessionId={sessionId}
              connectionState={connectionState}
              connectionStats={connectionStats}
            />
            <RemoteScreenViewer remoteStream={remoteStream} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <FileTransferPanel sessionId={sessionId} isConnected={isConnected} />
            <ConnectionInfo 
              iceConnectionState={iceConnectionState}
              signalingState={signalingState}
              dataChannelState={dataChannelState}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
