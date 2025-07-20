import { sessions, fileTransfers, type Session, type InsertSession, type FileTransfer, type InsertFileTransfer } from "@shared/schema";

export interface IStorage {
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  updateSessionStatus(sessionId: string, isActive: boolean): Promise<void>;
  
  // File transfer management
  createFileTransfer(transfer: InsertFileTransfer): Promise<FileTransfer>;
  updateFileTransferProgress(transferId: string, progress: number, status: string): Promise<void>;
  getFileTransfer(transferId: string): Promise<FileTransfer | undefined>;
  getSessionFileTransfers(sessionId: string): Promise<FileTransfer[]>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private fileTransfers: Map<string, FileTransfer>;
  private sessionIdCounter: number;
  private transferIdCounter: number;

  constructor() {
    this.sessions = new Map();
    this.fileTransfers = new Map();
    this.sessionIdCounter = 1;
    this.transferIdCounter = 1;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      ...insertSession,
      id: this.sessionIdCounter++,
      isActive: insertSession.isActive ?? true,
      createdAt: new Date(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async updateSessionStatus(sessionId: string, isActive: boolean): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = isActive;
      this.sessions.set(sessionId, session);
    }
  }

  async createFileTransfer(insertTransfer: InsertFileTransfer): Promise<FileTransfer> {
    const transfer: FileTransfer = {
      ...insertTransfer,
      id: this.transferIdCounter++,
      progress: insertTransfer.progress ?? 0,
      createdAt: new Date(),
    };
    this.fileTransfers.set(transfer.transferId, transfer);
    return transfer;
  }

  async updateFileTransferProgress(transferId: string, progress: number, status: string): Promise<void> {
    const transfer = this.fileTransfers.get(transferId);
    if (transfer) {
      transfer.progress = progress;
      transfer.status = status;
      this.fileTransfers.set(transferId, transfer);
    }
  }

  async getFileTransfer(transferId: string): Promise<FileTransfer | undefined> {
    return this.fileTransfers.get(transferId);
  }

  async getSessionFileTransfers(sessionId: string): Promise<FileTransfer[]> {
    return Array.from(this.fileTransfers.values()).filter(
      transfer => transfer.sessionId === sessionId
    );
  }
}

export const storage = new MemStorage();
