const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		items: [
			{
				product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
				title: { type: String, required: true },
				price: { type: Number, required: true },
				quantity: { type: Number, required: true, min: 1 },
			},
		],
		total: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
			default: "pending",
		},
		paymentStatus: { type: String, enum: ["unpaid", "paid", "failed"], default: "unpaid" },
		stripeSessionId: { type: String, index: true },
	},
	{ timestamps: true }
);

module.exports = model("Order", orderSchema);