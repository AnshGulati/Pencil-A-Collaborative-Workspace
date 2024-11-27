const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const roomManager = require('./roomManager');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track active connections and their rooms
const connections = new Map();

// CORS configuration
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const userId = uuidv4();
    console.log('Client connected:', userId);

    // Extract roomId from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room');

    ws.userId = userId;
    connections.set(userId, { ws, roomId });

    // Send user ID to the client immediately
    ws.send(JSON.stringify({
        type: 'userId',
        userId: userId
    }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            const connection = connections.get(userId);

            // Default the roomId from the connection if not provided
            data.roomId = data.roomId || connection.roomId;
    
            switch (data.type) {
                case 'join_room':
                    handleRoomJoin(ws, data, connection);
                    break;
                case 'leave_room':
                    handleRoomLeave(ws, connection);
                    break;
                case 'cursor_move':
                    broadcastToRoom(connection.roomId, {
                        type: 'cursor_move',
                        userId: userId,
                        position: data.position
                    }, userId);
                    break;
                case 'canvas_update':
                    handleCanvasUpdate(connection.roomId, data, userId);
                    break;
                case 'chat_message':
                    handleChatMessage(connection.roomId, data, userId);
                    break;
                
                // Drawing-related message types
                case 'drawStart':
                case 'draw':
                case 'drawEnd':
                case 'strokeSizeUpdate':
                case 'shapeStart':
                case 'shapeUpdate':
                case 'erase':
                case 'erasePixel':
                case 'neonDraw':
                case 'neonDrawEnd':
                case 'selection':
                case 'clear':
                case 'backgroundChange':
                case 'modeChange':
                case 'textStroke':
                case 'undo':
                case 'redo':
                    // Broadcast drawing events to all clients in the room
                    broadcastToRoom(connection.roomId, data, userId);
                    break;
                
                default:
                    console.log('Unknown message type:', data.type);
                    // Broadcast unknown messages to all clients in the room
                    broadcastToRoom(connection.roomId, data, userId);
            }
        } catch (error) {
            console.error('Message handling error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    });

    ws.on('close', () => {
        handleClientDisconnect(userId);
    });
});

// Room API endpoints (kept from previous implementation)
app.post('/api/rooms/create', (req, res) => {
    try {
        console.log('Create Room Request Body:', req.body);
        const { roomName, passcode } = req.body;

        if (!roomName || !passcode) {
            console.log('Missing required fields:', { roomName, passcode });
            return res.status(400).json({ message: 'Room name and passcode are required' });
        }

        const roomId = roomManager.createRoom(roomName, passcode);
        console.log('Room created successfully:', { roomId, roomName });
        return res.status(200).json({ roomId });
    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.post('/api/rooms/join', (req, res) => {
    try {
        console.log('Join Room Request:', req.body);
        const { roomId, passcode } = req.body;
        const room = roomManager.joinRoom(roomId, passcode);
        res.json({ success: true });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(400).json({ message: error.message });
    }
});

function handleRoomJoin(ws, data, connection) {
    const { roomId } = data;
    
    // Use roomExists method
    if (roomManager.roomExists(roomId)) {
        connection.roomId = roomId;
        
        // Broadcast user joined event
        broadcastToRoom(roomId, {
            type: 'user_joined',
            userId: ws.userId,
            timestamp: new Date().toISOString()
        });
        
        // Send room state to new user
        const roomState = roomManager.getRoomState(roomId);
        ws.send(JSON.stringify({
            type: 'room_state',
            state: roomState
        }));
    } else {
        // Handle case when room doesn't exist
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room does not exist'
        }));
    }
}

function handleRoomLeave(ws, connection) {
    if (connection.roomId) {
        broadcastToRoom(connection.roomId, {
            type: 'user_left',
            userId: ws.userId,
            timestamp: new Date().toISOString()
        });
        connection.roomId = null;
    }
}

function handleCanvasUpdate(roomId, data, senderId) {
    if (!roomId) return;
    
    roomManager.updateRoomState(roomId, data.canvasData);
    broadcastToRoom(roomId, {
        type: 'canvas_update',
        userId: senderId,
        canvasData: data.canvasData,
        timestamp: new Date().toISOString()
    }, senderId);
}

function handleChatMessage(roomId, data, senderId) {
    if (!roomId) return;
    
    broadcastToRoom(roomId, {
        type: 'chat_message',
        userId: senderId,
        message: data.message,
        timestamp: new Date().toISOString()
    });
}

function handleClientDisconnect(userId) {
    const connection = connections.get(userId);
    if (connection && connection.roomId) {
        broadcastToRoom(connection.roomId, {
            type: 'user_left',
            userId: userId,
            timestamp: new Date().toISOString()
        });
    }
    connections.delete(userId);
    console.log('Client disconnected:', userId);
}

// Utility function to broadcast messages to all clients in a room
function broadcastToRoom(roomId, message, excludeUserId = null) {
    if (!roomId) return;
    
    connections.forEach((connection, userId) => {
        if (connection.roomId === roomId && userId !== excludeUserId) {
            connection.ws.send(JSON.stringify(message));
        }
    });
}

// Additional API endpoints
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

module.exports = { app, server, wss };