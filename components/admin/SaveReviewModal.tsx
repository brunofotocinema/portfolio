"use client";

interface SaveReviewModalProps {
  changes: string[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SaveReviewModal({
  changes,
  submitting,
  error,
  onCancel,
  onConfirm,
}: SaveReviewModalProps) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-box">
        <h2>Revisar alterações</h2>
        <p className="admin-note">
          Confira tudo o que será commitado na branch principal. Esta lista não é editável — para
          mudar algo, cancele e ajuste na página antes de commitar.
        </p>

        {changes.length === 0 ? (
          <p className="admin-note">Nenhuma alteração pendente.</p>
        ) : (
          <ul className="admin-review-list">
            {changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        )}

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-modal-actions">
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={submitting || changes.length === 0}>
            {submitting ? "Comitando..." : "Comitar"}
          </button>
        </div>
      </div>
    </div>
  );
}
