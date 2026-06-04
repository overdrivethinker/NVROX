const Redis = require("ioredis");
require("dotenv").config({ path: __dirname + "/../.env" });

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
});

redis
    .ping()
    .then((res) => {
        if (res === "PONG") {
            console.log("[REDIS] Connected");
        } else {
            console.warn("[REDIS] Unexpected response:", res);
        }
    })
    .catch((err) => {
        console.error("[REDIS] Connection failed", err.message);
    });

module.exports = redis;
