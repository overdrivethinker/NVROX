require("module-alias/register");
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const { setupSocket } = require("@socket/socketHandler");

const server = http.createServer(app);
setupSocket(server);

require("@db/knex");
require("@mqtt/mqttHandler");

const apiRoutes = require("@routes");
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[RUN] Backend running at http://localhost:${PORT}`);
});
