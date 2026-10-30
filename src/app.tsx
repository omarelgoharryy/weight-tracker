import { useEffect, useRef, useState } from 'preact/hooks';
import { InstallBanner } from './components/InstallBanner';
import { TAB_IDS, TabBar, type Tab } from './components/TabBar';
import { History } from './screens/History';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Setup } from './screens/Setup';
import { Today } from './screens/Today';
import { useApp } from './state/useApp';

const SLIDE_PX = 18;

// Each tab has its own ground, and the status bar follows it.
function useGround(tab: Tab) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.tab = tab;
    const ground = getComputedStyle(root).getPropertyValue('--ground').trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', ground));
  }, [tab]);
}

export function App() {
  const { loading, loadError, data, today, refresh } = useApp();
  const [tab, setTab] = useState<Tab>('today');
  const shown = useRef(tab);
  useGround(tab);

  if (loading) return null;
  if (loadError)
    return (
      <main class="screen">
        <div class="page">
          <div class="card stack">
            <h1>Your data could not be opened</h1>
            <p class="lede">Nothing has been changed. Try again, or restart the app.</p>
            <button class="primary" onClick={() => void refresh()}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  if (!data) return <Setup onDone={refresh} />;

  // A new screen slides in from the side its tab sits on.
  const direction = Math.sign(TAB_IDS.indexOf(tab) - TAB_IDS.indexOf(shown.current));
  shown.current = tab;

  return (
    <>
      <InstallBanner />
      <main class="screen">
        <div class="page" key={tab} style={{ '--from': `${direction * SLIDE_PX}px` }}>
          {tab === 'today' && (
            <Today data={data} today={today} refresh={refresh} onOpenSettings={() => setTab('settings')} />
          )}
          {tab === 'progress' && <Progress data={data} today={today} refresh={refresh} />}
          {tab === 'history' && <History data={data} today={today} refresh={refresh} />}
          {tab === 'settings' && <Settings data={data} today={today} refresh={refresh} />}
        </div>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </>
  );
}
