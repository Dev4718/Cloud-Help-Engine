const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer'); // For file uploads
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Setup static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Handle real-time chat using Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Broadcast message to all users
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Setup file upload handling
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    res.send(`File uploaded: ${req.file.originalname}`);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


