export function MeasurementCard({ onOpen }: { onOpen(): void }) {
  return (
    <button class="measure-card" onClick={onOpen}>
      Time for your weekly measurements
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 3l5 5-5 5" />
      </svg>
    </button>
  );
}
