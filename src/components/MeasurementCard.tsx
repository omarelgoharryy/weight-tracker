export function MeasurementCard({ onOpen }: { onOpen(): void }) {
  return (
    <button class="measure-card" onClick={onOpen}>
      Time for your weekly measurements
    </button>
  );
}
