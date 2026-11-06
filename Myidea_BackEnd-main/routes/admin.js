const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");

const router = express.Router();

// GET /api/admin/stats → the numbers for the dashboard
// Change the counts to fit your own models.
router.get("/stats", async (req, res) => {
	// All counts run at the same time instead of one after another
	const [users, admins, blocked, products, outOfStock, categories, newestUsers] = await Promise.all([
		User.countDocuments(),
		User.countDocuments({ role: "admin" }),
		User.countDocuments({ isBlocked: true }),
		Product.countDocuments(),
		Product.countDocuments({ stock: 0 }),
		Category.countDocuments(),
		User.find().select("name email createdAt").sort({ createdAt: -1 }).limit(5),
	]);
	res.json({ users, admins, blocked, products, outOfStock, categories, newestUsers });
});

module.exports = router;