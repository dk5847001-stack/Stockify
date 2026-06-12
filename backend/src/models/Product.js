import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["increase", "decrease", "adjustment"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0
    },
    newStock: {
      type: Number,
      required: true,
      min: 0
    },
    note: {
      type: String,
      trim: true,
      default: ""
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      set: (value) => (value === "" ? undefined : value)
    },
    category: {
      type: String,
      default: "General",
      trim: true
    },
    brand: {
      type: String,
      trim: true,
      default: ""
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    mrp: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockLimit: {
      type: Number,
      default: 10,
      min: 0
    },
    unit: {
      type: String,
      enum: ["pcs", "kg", "g", "ltr", "ml", "box", "pack", "dozen"],
      default: "pcs"
    },
    expiryDate: {
      type: Date
    },
    supplierName: {
      type: String,
      trim: true,
      default: ""
    },
    image: {
      type: String,
      default: "",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stockHistory: {
      type: [stockHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", sku: "text", barcode: "text" });
productSchema.index({ category: 1, isActive: 1, stock: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
