import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      match: [/^$|^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPurchaseDate: {
      type: Date
    }
  },
  { timestamps: true }
);

customerSchema.index({ name: "text", mobile: "text", email: "text" });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
