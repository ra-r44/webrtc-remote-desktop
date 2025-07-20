import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileTransfer } from "@/hooks/use-file-transfer";
import { 
  Upload, 
  Download, 
  File, 
  FileImage, 
  FileText, 
  FileVideo,
  X,
  CheckCircle
} from "lucide-react";

interface FileTransferPanelProps {
  sessionId: string | null;
  isConnected: boolean;
}

interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'downloading' | 'completed' | 'failed';
  speed?: string;
}

export function FileTransferPanel({ sessionId, isConnected }: FileTransferPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendFile, transfers, stats } = useFileTransfer(sessionId);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files: FileList) => {
    if (!isConnected || !sessionId) return;

    Array.from(files).forEach(file => {
      sendFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-4 h-4 text-blue-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4 text-purple-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Transfer</CardTitle>
        <CardDescription>
          Send and receive files via secure WebRTC data channels
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : isConnected 
                ? 'border-gray-300 hover:border-primary' 
                : 'border-gray-200 opacity-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => isConnected && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-2">
            {isConnected 
              ? 'Drop files here or click to browse'
              : 'Connect to a session to transfer files'
            }
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Supports images, documents, videos up to 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            disabled={!isConnected}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!isConnected}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Choose Files
          </Button>
        </div>

        {/* Active Transfers */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Active Transfers</h3>
          <div className="space-y-3">
            {transfers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No active transfers</p>
              </div>
            ) : (
              transfers.map((transfer) => (
                <div key={transfer.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(transfer.type)}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {transfer.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(transfer.size)}
                      </span>
                      {transfer.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  {transfer.status !== 'completed' && (
                    <>
                      <Progress value={transfer.progress} className="mb-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {transfer.status === 'uploading' ? 'Uploading' : 'Downloading'}... {transfer.progress}%
                        </span>
                        {transfer.speed && <span>{transfer.speed}</span>}
                      </div>
                    </>
                  )}
                  
                  {transfer.status === 'completed' && (
                    <div className="flex items-center justify-between text-xs text-green-600">
                      <span>Transfer completed</span>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transfer Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Session Statistics</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Files Sent</span>
              <span className="font-medium">{stats.filesSent}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Files Received</span>
              <span className="font-medium">{stats.filesReceived}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Data Transferred</span>
              <span className="font-medium">{stats.dataTransferred}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Speed</span>
              <span className="font-medium">{stats.avgSpeed}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
