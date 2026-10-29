import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//Create Express App And HTTP Server
const app = express();
const server = http.createServer(app);

//Initialize Socket.io Server
export const io = new Server(server, {
    cors: {origin: "*"}
})

//Store Online Users
export const userSocketMap = {}; //{userId: socketId}

//Socket.io Connection Handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;
    //Emit All Users To All Connected Clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

//Middleware Setup
app.use(express.json({limit:"4mb"}));
app.use(cors());


//Routes Setup
app.get("/api/status", (req, res)=> {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
        server: "online",
        database: databaseConnected ? "connected" : "disconnected",
    });
});
app.use("/api", (req, res, next)=> {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: "Database unavailable. Check the MongoDB Atlas connection and restart the server.",
        });
    }
    next();
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server Is Running On PORT: "+PORT));

const connectWithRetry = async (retryDelay = 1000) => {
    try {
        await connectDB();
    } catch (error) {
        if (error.code === "MONGODB_CONFIGURATION") {
            console.error("MongoDB configuration error:", error.message);
            return;
        }

        if (error.code === 18 || error.codeName === "AuthenticationFailed") {
            console.error(
                "MongoDB authentication failed. Verify the Atlas database username and password in server/.env."
            );
            return;
        }

        console.error(
            `MongoDB connection failed. API requests will return 503; retrying in ${Math.ceil(retryDelay / 1000)} seconds:`,
            error.message
        );
        setTimeout(() => {
            void connectWithRetry(Math.min(retryDelay * 2, 30000));
        }, retryDelay);
    }
};

void connectWithRetry();