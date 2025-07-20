import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { webRTCMessageSchema, type WebRTCMessage } from "@shared/schema";
import { nanoid } from "nanoid";

interface ExtendedWebSocket extends WebSocket {
  sessionId?: string;
  isHost?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const connections = new Map<string, ExtendedWebSocket[]>();
  
  // API Routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionId = nanoid(12).toUpperCase();
      const hostId = nanoid();
      
      const session = await storage.createSession({
        sessionId,
        hostId,
        isActive: true,
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });
  
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });
  
  app.post("/api/file-transfers", async (req, res) => {
    try {
      const transferId = nanoid();
      const transfer = await storage.createFileTransfer({
        ...req.body,
        transferId,
        status: 'pending',
        progress: 0,
      });
      res.json(transfer);
    } catch (error) {
      console.error("Error creating file transfer:", error);
      res.status(500).json({ error: "Failed to create file transfer" });
    }
  });
  
  app.put("/api/file-transfers/:transferId", async (req, res) => {
    try {
      const { progress, status } = req.body;
      await storage.updateFileTransferProgress(req.params.transferId, progress, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating file transfer:", error);
      res.status(500).json({ error: "Failed to update file transfer" });
    }
  });
  
  // WebSocket signaling server
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message: WebRTCMessage = JSON.parse(data.toString());
        const validatedMessage = webRTCMessageSchema.parse(message);
        
        console.log('Received message:', validatedMessage.type);
        
        switch (validatedMessage.type) {
          case 'join-session':
            await handleJoinSession(ws, validatedMessage);
            break;
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            await handleSignalingMessage(ws, validatedMessage);
            break;
          case 'file-transfer-start':
          case 'file-transfer-chunk':
          case 'file-transfer-complete':
            await handleFileTransferMessage(ws, validatedMessage);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'session-error',
          data: { error: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Remove from connections
      for (const [sessionId, sessionConnections] of Array.from(connections.entries())) {
        const index = sessionConnections.indexOf(ws);
        if (index !== -1) {
          sessionConnections.splice(index, 1);
          if (sessionConnections.length === 0) {
            connections.delete(sessionId);
            // Mark session as inactive
            storage.updateSessionStatus(sessionId, false);
          }
          break;
        }
      }
    });
  });
  
  async function handleJoinSession(ws: ExtendedWebSocket, message: WebRTCMessage) {
    const { sessionId, data } = message;
    
    if (!sessionId) {
      ws.send(JSON.stringify({
        type: 'session-error',
        data: { error: 'Session ID required' }
      }));
      return;
    }
    
    // Check if session exists
    const session = await storage.getSession(sessionId);
    if (!session || !session.isActive) {
      ws.send(JSON.stringify({
        type: 'session-error',
        data: { error: 'Session not found or inactive' }
      }));
      return;
    }
    
    ws.sessionId = sessionId;
    ws.isHost = data?.isHost || false;
    
    // Add to connections
    if (!connections.has(sessionId)) {
      connections.set(sessionId, []);
    }
    connections.get(sessionId)!.push(ws);
    
    // Notify successful join
    ws.send(JSON.stringify({
      type: 'session-joined',
      sessionId,
      data: { isHost: ws.isHost }
    }));
    
    // Notify other participants
    const sessionConnections = connections.get(sessionId)!;
    sessionConnections.forEach(conn => {
      if (conn !== ws && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify({
          type: 'session-joined',
          sessionId,
          data: { participantJoined: true, isHost: ws.isHost }
        }));
      }
    });
  }
  
  async function handleSignalingMessage(ws: ExtendedWebSocket, message: WebRTCMessage) {
    if (!ws.sessionId) return;
    
    // Forward signaling messages to other participants in the session
    const sessionConnections = connections.get(ws.sessionId);
    if (!sessionConnections) return;
    
    sessionConnections.forEach(conn => {
      if (conn !== ws && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify(message));
      }
    });
  }
  
  async function handleFileTransferMessage(ws: ExtendedWebSocket, message: WebRTCMessage) {
    if (!ws.sessionId) return;
    
    // Forward file transfer messages to other participants
    const sessionConnections = connections.get(ws.sessionId);
    if (!sessionConnections) return;
    
    sessionConnections.forEach(conn => {
      if (conn !== ws && conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify(message));
      }
    });
  }
  
  return httpServer;
}
