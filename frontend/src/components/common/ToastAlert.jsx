import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const icons = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info
};

const ToastAlert = ({ toast, onClose }) => {
  if (!toast) return null;

  const Icon = icons[toast.type] || Info;

  return (
    <div className={`toast-alert toast-${toast.type || "info"}`} role="status">
      <Icon size={18} />
      <span>{toast.message}</span>
      <button type="button" aria-label="Close alert" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastAlert;
