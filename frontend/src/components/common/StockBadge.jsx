import { getStockStatus } from "../../utils/formatters.js";

const labels = {
  healthy: "Healthy",
  low: "Low Stock",
  out: "Out of Stock"
};

const StockBadge = ({ product }) => {
  const status = getStockStatus(product);

  return <span className={`stock-badge stock-${status}`}>{labels[status]}</span>;
};

export default StockBadge;
