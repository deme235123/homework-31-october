const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { searchFilter, findList } = require("../utils/list");

const router = express.Router();

// Never send the password hash back to the client
const SAFE = "-passwordHash";

// GET /api/users → list users
// Optional: ?role=admin  ?search=text (name or email)  ?page=1&limit=10
router.get("/", async (req, res) => {
	const filter = searchFilter(req.query.search, ["name", "email"]);
	if (req.query.role) filter.role = req.query.role;
	res.json(await findList(req, User, filter, { select: SAFE }));
});

// GET /api/users/:id → one user
router.get("/:id", async (req, res) => {
	const user = await User.findById(req.params.id).select(SAFE);
	if (!user) return res.status(404).json({ message: "User not found" });
	res.json(user);
});

// POST /api/users → an admin creates a user with a real password
// role is not taken from the body, so every new user is a customer.
router.post("/", async (req, res) => {
	const { name, email, password } = req.body;
	if (typeof password !== "string" || password.length < 8) {
		return res.status(400).json({ message: "Password must be at least 8 characters" });
	}
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, passwordHash });
	const safe = user.toObject();
	delete safe.passwordHash;
	res.status(201).json(safe);
});

// PUT /api/users/:id → update name, email or isBlocked
// role is not editable here, so nobody can promote an account through the admin page.
router.put("/:id", async (req, res) => {
	const changes = {};
	for (const key of ["name", "email", "isBlocked"]) {
		if (req.body[key] !== undefined) changes[key] = req.body[key];
	}
	const user = await User.findByIdAndUpdate(req.params.id, changes, {
		returnDocument: "after",
		runValidators: true,
	}).select(SAFE);
	if (!user) return res.status(404).json({ message: "User not found" });
	res.json(user);
});

// PATCH /api/users/:id/role → make someone an admin or a customer
// The new role is used from that user's next login (the token still holds the old role).
router.patch("/:id/role", async (req, res) => {
	const { role } = req.body;
	if (!["customer", "admin"].includes(role)) {
		return res.status(400).json({ message: 'role must be "customer" or "admin"' });
	}
	// An admin must not lock themselves out by accident
	if (req.params.id === req.user.id) {
		return res.status(400).json({ message: "You cannot change your own role" });
	}
	const user = await User.findByIdAndUpdate(
		req.params.id,
		{ role },
		{ returnDocument: "after", runValidators: true }
	).select(SAFE);
	if (!user) return res.status(404).json({ message: "User not found" });
	res.json(user);
});

// DELETE /api/users/:id → delete (only if the user has no orders)
router.delete("/:id", async (req, res) => {
	const hasOrders = await Order.exists({ user: req.params.id });
	if (hasOrders) {
		return res.status(409).json({ message: "User still has orders. Block the user instead" });
	}
	const user = await User.findByIdAndDelete(req.params.id);
	if (!user) return res.status(404).json({ message: "User not found" });
	await Cart.deleteMany({ user: req.params.id });
	res.json({ message: "User deleted" });
});

module.exports = router;