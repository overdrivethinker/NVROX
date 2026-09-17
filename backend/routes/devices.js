const express = require("express");
const router = express.Router();
const knex = require("../database/db");
const { toWIB, formatTimestamp } = require("../utils/helpers");

const { getDeviceId, clearDeviceCache } = require("../redis/device-cache");
const {
    getThresholds,
    clearThresholdCache,
} = require("../redis/threshold-cache");

const clearAllCache = async () => {
    console.log("[INIT] Clearing Redis cache");
    await clearDeviceCache();
    await clearThresholdCache();
};

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
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
        const { page = 1, limit = 12, mac, from, to } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        // Default: hari ini (WIB)
        const now = toWIB(new Date());
        const startOfToday = toWIB(new Date());
        startOfToday.setHours(0, 0, 0, 0);

        const fromDate = from ? new Date(`${from}T00:00:00`) : startOfToday;
        const toDate = to ? new Date(`${to}T23:59:59`) : now;

        const query = knex("alerts")
            .select(
                "alerts.mac_address",
                "devices.device_name",
                "devices.location",
                "alerts.parameter",
                "alerts.value",
                "alerts.threshold",
                "alerts.status",
                "alerts.recorded_at",
            )
            .leftJoin("devices", "alerts.mac_address", "devices.mac_address")
            .whereBetween("alerts.recorded_at", [fromDate, toDate])
            .orderBy([
                { column: "alerts.recorded_at", order: "desc" },
                { column: "alerts.id", order: "desc" },
            ]);

        if (mac) query.where("alerts.mac_address", mac);

        const rows = await query.clone().limit(parsedLimit).offset(offset);

        const totalResult = await query.clone().count("* as count").first();
        const total = Number(totalResult?.count || 0);

        const fixedRows = rows.map((row) => ({
            ...row,
            recorded_at: formatTimestamp(toWIB(row.recorded_at)),
        }));

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
        const { page = 1, limit = 8 } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await knex("devices as d")
            .leftJoin(
                knex("sensor_thresholds")
                    .select(
                        "mac_address",
                        "warning_low as tempWarningLow",
                        "warning_high as tempWarningHigh",
                        "alert_low as tempAlertLow",
                        "alert_high as tempAlertHigh",
                    )
                    .where("parameter", "Temperature")
                    .as("t"),
                "d.mac_address",
                "t.mac_address",
            )
            .leftJoin(
                knex("sensor_thresholds")
                    .select(
                        "mac_address",
                        "warning_low as humidWarningLow",
                        "warning_high as humidWarningHigh",
                        "alert_low as humidAlertLow",
                        "alert_high as humidAlertHigh",
                    )
                    .where("parameter", "Humidity")
                    .as("h"),
                "d.mac_address",
                "h.mac_address",
            )
            .select(
                "d.device_name",
                "d.mac_address",
                "d.location",
                "d.status",

                "t.tempWarningLow",
                "t.tempWarningHigh",
                "t.tempAlertLow",
                "t.tempAlertHigh",

                "h.humidWarningLow",
                "h.humidWarningHigh",
                "h.humidAlertLow",
                "h.humidAlertHigh",

                "d.created_at",
                "d.updated_at",
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
        const rows = await knex("sensor_thresholds")
            .select(
                "parameter",
                "warning_low",
                "warning_high",
                "alert_low",
                "alert_high",
            )
            .where("mac_address", mac);

        const limits = {};
        for (const row of rows) {
            const data = {
                warningLow: parseFloat(row.warning_low),
                warningHigh: parseFloat(row.warning_high),
                alertLow: parseFloat(row.alert_low),
                alertHigh: parseFloat(row.alert_high),
            };

            if (row.parameter === "Temperature") {
                limits.temperature = data;
            } else if (row.parameter === "Humidity") {
                limits.humidity = data;
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
        const rows = await knex("sensor_thresholds").select(
            "mac_address",
            "parameter",
            "warning_low",
            "warning_high",
            "alert_low",
            "alert_high",
        );

        const grouped = {};

        for (const row of rows) {
            const mac = row.mac_address;

            if (!grouped[mac]) {
                grouped[mac] = {
                    mac_address: mac,
                };
            }

            const data = {
                warningLow: parseFloat(row.warning_low),
                warningHigh: parseFloat(row.warning_high),
                alertLow: parseFloat(row.alert_low),
                alertHigh: parseFloat(row.alert_high),
            };

            if (row.parameter === "Temperature") {
                grouped[mac].temperature = data;
            } else if (row.parameter === "Humidity") {
                grouped[mac].humidity = data;
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
        const end = toWIB(new Date());
        const start = toWIB(new Date());

        switch (range) {
            case "hourly":
                start.setHours(end.getHours() - 1);
                break;

            case "daily":
                start.setDate(end.getDate() - 30);
                break;

            case "weekly":
                start.setDate(end.getDate() - 12 * 7);
                break;

            case "monthly":
                start.setMonth(end.getMonth() - 12);
                break;

            case "yearly":
                start.setFullYear(end.getFullYear() - 5);
                break;

            default:
                return res.status(400).json({
                    error: "Invalid range",
                });
        }

        const rows = await knex("alerts as a")
            .join("devices as d", "a.mac_address", "=", "d.mac_address")
            .select("a.mac_address", "d.device_name", "a.parameter")
            .count("* as count")
            .whereBetween("a.recorded_at", [start, end])
            .groupBy("a.mac_address", "d.device_name", "a.parameter");

        const map = {};

        for (const row of rows) {
            const device = row.device_name || row.mac_address;

            if (!map[device]) {
                map[device] = {
                    device,
                    temp: 0,
                    humid: 0,
                };
            }

            if (row.parameter === "Temperature") {
                map[device].temp = Number(row.count);
            } else if (row.parameter === "Humidity") {
                map[device].humid = Number(row.count);
            }
        }

        res.json(Object.values(map));
    } catch (err) {
        console.error("GET /alerts-sum error:", err.message);

        res.status(500).json({
            error: "Internal Server Error",
        });
    }
});

router.put("/:mac", async (req, res) => {
    const trx = await knex.transaction();

    await clearAllCache();

    try {
        const { mac } = req.params;
        const { name, location, status, thresholds } = req.body;

        const existingDevice = await trx("devices")
            .where("mac_address", mac)
            .first();

        if (!existingDevice) {
            await trx.rollback();
            return res.status(404).json({
                error: "Device not found",
            });
        }

        if (name && name !== existingDevice.device_name) {
            const duplicateName = await trx("devices")
                .where("device_name", name)
                .whereNot("mac_address", mac)
                .first();

            if (duplicateName) {
                await trx.rollback();
                return res.status(400).json({
                    error: "Device with this name already exists",
                });
            }
        }

        await trx("devices").where("mac_address", mac).update({
            device_name: name,
            location: location,
            status: status,
            updated_at: knex.fn.now(),
        });

        // Helper: validasi + upsert threshold per parameter
        const upsertThreshold = async (parameter, data) => {
            if (!data) return;

            const { warningLow, warningHigh, alertLow, alertHigh } = data;

            // Validasi semua field ada & bertipe angka
            const values = {
                warningLow,
                warningHigh,
                alertLow,
                alertHigh,
            };
            for (const [key, val] of Object.entries(values)) {
                if (val === undefined || val === null || isNaN(val)) {
                    throw new Error(
                        `Invalid ${key} for ${parameter}: must be a number`,
                    );
                }
            }

            // Validasi urutan: alert_low < warning_low < warning_high < alert_high
            if (
                alertLow >= warningLow ||
                warningLow >= warningHigh ||
                warningHigh >= alertHigh
            ) {
                throw new Error(
                    `Invalid threshold order for ${parameter}: ` +
                        `alertLow < warningLow < warningHigh < alertHigh`,
                );
            }

            const exists = await trx("sensor_thresholds")
                .where({ mac_address: mac, parameter })
                .first();

            const payload = {
                warning_low: warningLow,
                warning_high: warningHigh,
                alert_low: alertLow,
                alert_high: alertHigh,
                updated_at: knex.fn.now(),
            };

            if (exists) {
                await trx("sensor_thresholds")
                    .where({ mac_address: mac, parameter })
                    .update(payload);
            } else {
                await trx("sensor_thresholds").insert({
                    mac_address: mac,
                    parameter,
                    ...payload,
                    created_at: knex.fn.now(),
                });
            }
        };

        if (thresholds?.temperature) {
            await upsertThreshold("Temperature", thresholds.temperature);
        }
        if (thresholds?.humidity) {
            await upsertThreshold("Humidity", thresholds.humidity);
        }

        await trx.commit();

        res.json({
            message: "Device updated successfully",
            mac_address: mac,
            device_name: name,
        });
    } catch (err) {
        await trx.rollback();
        console.error("PUT /devices/:mac error:", err.message);

        if (err.message.startsWith("Invalid threshold order")) {
            res.status(400).json({ error: err.message });
        } else if (err.message.startsWith("Invalid ")) {
            res.status(400).json({ error: err.message });
        } else if (
            err.code === "ER_DUP_ENTRY" &&
            err.message.includes("device_name")
        ) {
            res.status(400).json({
                error: "Device with this name already exists",
            });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

router.post("/", async (req, res) => {
    try {
        const { mac_address, device_name, location, status } = req.body;

        if (!mac_address || !device_name) {
            return res.status(400).json({
                error: "MAC address and device name are required",
            });
        }

        const existingMacDevice = await knex("devices")
            .where("mac_address", mac_address)
            .first();

        if (existingMacDevice) {
            return res.status(400).json({
                error: "Device with this MAC address already exists",
            });
        }

        const existingNameDevice = await knex("devices")
            .where("device_name", device_name)
            .first();

        if (existingNameDevice) {
            return res.status(400).json({
                error: "Device with this name already exists",
            });
        }

        await knex("devices").insert({
            mac_address,
            device_name,
            location: location || "",
            status: status || "Active",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        });

        res.status(201).json({
            message: "Device added successfully",
            mac_address,
            device_name,
        });
    } catch (err) {
        console.error("POST /devices error:", err.message);

        if (err.code === "ER_DUP_ENTRY" || err.message.includes("UNIQUE")) {
            if (err.message.includes("mac_address")) {
                res.status(400).json({
                    error: "Device with this MAC address already exists",
                });
            } else if (err.message.includes("device_name")) {
                res.status(400).json({
                    error: "Device with this name already exists",
                });
            } else {
                res.status(400).json({
                    error: "Duplicate entry found",
                });
            }
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

module.exports = router;
