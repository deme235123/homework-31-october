const { Schema, model } = require("mongoose");

const cartSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		items: [
			{
				product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
				quantity: { type: Number, required: true, min: 1 },
				priceSnapshot: { type: Number, required: true, min: 0 },
			},
		],
	},
	{ timestamps: true }
);

module.exports = model("Cart", cartSchema);