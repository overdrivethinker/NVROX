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

router.get("/list", async (req, res) => {
    try {
        const rows = await knex("devices").select("*");
        res.json(rows);
    } catch (err) {
        console.error("GET /devices error:", err.message);
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
