require("module-alias/register");

const express = require("express");
const router = express.Router();
const knex = require("@db/knex");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await knex("devices")
            .select("*")
            .orderBy("device_name", "asc")
            .limit(parsedLimit)
            .offset(offset);

        const totalResult = await knex("devices").count("* as count").first();
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
        console.error("GET /devices/paginated error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/alerts", async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await knex("alerts")
            .select(
                "devices.device_name",
                "devices.location",
                "alerts.parameter",
                "alerts.value",
                "alerts.threshold",
                "alerts.status",
                "alerts.recorded_at"
            )
            .leftJoin("devices", "alerts.mac_address", "devices.mac_address")
            .orderBy([
                { column: "alerts.recorded_at", order: "desc" },
                { column: "alerts.id", order: "desc" },
            ])
            .limit(parsedLimit)
            .offset(offset);

        // Format waktu agar tetap pakai Asia/Jakarta (GMT+7)
        const fixedRows = rows.map((row) => ({
            ...row,
            recorded_at: dayjs(row.recorded_at)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ssZ"),
        }));

        const totalResult = await knex("alerts").count("* as count").first();
        const total = Number(totalResult?.count || 0);

        res.json({
            data: fixedRows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit),
            },
        });
    } catch (err) {
        console.error("GET /devices/alerts error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/with-thresholds", async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await knex("devices as d")
            .leftJoin(
                knex("sensor_thresholds")
                    .select(
                        "mac_address",
                        "lower_limit as tempMin",
                        "upper_limit as tempMax"
                    )
                    .where("parameter", "Temperature")
                    .as("t"),
                "d.mac_address",
                "t.mac_address"
            )
            .leftJoin(
                knex("sensor_thresholds")
                    .select(
                        "mac_address",
                        "lower_limit as humidMin",
                        "upper_limit as humidMax"
                    )
                    .where("parameter", "Humidity")
                    .as("h"),
                "d.mac_address",
                "h.mac_address"
            )
            .select(
                "d.device_name",
                "d.mac_address",
                "d.location",
                "d.status",
                "t.tempMin",
                "t.tempMax",
                "h.humidMin",
                "h.humidMax",
                "d.created_at",
                "d.updated_at"
            )
            .orderBy("d.device_name", "asc")
            .limit(parsedLimit)
            .offset(offset);

        const totalResult = await knex("devices").count("* as count").first();
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
        console.error("GET /devices error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/list", async (req, res) => {
    try {
        const rows = await knex("devices")
            .select("*")
            .orderBy("device_name", "asc");
        res.json(rows);
    } catch (err) {
        console.error("GET /devices/list error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/list-active", async (req, res) => {
    try {
        const rows = await knex("devices")
            .select("*")
            .where("status", "Active");
        res.json(rows);
    } catch (err) {
        console.error("GET /devices/list-active error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/:mac", async (req, res) => {
    const { mac } = req.params;
    try {
        const deleted = await knex("devices")
            .delete()
            .where({ mac_address: mac })
            .del();
        if (deleted) {
            res.status(200).json({ message: "Device deleted successfully." });
        } else {
            res.status(404).json({ message: "Device not found." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/threshold", async (req, res) => {
    const { mac } = req.query;
    if (!mac) return res.status(400).json({ error: "mac is required" });

    try {
        const rows = await knex("sensor_thresholds") // ganti dengan nama tabelmu
            .select("parameter", "lower_limit", "upper_limit")
            .where("mac_address", mac);

        const limits = {};
        for (const row of rows) {
            if (row.parameter === "Temperature") {
                limits.tempMin = parseFloat(row.lower_limit);
                limits.tempMax = parseFloat(row.upper_limit);
            } else if (row.parameter === "Humidity") {
                limits.humidMin = parseFloat(row.lower_limit);
                limits.humidMax = parseFloat(row.upper_limit);
            }
        }

        res.json(limits);
    } catch (err) {
        console.error("GET /devices/threshold error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/threshold/all", async (req, res) => {
    try {
        const rows = await knex("sensor_thresholds") // ganti nama tabel jika perlu
            .select("mac_address", "parameter", "lower_limit", "upper_limit");

        const grouped = {};

        for (const row of rows) {
            const mac = row.mac_address;

            if (!grouped[mac]) {
                grouped[mac] = {
                    mac_address: mac,
                };
            }

            if (row.parameter === "Temperature") {
                grouped[mac].tempMin = parseFloat(row.lower_limit);
                grouped[mac].tempMax = parseFloat(row.upper_limit);
            } else if (row.parameter === "Humidity") {
                grouped[mac].humidMin = parseFloat(row.lower_limit);
                grouped[mac].humidMax = parseFloat(row.upper_limit);
            }
        }

        const result = Object.values(grouped);
        res.json(result);
    } catch (err) {
        console.error("GET /devices/threshold/all error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/alerts-sum", async (req, res) => {
    const { range } = req.query;

    if (!range) {
        return res.status(400).json({ error: "range is required" });
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
            return res.status(400).json({ error: "Invalid range" });
        }

        const rows = await knex("alerts as a")
            .join("devices as d", "a.mac_address", "=", "d.mac_address")
            .select("a.mac_address", "d.device_name", "a.parameter")
            .count("* as count")
            .whereBetween("a.recorded_at", [start, now])
            .groupBy("a.mac_address", "d.device_name", "a.parameter");

        // Transform to chart-friendly format
        const map = {};
        for (const row of rows) {
            const device = row.device_name || row.mac_address;
            if (!map[device]) {
                map[device] = { device, temp: 0, humid: 0 };
            }
            if (row.parameter === "Temperature") {
                map[device].temp = parseInt(row.count);
            } else if (row.parameter === "Humidity") {
                map[device].humid = parseInt(row.count);
            }
        }

        const chartData = Object.values(map);
        res.json(chartData);
    } catch (err) {
        console.error("GET /alerts-summary error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/", async (req, res) => {
    const { mac_address, location, status } = req.body;

    if (!mac_address) {
        return res.status(400).json({ error: "mac_address is required" });
    }

    const validStatus = ["Active", "Inactive"];
    const finalStatus = validStatus.includes(status) ? status : "Inactive";

    try {
        const exists = await knex("devices")
            .select("mac_address")
            .where({ mac_address })
            .first();

        if (exists) {
            return res.status(409).json({ error: "Device already exists" });
        }

        await knex("devices").insert({
            mac_address,
            location: location || null,
            status: finalStatus,
        });

        res.status(201).json({ message: "Device saved" });
    } catch (err) {
        console.error("POST /devices error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
