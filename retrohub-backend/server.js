require('dotenv').config();

const express=require('express');
const http = require('http');           
const { Server } = require('socket.io'); 
const cors=require('cors');
const connectDB = require('./config/db');
const app=express();
const PORT = process.env.PORT || 5001;

const FRONTEND_PROD = process.env.FRONTEND_URL;
const FRONTEND_LOCAL = process.env.FRONTEND_URL_LOCAL;
const allowedOrigins = [FRONTEND_PROD];
if (FRONTEND_LOCAL) allowedOrigins.push(FRONTEND_LOCAL);


const corsOptions = {
    origin: allowedOrigins,
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json())
//to get body parameters
app.use(express.urlencoded({ extended: true }));


//routes
const authRoutes=require('./routes/authRoutes');
app.use('/api/auth',authRoutes);

const teamRoutes=require('./routes/teamRoutes');
app.use('/api/team',teamRoutes);

const joinTeamRoutes=require('./routes/joinTeamRoutes');
app.use('/api/join-team',joinTeamRoutes);

const feedbackRoutes=require('./routes/feedbackRoutes');
app.use('/api/feedback/',feedbackRoutes);

const discussionRoutes=require('./routes/discussionRoutes');
app.use('/api/discussion',discussionRoutes);

const contactRoutes=require('./routes/contactRoutes');
app.use('/api/contact',contactRoutes);

const profileRoutes=require('./routes/profileRoutes');
app.use('/api',profileRoutes);
connectDB();//call to mongoose.connecet in config/db.js

  
// Basic route for testing
        app.get('/', (req, res) => {
            res.send('Backend server is running!');
        });

const server = http.createServer(app); // wrap Express app
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

// Listen for socket connections
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Listen for feedback added from frontend
    socket.on("feedbackAdded", (newFeedback) => {
        console.log("Feedback received via socket:", newFeedback);
        // Broadcast to all clients
        io.emit("feedbackAdded", newFeedback);
    });

    socket.on("joinDiscussion", (discussionId) => {
    socket.join(discussionId);
    console.log(`Socket ${socket.id} joined discussion ${discussionId}`);
    });

     socket.on("newMessage", (msg) => {
    console.log("New discussion message:", msg);
    io.to(msg.feedbackId).emit("newMessage", msg); // emit to that feedback/discussion room
  });


    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

module.exports.io = io;

server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
});

