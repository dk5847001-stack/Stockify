import mongoose from "mongoose";

const suppliedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    sku: {
      type: String,
      trim: true,
      default: ""
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
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
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
      default: ""
    },
    suppliedProducts: {
      type: [suppliedProductSchema],
      default: []
    },
    totalPurchaseValue: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

supplierSchema.index({ name: "text", phone: "text", email: "text", companyName: "text" });

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
