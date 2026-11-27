import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {applyTheme, getInitialTheme} from './hooks/useTheme';
import './index.css';

applyTheme(getInitialTheme());

let refreshing = false;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    let lastCheck = Date.now();
    const checkForUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 30_000) return;
      lastCheck = now;
      void registration.update();
    };
    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    });
  },
});

createRoot(document.getElementById('root')!).render(<App />);
