// Helpers for list routes: search and pages.

// A user may type "(" or ".*" into a search box. Escaping makes every
// character plain text, so the search can never break or be abused.
function escapeRegex(text) {
	return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ?search=key → find "key" anywhere in these fields, ignoring capitals
function searchFilter(search, fields) {
	const text = String(search ?? "").trim();
	if (!text) return {};
	const pattern = new RegExp(escapeRegex(text), "i");
	return { $or: fields.map((field) => ({ [field]: pattern })) };
}

// Without ?page the route answers with a plain list, exactly as before,
// so the public page keeps working. With ?page it answers one page:
// { items, total, page, pages }
async function findList(req, Model, filter, { sort = { createdAt: -1 }, populate, select } = {}) {
	let query = Model.find(filter).sort(sort);
	if (populate) query = query.populate(...populate);
	if (select) query = query.select(select);

	if (req.query.page === undefined) return await query;

	const page = Math.max(1, parseInt(req.query.page, 10) || 1);
	const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
	const [items, total] = await Promise.all([
		query.skip((page - 1) * limit).limit(limit),
		Model.countDocuments(filter),
	]);
	return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { escapeRegex, searchFilter, findList };