const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

wss.on('connection', (ws) => {
  const userId = generateUniqueId(); // Generate a unique ID for each connection
  console.log(`Client connected with ID: ${userId}`);

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    const data = JSON.parse(message);
    data.userId = userId; // Add the userId to the message data

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log('Broadcasting message to a client');
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${userId}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});