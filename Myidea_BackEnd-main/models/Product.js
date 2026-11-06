const { Schema, model } = require("mongoose");

const productSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		price: { type: Number, required: true, min: 0 },
		stock: { type: Number, default: 0, min: 0 },
		category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
		images: [
			{
				url: { type: String, required: true },
				publicId: { type: String, required: true },
			},
		],
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

module.exports = model("Product", productSchema);