require("./utils/logger");
require("dotenv").config();
require("./mqtt/config");
require("./mqtt/handler");

const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { setupSocket } = require("./socket/handler");

const server = http.createServer(app);
setupSocket(server);

const routes = require("./routes");
app.use("/api", routes);

const DIST_PATH = path.join(__dirname, "/public/dist");

app.use(
    "/nvrox",
    express.static(DIST_PATH, {
        index: false,
    }),
);

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(DIST_PATH, "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] NVROX running at http://localhost:${PORT}`);
});
