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
            console.log("[CONNECTED] Redis Connected");
        } else {
            console.warn("[ERROR] Unexpected response:", res);
        }
    })
    .catch((err) => {
        console.error("[ERROR] Connection failed", err.message);
    });

module.exports = redis;
