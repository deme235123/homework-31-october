require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function seed() {
	// The demo accounts' password comes from .env, so it is never written in code or pushed
	if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
		throw new Error("Set SEED_PASSWORD (8+ characters) in .env first");
	}
	await mongoose.connect(process.env.MONGO_URI);
	console.log("Connected. Clearing old products and categories...");

	// Careful: this deletes everything in these two collections.
	await Product.deleteMany({});
	await Category.deleteMany({});

	// Parent categories first, so the children can point to them
	const [keyboards, mice] = await Category.insertMany([
		{ name: "Keyboards", slug: "keyboards" },
		{ name: "Mice", slug: "mice" },
	]);

	const [mechanical, wireless] = await Category.insertMany([
		{ name: "Mechanical keyboards", slug: "mechanical-keyboards", parent: keyboards._id },
		{ name: "Wireless keyboards", slug: "wireless-keyboards", parent: keyboards._id },
	]);

	await Product.insertMany([
		{ title: "Forge 75 Mechanical Keyboard", description: "Hot-swappable, 75% layout.", price: 89, stock: 14, category: mechanical._id },
		{ title: "Anvil TKL Mechanical Keyboard", description: "Tenkeyless, brown switches.", price: 69, stock: 20, category: mechanical._id },
		{ title: "Breeze Wireless Keyboard", description: "Slim, 3 device pairing.", price: 49, stock: 30, category: wireless._id },
		{ title: "Orbit Wireless Mouse", description: "Quiet clicks, 6 month battery.", price: 29, stock: 40, category: mice._id },
		{ title: "Falcon Gaming Mouse", description: "8000 DPI, 6 buttons.", price: 39, stock: 0, category: mice._id },
	]);

	// 25 test products, so the admin list has more than one page
	const many = Array.from({ length: 25 }, (_, i) => ({
		title: `Test product ${i + 1}`,
		price: 10 + i,
		stock: i % 5,
		category: mechanical._id,
	}));
	await Product.insertMany(many);

	// Demo users. Only accounts ending in @example.com are removed, real ones stay.
	const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
	await User.deleteMany({ email: /@example\.com$/ });
	await User.insertMany([
		{ name: "Admin Test", email: "admin@example.com", passwordHash, role: "admin" },
		{ name: "Nika Beridze", email: "nika@example.com", passwordHash },
		{ name: "Mari Kapanadze", email: "mari@example.com", passwordHash },
		{ name: "Blocked Test", email: "blocked@example.com", passwordHash, isBlocked: true },
	]);

	const categoryCount = await Category.countDocuments();
	const productCount = await Product.countDocuments();
	const userCount = await User.countDocuments();
	console.log(`Done: ${categoryCount} categories, ${productCount} products, ${userCount} users.`);
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error("Seed failed:", err.message);
	process.exit(1);
});