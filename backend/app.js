require("dotenv").config();
require("./mqtt/config");
require("./mqtt/handler");

const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { setupSocket } = require("./socket/handler");

const server = http.createServer(app);
setupSocket(server);

const routes = require("./routes");
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[RUN] Backend running at http://localhost:${PORT}`);
});
