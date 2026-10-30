const isInstalled = (): boolean =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export function InstallBanner() {
  if (isInstalled()) return null;
  return (
    <aside class="banner">
      <p>
        <strong>Install before you start logging.</strong> In Safari, tap Share, then Add to Home Screen. Entries made in
        a browser tab don't carry over to the installed app.
      </p>
    </aside>
  );
}
