import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

const httpServer = createServer(app);

// In-memory storage for sessions and file transfers
const sessions = new Map();
const fileTransfers = new Map();

// WebSocket server for signaling
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Store active connections
const connections = new Map();

// API Routes
app.post("/api/sessions", async (req, res) => {
  try {
    const sessionId = nanoid(12).toUpperCase();
    const hostId = nanoid();
    
    const session = {
      id: sessionId,
      sessionId,
      hostId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    sessions.set(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.get("/api/sessions/:sessionId", async (req, res) => {
  try {
    const session = sessions.get(req.params.sessionId);
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
    const transfer = {
      ...req.body,
      transferId,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    fileTransfers.set(transferId, transfer);
    res.json(transfer);
  } catch (error) {
    console.error("Error creating file transfer:", error);
    res.status(500).json({ error: "Failed to create file transfer" });
  }
});

app.put("/api/file-transfers/:transferId", async (req, res) => {
  try {
    const { progress, status } = req.body;
    const transfer = fileTransfers.get(req.params.transferId);
    if (transfer) {
      transfer.progress = progress;
      transfer.status = status;
      transfer.updatedAt = new Date().toISOString();
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating file transfer:", error);
    res.status(500).json({ error: "Failed to update file transfer" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "WebRTC Backend Server Running", timestamp: new Date().toISOString() });
});

// WebSocket handling for signaling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join-session':
          ws.sessionId = message.sessionId;
          ws.isHost = message.isHost;
          
          if (!connections.has(message.sessionId)) {
            connections.set(message.sessionId, []);
          }
          connections.get(message.sessionId).push(ws);
          
          ws.send(JSON.stringify({ type: 'joined', sessionId: message.sessionId }));
          
          // Notify other clients in the session
          broadcastToSession(message.sessionId, {
            type: 'peer-joined',
            isHost: message.isHost
          }, ws);
          break;
          
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward signaling messages to other peers in the session
          if (ws.sessionId) {
            broadcastToSession(ws.sessionId, message, ws);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket disconnected');
    if (ws.sessionId && connections.has(ws.sessionId)) {
      const sessionConnections = connections.get(ws.sessionId);
      const index = sessionConnections.indexOf(ws);
      if (index > -1) {
        sessionConnections.splice(index, 1);
      }
      
      // Clean up empty sessions
      if (sessionConnections.length === 0) {
        connections.delete(ws.sessionId);
      } else {
        // Notify remaining clients
        broadcastToSession(ws.sessionId, {
          type: 'peer-left',
          isHost: ws.isHost
        });
      }
    }
  });
});

function broadcastToSession(sessionId, message, excludeWs = null) {
  const sessionConnections = connections.get(sessionId);
  if (sessionConnections) {
    sessionConnections.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const port = parseInt(process.env.PORT || '5000', 10);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`WebRTC Backend Server running on port ${port}`);
});