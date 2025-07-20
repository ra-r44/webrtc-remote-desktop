import { nanoid } from "nanoid";

export function createSessionId(): string {
  return nanoid(12).toUpperCase();
}

export function createPeerConnection(): RTCPeerConnection {
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" }
    ],
    iceCandidatePoolSize: 10
  };

  return new RTCPeerConnection(configuration);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSecond: number): string {
  const mbps = (bytesPerSecond * 8) / (1024 * 1024);
  return `${mbps.toFixed(1)} Mbps`;
}

export function generateFileId(): string {
  return nanoid(16);
}

export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/', 'video/', 'audio/', 'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument',
    'text/', 'application/json', 'application/zip'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit' };
  }

  const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
  if (!isAllowedType) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}
