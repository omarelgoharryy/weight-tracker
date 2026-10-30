export type Tab = 'today' | 'progress' | 'history' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'progress', label: 'Progress' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange(tab: Tab): void }) {
  return (
    <nav class="tabs" role="tablist" aria-label="Screens">
      {TABS.map(({ id, label }) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
