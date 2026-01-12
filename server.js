const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const startAuctionCron = require("./services/auctionCron");
require("dotenv").config();

const port = process.env.PORT;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for mobile app
    methods: ["GET", "POST"],
  },
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.buyerId || decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} (${socket.userRole})`);

  // Join a specific sale room
  socket.on("join-sale-room", (saleId) => {
    socket.join(`sale-${saleId}`);
    console.log(`User ${socket.id} joined sale room: ${saleId}`);
  });

  // Leave a sale room
  socket.on("leave-sale-room", (saleId) => {
    socket.leave(`sale-${saleId}`);
    console.log(`User ${socket.id} left sale room: ${saleId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set("io", io);

// Connect to MongoDB FIRST, then start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    // Start auction cron job with io
    startAuctionCron(io);

    // Start the server only after MongoDB is connected
    server.listen(port, "0.0.0.0", () => {
      console.log(`App running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  switch (error.code) {
    case "EACCES":
      console.error(port + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(port + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});
