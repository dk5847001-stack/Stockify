import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({ open, title, message, confirmText = "Confirm", onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <div className="confirm-icon">
          <AlertTriangle size={24} />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
