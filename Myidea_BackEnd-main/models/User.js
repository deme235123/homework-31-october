const { Schema, model } = require("mongoose");

const userSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ["customer", "admin"], default: "customer" },
		isBlocked: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = model("User", userSchema);