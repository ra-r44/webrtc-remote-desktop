import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ConnectionInfoProps {
  iceConnectionState: string;
  signalingState: string;
  dataChannelState: string;
}

export function ConnectionInfo({ 
  iceConnectionState, 
  signalingState, 
  dataChannelState 
}: ConnectionInfoProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'connected':
      case 'stable':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'connecting':
      case 'checking':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
      case 'failed':
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ICE Connection State */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ICE State</span>
          <Badge className={getStateColor(iceConnectionState)}>
            {iceConnectionState || 'unknown'}
          </Badge>
        </div>
        
        {/* Signaling State */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Signaling</span>
          <Badge className={getStateColor(signalingState)}>
            {signalingState || 'unknown'}
          </Badge>
        </div>
        
        {/* Data Channel State */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Data Channel</span>
          <Badge className={getStateColor(dataChannelState)}>
            {dataChannelState || 'unknown'}
          </Badge>
        </div>

        {/* Network Type */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Network Type</span>
          <span className="text-gray-900 font-medium">WebRTC</span>
        </div>

        {/* Advanced Info Toggle */}
        <div className="pt-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-primary hover:text-blue-600 p-0 h-auto"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Info
          </Button>
        </div>

        {/* Advanced Information */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="mb-2">
                <span className="font-medium">Local Candidate:</span>
                <div className="font-mono text-gray-500 mt-1">
                  candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host
                </div>
              </div>
              <div>
                <span className="font-medium">Remote Candidate:</span>
                <div className="font-mono text-gray-500 mt-1">
                  candidate:1 1 UDP 2130706431 192.168.1.101 54401 typ host
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
