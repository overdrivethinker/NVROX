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

        const totalResult = await knex("sensor_readings").count("* as count").first();
        const total = totalResult?.count || 0;

        res.json({
            data: rows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                pages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (err) {
        console.error("GET /sensor-data/ error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
