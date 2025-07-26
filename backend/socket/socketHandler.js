const { Server } = require("socket.io");

let io;

function setupSocket(server) {
    console.log("[SETUP] Initializing Socket.IO");
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id);

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
}

function emitToClients(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = { setupSocket, emitToClients };
