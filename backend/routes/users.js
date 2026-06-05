const express = require("express");
const router = express.Router();
const knex = require("../database/db");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 16, search = "" } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        let query = knex("users")
            .select(
                "user_id",
                "username",
                "email",
                "role",
                "status",
                "created_at",
                "last_login",
            )
            .orderBy("created_at", "desc");

        if (search) {
            query = query.where(function () {
                this.where("username", "like", `%${search}%`).orWhere(
                    "email",
                    "like",
                    `%${search}%`,
                );
            });
        }

        const rows = await query.limit(parsedLimit).offset(offset);

        let countQuery = knex("users").count("* as count");
        if (search) {
            countQuery = countQuery.where(function () {
                this.where("username", "like", `%${search}%`).orWhere(
                    "email",
                    "like",
                    `%${search}%`,
                );
            });
        }
        const totalResult = await countQuery.first();
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
        console.error("GET /users error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/list", async (req, res) => {
    try {
        const rows = await knex("users")
            .select(
                "user_id",
                "username",
                "email",
                "role",
                "status",
                "created_at",
                "last_login",
            )
            .orderBy("username", "asc");
        res.json(rows);
    } catch (err) {
        console.error("GET /users/list error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/list-active", async (req, res) => {
    try {
        const rows = await knex("users")
            .select(
                "user_id",
                "username",
                "email",
                "role",
                "status",
                "created_at",
                "last_login",
            )
            .where("status", "Active")
            .orderBy("username", "asc");
        res.json(rows);
    } catch (err) {
        console.error("GET /users/list-active error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await knex("users")
            .select(
                "user_id",
                "username",
                "email",
                "role",
                "status",
                "created_at",
                "last_login",
            )
            .where("user_id", id)
            .first();

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("GET /users/:id error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { username, email, password, role, status } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Username, email, and password are required",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters",
            });
        }

        const existingUsername = await knex("users")
            .where("username", username)
            .first();

        if (existingUsername) {
            return res.status(409).json({
                error: "Username already exists",
            });
        }

        const existingEmail = await knex("users").where("email", email).first();

        if (existingEmail) {
            return res.status(409).json({
                error: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { v4: uuidv4 } = require("uuid");
        const userId = uuidv4();

        await knex("users").insert({
            user_id: userId,
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role || "User",
            status: status || "Active",
            created_at: knex.fn.now(),
            last_login: null,
        });

        res.status(201).json({
            message: "User created successfully",
            user_id: userId,
            username,
            email: email.toLowerCase().trim(),
        });
    } catch (err) {
        console.error("POST /users error:", err.message);

        if (err.code === "ER_DUP_ENTRY" || err.message.includes("UNIQUE")) {
            if (err.message.includes("username")) {
                res.status(409).json({
                    error: "Username already exists",
                });
            } else if (err.message.includes("email")) {
                res.status(409).json({
                    error: "Email already exists",
                });
            } else {
                res.status(409).json({
                    error: "Duplicate entry found",
                });
            }
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

router.put("/:id", async (req, res) => {
    const trx = await knex.transaction();

    try {
        const { id } = req.params;
        const { username, email, role, status } = req.body;

        const existingUser = await trx("users").where("user_id", id).first();

        if (!existingUser) {
            await trx.rollback();
            return res.status(404).json({
                error: "User not found",
            });
        }

        if (username && username !== existingUser.username) {
            const duplicateUsername = await trx("users")
                .where("username", username)
                .whereNot("user_id", id)
                .first();

            if (duplicateUsername) {
                await trx.rollback();
                return res.status(409).json({
                    error: "Username already exists",
                });
            }
        }

        if (email && email !== existingUser.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await trx.rollback();
                return res.status(400).json({
                    error: "Invalid email format",
                });
            }

            const duplicateEmail = await trx("users")
                .where("email", email)
                .whereNot("user_id", id)
                .first();

            if (duplicateEmail) {
                await trx.rollback();
                return res.status(409).json({
                    error: "Email already exists",
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (role) updateData.role = role;
        if (status) updateData.status = status;

        await trx("users").where("user_id", id).update(updateData);

        await trx.commit();

        res.json({
            message: "User updated successfully",
            user_id: id,
            username: username || existingUser.username,
        });
    } catch (err) {
        await trx.rollback();
        console.error("PUT /users/:id error:", err.message);

        if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("username")) {
                res.status(409).json({
                    error: "Username already exists",
                });
            } else if (err.message.includes("email")) {
                res.status(409).json({
                    error: "Email already exists",
                });
            } else {
                res.status(409).json({
                    error: "Duplicate entry found",
                });
            }
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

router.put("/:id/password", async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                error: "New password is required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters",
            });
        }

        const existingUser = await knex("users").where("user_id", id).first();

        if (!existingUser) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await knex("users").where("user_id", id).update({
            password: hashedPassword,
        });

        res.json({
            message: "Password updated successfully",
        });
    } catch (err) {
        console.error("PUT /users/:id/password error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await knex("users").where("user_id", id).del();

        if (deleted) {
            res.status(200).json({ message: "User deleted successfully" });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("DELETE /users/:id error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/stats/overview", async (req, res) => {
    try {
        const total = await knex("users").count("* as count").first();
        const active = await knex("users")
            .where("status", "Active")
            .count("* as count")
            .first();
        const inactive = await knex("users")
            .where("status", "Inactive")
            .count("* as count")
            .first();

        const roles = await knex("users")
            .select("role")
            .count("* as count")
            .groupBy("role");

        const byRole = {};
        roles.forEach((r) => {
            byRole[r.role] = r.count;
        });

        res.json({
            total: total.count || 0,
            active: active.count || 0,
            inactive: inactive.count || 0,
            byRole,
        });
    } catch (err) {
        console.error("GET /users/stats/overview error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
