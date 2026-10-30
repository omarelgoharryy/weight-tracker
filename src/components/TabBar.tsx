import type { ComponentChildren } from 'preact';

export const TAB_IDS = ['today', 'progress', 'history', 'settings'] as const;
export type Tab = (typeof TAB_IDS)[number];

const TABS: { id: Tab; label: string; icon: ComponentChildren }[] = [
  {
    id: 'today',
    label: 'Today',
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600l1.400 1.400M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400" />
      </>
    ),
  },
  { id: 'progress', label: 'Progress', icon: <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" /> },
  { id: 'history', label: 'History', icon: <path d="M8 6h13M8 12h13M8 18h13M3.500 6h.01M3.500 12h.01M3.500 18h.01" /> },
  { id: 'settings', label: 'Settings', icon: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4.500v5M8 14.500v5" /> },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange(tab: Tab): void }) {
  const index = TAB_IDS.indexOf(tab);
  return (
    <nav class="tabs" role="tablist" aria-label="Screens">
      <span class="tab-rail" aria-hidden="true">
        <span class="tab-marker" style={{ transform: `translateX(${index * 100}%)` }} />
      </span>
      {TABS.map(({ id, label, icon }) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => onChange(id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {icon}
          </svg>
          {label}
        </button>
      ))}
    </nav>
  );
}
