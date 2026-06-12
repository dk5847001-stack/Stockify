export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
};

export const getStockStatus = (product) => {
  if (!product || Number(product.stock) <= 0) return "out";
  if (Number(product.stock) <= Number(product.lowStockLimit || 0)) return "low";
  return "healthy";
};
