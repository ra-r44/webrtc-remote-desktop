# WebRTC Remote Desktop - One-Click Deploy

A web-based remote desktop solution that works like Parsec but in any web browser - no downloads required.

**👉 See DEPLOYMENT_STEPS.md for simple deployment instructions**

## Features
- 🖥️ **Screen sharing** - no extensions needed
- 📁 **File transfers** - automatic downloads  
- 📱 **Mobile support** - works on phones/tablets
- 🔒 **Session security** - unique IDs for privacy
- 🌐 **Global access** - works anywhere with internet

## User Experience
**Host**: Visit URL → "Host" → Create session → Share ID → Start sharing
**Viewer**: Visit URL → "Viewer" → Enter ID → Connect → See screen instantly

## Quick Start

### Prerequisites

- Node.js 18+ 
- Modern web browser with WebRTC support
- HTTPS connection (required for screen sharing)

### Installation

1. Download and extract the application files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5000`

### Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## How to Use

### Host Mode (Share Your Screen)
1. Select "Host" mode
2. Click "Create Session"
3. Share the generated session ID with viewers
4. Click "Start Sharing" to begin screen sharing
5. Drag and drop files to transfer them

### Viewer Mode (View Remote Screen)
1. Select "Viewer" mode  
2. Enter the session ID provided by the host
3. Click "Connect"
4. View the shared screen and receive files

## Deployment Options

### 1. Self-Hosting with Node.js

Deploy on any server with Node.js support:

```bash
# Clone or upload files to your server
npm install --production
npm run build
npm start
```

### 2. Static Hosting (Frontend Only)

For viewer-only functionality, you can deploy just the frontend:

```bash
npm run build
# Upload the dist/public folder to any static hosting service
```

### 3. Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### 4. Cloud Platforms

- **Vercel**: Deploy directly from Git repository
- **Netlify**: Upload the built files or connect Git repo
- **Heroku**: Push code and deploy with Node.js buildpack
- **Railway**: Connect Git repo for automatic deployment

## Environment Variables

Set these for production deployment:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgres_connection_string (optional)
```

## Security Considerations

- **HTTPS Required**: Screen sharing only works over HTTPS
- **Firewall**: Ensure WebRTC ports are accessible
- **Session IDs**: Keep session IDs private and secure
- **File Limits**: Default 100MB file size limit

## Browser Support

- Chrome 72+
- Firefox 66+
- Safari 13+
- Edge 79+

## Technical Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + WebSocket
- **WebRTC**: Native browser APIs for peer-to-peer communication
- **Database**: In-memory storage (PostgreSQL optional)

## File Structure

```
├── client/           # Frontend React application
├── server/           # Backend Node.js server
├── shared/           # Shared types and schemas
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Support

For issues or questions about deployment, check the browser console for WebRTC connection errors and ensure HTTPS is properly configured.