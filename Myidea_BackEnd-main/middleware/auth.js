const jwt = require("jsonwebtoken");

// Reads "Authorization: Bearer <token>", checks it, and puts the user's id and role on req.user
function requireAuth(req, res, next) {
	const header = req.headers.authorization || "";
	const [type, token] = header.split(" ");
	if (type !== "Bearer" || !token) {
		return res.status(401).json({ message: "Login required" });
	}
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: payload.sub, role: payload.role };
		next();
	} catch (err) {
		// expired, edited or signed with another secret
		return res.status(401).json({ message: "Invalid or expired token" });
	}
}

// Use after requireAuth: only admins pass
function requireAdmin(req, res, next) {
	if (req.user?.role !== "admin") {
		return res.status(403).json({ message: "Admins only" });
	}
	next();
}

// Reading stays public. Creating, changing and deleting need an admin.
function adminForChanges(req, res, next) {
	if (req.method === "GET") return next();
	requireAuth(req, res, () => requireAdmin(req, res, next));
}

module.exports = { requireAuth, requireAdmin, adminForChanges };