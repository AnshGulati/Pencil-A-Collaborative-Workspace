const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

wss.on('connection', (ws) => {
  const userId = uuidv4(); // Generate a unique user ID
  console.log('Client connected with ID:', userId);

  // Send the user ID to the client
  ws.send(JSON.stringify({ type: 'userId', userId: userId }));

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    
    // Parse the message
    const data = JSON.parse(message);
    
    if (!data.userId) {
      data.userId = userId;
    }

    // If it's a draw event and doesn't have a strokeId, add one
    

    // Broadcast to all clients except the sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log('Broadcasting message to a client');
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected:', userId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});