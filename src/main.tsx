import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {applyTheme, getInitialTheme} from './hooks/useTheme';
import './index.css';

applyTheme(getInitialTheme());
registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
