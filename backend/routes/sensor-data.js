const express = require("express");
const router = express.Router();
const knex = require("../database/db");
const { toWIB, formatTimestamp } = require("../utils/helpers");

router.get("/export", async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = knex("sensor_readings as r")
            .join("devices as d", "r.mac_address", "=", "d.mac_address")
            .select(
                "r.id",
                "d.device_name",
                "d.location",
                "r.mac_address",
                "r.temperature",
                "r.humidity",
                "r.recorded_at",
            )
            .orderBy("r.recorded_at", "desc");

        if (start_date && end_date) {
            query = query.whereBetween("r.recorded_at", [
                `${start_date} 00:00:00`,
                `${end_date} 23:59:59`,
            ]);
        } else if (start_date) {
            query = query.where(
                "r.recorded_at",
                ">=",
                `${start_date} 00:00:00`,
            );
        } else if (end_date) {
            query = query.where("r.recorded_at", "<=", `${end_date} 23:59:59`);
        }

        const rows = await query;

        res.json({
            data: rows,
            total: rows.length,
        });
    } catch (err) {
        console.error("GET /sensor-data/export error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/alerts/export", async (req, res) => {
    try {
        const { start_date, end_date, mac } = req.query;

        let query = knex("alerts as a")
            .join("devices as d", "a.mac_address", "=", "d.mac_address")
            .select(
                "a.id",
                "d.device_name",
                "d.location",
                "a.mac_address",
                "a.parameter",
                "a.value",
                "a.threshold",
                "a.status",
                "a.recorded_at",
            )
            .orderBy("a.recorded_at", "desc");

        if (start_date && end_date) {
            query = query.whereBetween("a.recorded_at", [
                `${start_date} 00:00:00`,
                `${end_date} 23:59:59`,
            ]);
        } else if (start_date) {
            query = query.where(
                "a.recorded_at",
                ">=",
                `${start_date} 00:00:00`,
            );
        } else if (end_date) {
            query = query.where("a.recorded_at", "<=", `${end_date} 23:59:59`);
        }

        if (mac) {
            query = query.where("a.mac_address", mac);
        }

        const rows = await query;

        res.json({
            data: rows,
            total: rows.length,
        });
    } catch (err) {
        console.error("GET /sensor-data/alerts/export error:", err);
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
                knex.raw("AVG(CAST(r.humidity AS FLOAT)) as avg_humid"),
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
