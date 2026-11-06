const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, lowercase: true },
		parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
	},
	{ timestamps: true }
);

module.exports = model("Category", categorySchema);