const express = require("express");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

// POST /api/uploads/sign → gives the browser a one-time signature for an upload
// The API secret stays on the server. The browser only gets the signature.
router.post("/sign", (req, res) => {
	const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
	if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
		return res.status(500).json({ message: "Cloudinary is not configured on the server" });
	}

	const timestamp = Math.round(Date.now() / 1000);
	const folder = "myidea/products";

	// Sign exactly the values the browser will send (timestamp and folder)
	const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, CLOUDINARY_API_SECRET);

	res.json({
		cloudName: CLOUDINARY_CLOUD_NAME,
		apiKey: CLOUDINARY_API_KEY,
		timestamp,
		folder,
		signature,
	});
});

module.exports = router;