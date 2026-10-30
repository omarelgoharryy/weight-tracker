import { useState } from 'preact/hooks';
import { InstallBanner } from './components/InstallBanner';
import { TabBar, type Tab } from './components/TabBar';
import { History } from './screens/History';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Setup } from './screens/Setup';
import { Today } from './screens/Today';
import { useApp } from './state/useApp';

export function App() {
  const { loading, loadError, data, today, refresh } = useApp();
  const [tab, setTab] = useState<Tab>('today');

  if (loading) return null;
  if (loadError)
    return (
      <div class="sea sea-page">
        <main class="screen">
          <h1>Your data could not be opened</h1>
          <p class="lede">Nothing has been changed. Try again, or restart the app.</p>
          <button class="primary" onClick={() => void refresh()}>
            Try again
          </button>
        </main>
      </div>
    );
  if (!data) return <Setup onDone={refresh} />;

  return (
    <>
      <InstallBanner />
      <main class="screen">
        {tab === 'today' && (
          <Today data={data} today={today} refresh={refresh} onOpenSettings={() => setTab('settings')} />
        )}
        {tab === 'progress' && <Progress data={data} today={today} refresh={refresh} />}
        {tab === 'history' && <History data={data} today={today} refresh={refresh} />}
        {tab === 'settings' && <Settings data={data} today={today} refresh={refresh} />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </>
  );
}
