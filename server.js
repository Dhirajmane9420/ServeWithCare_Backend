// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allow both local & deployed frontend
const FRONTEND_URLS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://serve-with-care-frontend.vercel.app' // <-- Deployed frontend URL
];

// ✅ CORS configuration
const corsOptions = {
  origin: FRONTEND_URLS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions)); // Apply CORS globally

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- Initialize Socket.IO Server ---
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- MongoDB Model for Chat ---
const ChatMessage = require('./models/ChatMessage');

// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  console.log(`[Socket.IO] User Connected: ${socket.id}`);

  socket.on('join_chat', (requestId) => {
    socket.join(requestId);
    console.log(`[Socket.IO] User ${socket.id} joined room: ${requestId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = new ChatMessage({
        request: data.requestId,
        senderRole: data.sender,
        senderName: data.senderName,
        text: data.text,
      });
      await newMessage.save();

      io.to(data.requestId).emit('receive_message', newMessage);
    } catch (error) {
      console.error('Error saving/broadcasting message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User Disconnected: ${socket.id}`);
  });
});

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/requests', require('./routes/requests'));

// --- Chat History Route ---
app.get('/api/chat/:requestId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ request: req.params.requestId })
      .select('senderRole text timestamp senderName')
      .sort('timestamp');
    res.json(messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// --- Root route (optional check) ---
app.get('/', (req, res) => {
  res.send('✅ ServeWithCare Backend is running...');
});

// --- Start the Server ---
server.listen(PORT, () => {
  console.log(`HTTP/Socket.IO Server running on port ${PORT}`);
});
