import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  hostId: text("host_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileTransfers = pgTable("file_transfers", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  transferId: text("transfer_id").notNull().unique(),
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertFileTransferSchema = createInsertSchema(fileTransfers).omit({
  id: true,
  createdAt: true,
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type FileTransfer = typeof fileTransfers.$inferSelect;
export type InsertFileTransfer = z.infer<typeof insertFileTransferSchema>;

// WebRTC Message Types
export const webRTCMessageSchema = z.object({
  type: z.enum(['offer', 'answer', 'ice-candidate', 'join-session', 'session-created', 'session-joined', 'session-error', 'file-transfer-start', 'file-transfer-chunk', 'file-transfer-complete']),
  sessionId: z.string().optional(),
  data: z.any().optional(),
});

export type WebRTCMessage = z.infer<typeof webRTCMessageSchema>;
