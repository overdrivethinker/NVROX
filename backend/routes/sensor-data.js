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

router.get("/alerts-sum", async (req, res) => {
    const { range } = req.query;

    if (!range) {
        return res.status(400).json({ error: "range is required" });
    }

    const validRanges = ["daily", "weekly", "monthly", "yearly"];
    if (!validRanges.includes(range)) {
        return res.status(400).json({ error: "Invalid range" });
    }

    try {
        const now = toWIB(new Date());
        let start;

        if (range === "daily") {
            start = toWIB(
                new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
            );
        } else if (range === "weekly") {
            start = toWIB(new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0));
        } else if (range === "monthly") {
            start = toWIB(new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0));
        } else if (range === "yearly") {
            start = toWIB(new Date(2000, 0, 1, 0, 0, 0, 0));
        }

        const rows = await knex("alerts as a")
            .join("devices as d", "a.mac_address", "=", "d.mac_address")
            .select("a.mac_address", "d.device_name", "a.parameter")
            .count("* as count")
            .whereBetween("a.recorded_at", [start, now])
            .groupBy("a.mac_address", "d.device_name", "a.parameter");

        const map = {};
        for (const row of rows) {
            const device = row.device_name || row.mac_address;
            if (!map[device]) {
                map[device] = {
                    device,
                    mac_address: row.mac_address,
                    temp: 0,
                    humid: 0,
                };
            }
            if (row.parameter === "Temperature") {
                map[device].temp = parseInt(row.count);
            } else if (row.parameter === "Humidity") {
                map[device].humid = parseInt(row.count);
            }
        }

        res.json(Object.values(map));
    } catch (err) {
        console.error("GET /alerts-sum error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/summary", async (req, res) => {
    const { mac_address, range } = req.query;

    // mac_address wajib
    if (!mac_address || !range) {
        return res
            .status(400)
            .json({ error: "mac_address and range are required" });
    }

    const validRanges = ["daily", "weekly", "monthly", "yearly"];
    if (!validRanges.includes(range)) {
        return res.status(400).json({
            error: `Invalid range. Must be one of: ${validRanges.join(", ")}`,
        });
    }

    try {
        const now = new Date();
        let start;
        let groupExpr;
        let labelExpr;
        let castFloat;

        const dialect = knex.client.config.client;
        const isPG = dialect === "pg";
        const isMSSQL = dialect === "mssql";

        const col = "r.recorded_at";

        if (isPG) {
            castFloat = (col) => `${col}::FLOAT`;

            if (range === "daily") {
                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                    0,
                    0,
                    0,
                    0,
                );
                groupExpr = `DATE_TRUNC('day', ${col})`;
                labelExpr = `TO_CHAR(DATE_TRUNC('day', ${col}), 'YYYY-MM-DD')`;
            } else if (range === "weekly") {
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                groupExpr = `DATE_TRUNC('week', ${col})`;
                labelExpr = `TO_CHAR(DATE_TRUNC('week', ${col}), 'IYYY-"W"IW')`;
            } else if (range === "monthly") {
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                groupExpr = `DATE_TRUNC('month', ${col})`;
                labelExpr = `TO_CHAR(DATE_TRUNC('month', ${col}), 'YYYY-MM')`;
            } else if (range === "yearly") {
                start = new Date(2000, 0, 1, 0, 0, 0, 0);
                groupExpr = `DATE_TRUNC('year', ${col})`;
                labelExpr = `TO_CHAR(DATE_TRUNC('year', ${col}), 'YYYY')`;
            }
        } else if (isMSSQL) {
            castFloat = (col) => `CAST(${col} AS FLOAT)`;

            if (range === "daily") {
                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                    0,
                    0,
                    0,
                    0,
                );
                groupExpr = `CAST(${col} AS DATE)`;
                labelExpr = `FORMAT(${col}, 'yyyy-MM-dd')`;
            } else if (range === "weekly") {
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                groupExpr = `DATEADD(week, DATEDIFF(week, 0, ${col}), 0)`;
                labelExpr = `CAST(YEAR(${col}) AS VARCHAR) + '-W' + RIGHT('0' + CAST(DATEPART(iso_week, ${col}) AS VARCHAR), 2)`;
            } else if (range === "monthly") {
                start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                groupExpr = `DATEADD(month, DATEDIFF(month, 0, ${col}), 0)`;
                labelExpr = `FORMAT(${col}, 'yyyy-MM')`;
            } else if (range === "yearly") {
                start = new Date(2000, 0, 1, 0, 0, 0, 0);
                groupExpr = `DATEADD(year, DATEDIFF(year, 0, ${col}), 0)`;
                labelExpr = `CAST(YEAR(${col}) AS VARCHAR)`;
            }
        } else {
            return res
                .status(500)
                .json({ error: `Unsupported database dialect: ${dialect}` });
        }

        const result = await knex("sensor_readings as r")
            .join("devices as d", "r.mac_address", "=", "d.mac_address")
            .select(
                "r.mac_address",
                "d.device_name",
                knex.raw(`${groupExpr} as period`),
                knex.raw(`${labelExpr} as label`),
                knex.raw(`COUNT(*) as sample_count`),
                knex.raw(`MIN(${castFloat("r.temperature")}) as min_temp`),
                knex.raw(`MAX(${castFloat("r.temperature")}) as max_temp`),
                knex.raw(`AVG(${castFloat("r.temperature")}) as avg_temp`),
                knex.raw(`MIN(${castFloat("r.humidity")}) as min_humid`),
                knex.raw(`MAX(${castFloat("r.humidity")}) as max_humid`),
                knex.raw(`AVG(${castFloat("r.humidity")}) as avg_humid`),
            )
            .where("r.mac_address", mac_address) // wajib, langsung filter
            .whereBetween("r.recorded_at", [start, now])
            .groupByRaw(`r.mac_address, d.device_name, ${groupExpr}`)
            .orderBy("period", "asc");

        res.json({
            data: result,
            meta: {
                mac_address,
                range,
                from: start.toISOString(),
                to: now.toISOString(),
                total_periods: result.length,
            },
        });
    } catch (err) {
        console.error("GET /sensor-data/summary error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
