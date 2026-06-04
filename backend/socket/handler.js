const { Server } = require("socket.io");
require("dotenv").config();

let io;

function setupSocket(server) {
    console.log("[SOCKET] Initializing Socket.IO");
    io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_HOST,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("[SOCKET] Client connected: ", socket.id);

        socket.on("disconnect", () => {
            console.log("[SOCKET] Client disconnected:", socket.id);
        });
    });
}

function emitToClients(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = { setupSocket, emitToClients };
