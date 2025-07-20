# WebRTC Remote Desktop Application

## Overview

This is a full-stack web application that provides secure peer-to-peer remote desktop sharing and file transfer capabilities using WebRTC technology. The application allows users to host and connect to remote desktop sessions directly through a web browser without requiring any extensions or additional software installations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **WebSocket**: Native WebSocket API with `ws` library for real-time signaling
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **Session Management**: In-memory storage with database fallback option
- **Build System**: esbuild for server-side compilation

### Real-time Communication
- **WebRTC**: Peer-to-peer connection for screen sharing and data transfer
- **Signaling Server**: WebSocket-based signaling for WebRTC negotiation
- **STUN Servers**: Multiple Google STUN servers for NAT traversal

## Key Components

### Session Management
- **Session Creation**: Generate unique session IDs using nanoid for secure connections
- **Connection Tracking**: Monitor active sessions and connection states
- **Host/Viewer Modes**: Distinct roles for sharing and viewing screens

### WebRTC Implementation
- **Screen Capture**: Browser-native screen sharing API integration
- **Data Channels**: Reliable data transfer for file sharing
- **Connection States**: Comprehensive monitoring of ICE, signaling, and data channel states
- **Quality Controls**: Configurable video quality and frame rate settings

### File Transfer System
- **Chunked Transfer**: Large files split into 64KB chunks for reliable transfer
- **Progress Tracking**: Real-time progress monitoring with speed calculations
- **File Validation**: Type and size restrictions for security
- **Drag & Drop**: Intuitive file selection interface

### User Interface
- **Responsive Design**: Mobile-first approach with desktop optimizations
- **Dark/Light Theme**: CSS variables-based theming system
- **Real-time Feedback**: Connection status indicators and progress displays
- **Accessibility**: ARIA-compliant components from Radix UI

## Data Flow

1. **Session Initiation**: Host creates session via REST API, receives unique session ID
2. **WebSocket Connection**: Both host and viewer establish WebSocket connections
3. **WebRTC Signaling**: Exchange of offers, answers, and ICE candidates through WebSocket
4. **Peer Connection**: Direct WebRTC connection established between browsers
5. **Screen Sharing**: Host captures screen and streams to viewer via WebRTC
6. **File Transfer**: Files transferred through WebRTC data channels with chunking

## External Dependencies

### Core Libraries
- **WebRTC APIs**: Browser-native WebRTC implementation
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless)
- **UI Components**: Comprehensive Radix UI component library
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle Kit**: Database migrations and schema management
- **Vite Plugins**: Development server enhancements and error handling

### Signaling Infrastructure
- **STUN Servers**: Public Google STUN servers for NAT traversal
- **WebSocket**: Real-time bidirectional communication for signaling

## Deployment Status

### Hosting Challenges
- **Railway**: Now requires $5/month minimum but provides full WebSocket support
- **Vercel**: Has limitations with WebSocket connections needed for WebRTC signaling
- **Render**: Directory path issues during deployment
- **Netlify**: Better for static sites, limited backend WebSocket support

### Recommended Solution
- **Railway ($5/month)**: Best for full WebRTC functionality with zero configuration
- **Split deployment**: Free option using Netlify frontend + Railway backend
- **Current status**: Deployment files created for multiple platforms (railway.json, vercel.json, render.yaml)

## Deployment Strategy

### Development Environment
- **Concurrent Servers**: Vite dev server for frontend, Express for backend
- **Hot Reload**: Vite HMR for instant frontend updates
- **TypeScript Checking**: Real-time type checking during development

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild compiles Node.js server to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production

### Database Setup
- **Schema Management**: Drizzle migrations in `migrations/` directory
- **Environment Configuration**: DATABASE_URL environment variable required
- **Connection Pooling**: Neon serverless driver handles connection management

### Security Considerations
- **HTTPS Required**: WebRTC requires secure contexts for screen sharing
- **Session Isolation**: Unique session IDs prevent unauthorized access
- **File Transfer Limits**: 100MB file size limit and type restrictions
- **CORS Configuration**: Proper origin validation for WebSocket connections