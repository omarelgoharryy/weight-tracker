interface Props {
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({ message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel }: Props) {
  return (
    <div class="overlay">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="Please confirm">
        <p>{message}</p>
        <div class="dialog-actions">
          <button class="secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button class="primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
