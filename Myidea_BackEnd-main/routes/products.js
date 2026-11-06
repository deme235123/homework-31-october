const express = require("express");
const Product = require("../models/Product");
const { searchFilter, findList } = require("../utils/list");

const router = express.Router();

// The orders the admin can pick. Anything else falls back to "newest".
const SORTS = {
	newest: { createdAt: -1 },
	oldest: { createdAt: 1 },
	"price-asc": { price: 1 },
	"price-desc": { price: -1 },
	title: { title: 1 },
};

// "12" → 12, "" or "abc" → undefined
function toNumber(value) {
	if (value === undefined || value === "") return undefined;
	const n = Number(value);
	return Number.isNaN(n) ? undefined : n;
}

// GET /api/products → list all
// Optional: ?search=text ?category=<id> ?inStock=true|false ?active=true|false
//           ?minPrice=10 ?maxPrice=50 ?sort=newest|oldest|price-asc|price-desc|title
//           ?page=1&limit=10
router.get("/", async (req, res) => {
	const { search, category, inStock, active, minPrice, maxPrice, sort } = req.query;
	const filter = searchFilter(search, ["title", "description"]);

	if (category) filter.category = category;
	if (inStock === "true") filter.stock = { $gt: 0 };
	if (inStock === "false") filter.stock = 0;
	if (active === "true" || active === "false") filter.isActive = active === "true";

	const min = toNumber(minPrice);
	const max = toNumber(maxPrice);
	if (min !== undefined || max !== undefined) {
		filter.price = {};
		if (min !== undefined) filter.price.$gte = min;
		if (max !== undefined) filter.price.$lte = max;
	}

	res.json(
		await findList(req, Product, filter, {
			sort: SORTS[sort] || SORTS.newest,
			populate: ["category", "name slug"],
		})
	);
});

// GET /api/products/:id → one product
router.get("/:id", async (req, res) => {
	const product = await Product.findById(req.params.id).populate("category", "name slug");
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json(product);
});

// POST /api/products → create
router.post("/", async (req, res) => {
	const product = await Product.create(req.body);
	res.status(201).json(product);
});

// PUT /api/products/:id → update
router.put("/:id", async (req, res) => {
	const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: "after",
		runValidators: true,
	});
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json(product);
});

// DELETE /api/products/:id → delete
router.delete("/:id", async (req, res) => {
	const product = await Product.findByIdAndDelete(req.params.id);
	if (!product) return res.status(404).json({ message: "Product not found" });
	res.json({ message: "Product deleted" });
});

module.exports = router;