import { createRoot } from 'react-dom/client';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import './styles.css';
import App from './App.jsx';

const q = new URLSearchParams(location.search);
const tex = q.get('tex');
const root = createRoot(document.getElementById('root'));
if (tex) {
  // Chế độ dựng texture: render 1 "màn hình" ra trang tĩnh để Playwright chụp làm texture cho cảnh 3D
  import('./TexPages.jsx').then(({ default: TexPage }) => root.render(<TexPage which={tex} />));
} else {
  root.render(<App />);
}
