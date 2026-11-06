const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { searchFilter, findList } = require("../utils/list");

const router = express.Router();

// GET /api/categories → list all (with the parent's name filled in)
// Optional: ?search=text  ?page=1&limit=10
router.get("/", async (req, res) => {
	const filter = searchFilter(req.query.search, ["name", "slug"]);
	res.json(await findList(req, Category, filter, { sort: { name: 1 }, populate: ["parent", "name slug"] }));
});

// GET /api/categories/:id → one category
router.get("/:id", async (req, res) => {
	const category = await Category.findById(req.params.id).populate("parent", "name slug");
	if (!category) return res.status(404).json({ message: "Category not found" });
	res.json(category);
});

// POST /api/categories → create
router.post("/", async (req, res) => {
	const category = await Category.create(req.body);
	res.status(201).json(category);
});

// PUT /api/categories/:id → update
router.put("/:id", async (req, res) => {
	const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
		returnDocument: "after",
		runValidators: true,
	});
	if (!category) return res.status(404).json({ message: "Category not found" });
	res.json(category);
});

// DELETE /api/categories/:id → delete (only if nothing uses it)
router.delete("/:id", async (req, res) => {
	const usedByProduct = await Product.exists({ category: req.params.id });
	if (usedByProduct) {
		return res.status(409).json({ message: "Category still has products" });
	}
	const hasChildren = await Category.exists({ parent: req.params.id });
	if (hasChildren) {
		return res.status(409).json({ message: "Category still has sub-categories" });
	}
	const category = await Category.findByIdAndDelete(req.params.id);
	if (!category) return res.status(404).json({ message: "Category not found" });
	res.json({ message: "Category deleted" });
});

module.exports = router;