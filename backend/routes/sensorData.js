require("module-alias/register");

const express = require("express");
const router = express.Router();
const knex = require("@db/knex");

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await knex("sensor_readings as r")
            .join("devices as d", "r.mac_address", "=", "d.mac_address")
            .select(
                "r.id",
                "d.device_name",
                "d.location",
                "r.mac_address",
                "r.temperature",
                "r.humidity",
                "r.recorded_at"
            )
            .orderBy("r.recorded_at", "asc")
            .limit(parsedLimit)
            .offset(offset);

        const totalResult = await knex("sensor_readings")
            .count("* as count")
            .first();
        const total = totalResult?.count || 0;

        res.json({
            data: rows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit),
            },
        });
    } catch (err) {
        console.error("GET /sensor-data/ error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/3days-hourly", async (req, res) => {
    const { mac_address, range } = req.query;

    if (!mac_address || !range) {
        return res
            .status(400)
            .json({ error: "device_name and range are required" });
    }

    try {
        const now = new Date();
        let start = new Date();

        if (range === "today") {
            start.setHours(0, 0, 0, 0);
        } else if (range === "yesterday") {
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 1);
            now.setHours(23, 59, 59, 999);
        } else if (range === "2daysago") {
            start.setDate(now.getDate() - 2);
            start.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 2);
            now.setHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ error: "Invalid range value" });
        }

        const dialect = knex.client.config.client;
        const hourGroupExpr =
            dialect === "mysql" || dialect === "mysql2"
                ? "DATE_FORMAT(r.recorded_at, '%Y-%m-%d %H:00:00')"
                : "DATE_TRUNC('hour', r.recorded_at)";

        const result = await knex("sensor_readings as r")
            .join("devices as d", "r.mac_address", "=", "d.mac_address")
            .select(
                "r.mac_address",
                "d.device_name",
                knex.raw(`${hourGroupExpr} as hour`),
                knex.raw("MIN(CAST(r.temperature AS FLOAT)) as min_temp"),
                knex.raw("MAX(CAST(r.temperature AS FLOAT)) as max_temp"),
                knex.raw("AVG(CAST(r.temperature AS FLOAT)) as avg_temp"),
                knex.raw("MIN(CAST(r.humidity AS FLOAT)) as min_humid"),
                knex.raw("MAX(CAST(r.humidity AS FLOAT)) as max_humid"),
                knex.raw("AVG(CAST(r.humidity AS FLOAT)) as avg_humid")
            )
            .where("r.mac_address", mac_address)
            .whereBetween("r.recorded_at", [start, now])
            .groupByRaw(`r.mac_address, d.device_name, ${hourGroupExpr}`)
            .orderBy("hour", "asc");

        res.json({ data: result });
    } catch (err) {
        console.error("GET /sensor-data/3days-hourly error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
