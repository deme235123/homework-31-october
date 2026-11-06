const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function makeAccessToken(user) {
	return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
		expiresIn: "1h",
	});
}

// POST /api/auth/register → create a customer account
router.post("/register", async (req, res) => {
	const { name, email, password } = req.body;
	if (!name || !email || !password) {
		return res.status(400).json({ message: "name, email and password are required" });
	}
	if (typeof password !== "string" || password.length < 8) {
		return res.status(400).json({ message: "Password must be at least 8 characters" });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	// role is never taken from the body: everyone who registers is a customer.
	// A duplicate email is caught by the unique index and answered with 409 by the error handler.
	const user = await User.create({ name, email, passwordHash });

	res.status(201).json({
		accessToken: makeAccessToken(user),
		user: { _id: user._id, name: user.name, email: user.email, role: user.role },
	});
});

// POST /api/auth/login → check the password and give back a token
router.post("/login", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: "email and password are required" });
	}

	const user = await User.findOne({ email: String(email).toLowerCase().trim() });
	// Same message for "no such email" and "wrong password", so nobody can test which emails exist
	const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
	if (!ok) return res.status(401).json({ message: "Invalid email or password" });
	if (user.isBlocked) return res.status(403).json({ message: "This account is blocked" });

	res.json({
		accessToken: makeAccessToken(user),
		user: { _id: user._id, name: user.name, email: user.email, role: user.role },
	});
});

// GET /api/auth/me → who am I? (needs a valid token)
router.get("/me", requireAuth, async (req, res) => {
	const user = await User.findById(req.user.id).select("-passwordHash");
	if (!user) return res.status(404).json({ message: "User not found" });
	if (user.isBlocked) return res.status(403).json({ message: "This account is blocked" });
	res.json(user);
});

module.exports = router;