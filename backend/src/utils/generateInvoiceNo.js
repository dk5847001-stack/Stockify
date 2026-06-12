import Bill from "../models/Bill.js";

export const generateInvoiceNo = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `STK-${datePart}`;
  const latestBill = await Bill.findOne({ invoiceNo: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select("invoiceNo");

  const latestSequence = latestBill?.invoiceNo?.split("-").at(-1);
  const nextSequence = String((Number(latestSequence) || 0) + 1).padStart(5, "0");

  return `${prefix}-${nextSequence}`;
};
