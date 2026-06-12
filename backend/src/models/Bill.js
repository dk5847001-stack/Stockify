import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Walk-in Customer"
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: customerSchema,
      default: () => ({})
    },
    items: {
      type: [billItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "A bill must contain at least one item."
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Credit"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partial", "Failed"],
      default: "Paid"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

billSchema.index({ "customer.phone": 1, createdAt: -1 });
billSchema.index({ createdAt: -1 });

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
