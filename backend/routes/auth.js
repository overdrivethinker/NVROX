const express = require("express");
const router = express.Router();
const knex = require("../database/db");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				error: "Username and password are required",
			});
		}

		const user = await knex("users")
			.whereRaw("LOWER(username) = ?", [username.toLowerCase()])
			.first();

		if (!user) {
			return res.status(401).json({
				error: "Invalid username or password",
			});
		}

		if (user.status !== "Active") {
			return res.status(403).json({
				error: "Account is inactive. Please contact administrator.",
			});
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({
				error: "Invalid username or password",
			});
		}

		await knex("users").where("user_id", user.user_id).update({
			last_login: knex.fn.now(),
		});

		const { password: _, ...userWithoutPassword } = user;

		res.json({
			message: "Login successful",
			user: {
				...userWithoutPassword,
				last_login: new Date().toISOString(),
			},
		});
	} catch (err) {
		console.error("POST /auth/login error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

router.post("/logout", async (req, res) => {
	try {
		res.json({
			message: "Logout successful",
		});
	} catch (err) {
		console.error("POST /auth/logout error:", err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

module.exports = router;
