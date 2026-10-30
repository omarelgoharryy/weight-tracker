export function BackupNudge({ onOpen }: { onOpen(): void }) {
  return (
    <aside class="note">
      <p>It's been a while since your last backup. A copy keeps your progress safe if you change phones.</p>
      <button class="secondary" onClick={onOpen}>
        Back up now
      </button>
    </aside>
  );
}
