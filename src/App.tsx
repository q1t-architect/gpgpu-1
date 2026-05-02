import { Suspense, lazy } from 'react';
import { Hero } from './components/Hero';
import { TOC } from './components/TOC';
import { TopBar } from './components/TopBar';

const Sections = lazy(() => import('./sections/Sections'));

export function App() {
  return (
    <>
      <TopBar />
      <main className="page">
        <Hero />
        <TOC />
        <Suspense fallback={<div className="loading">Загрузка разделов…</div>}>
          <Sections />
        </Suspense>
        <footer className="footer">
          <p>
            Все формулы и числа соответствуют публичной модели Qwen-2.5-3B и реальному
            forward-pass на промпте «Reaching ATH (», тензоры которого лежат в этом
            репозитории в <code>public/data/tensors/</code>.
          </p>
          <p>
            Документ — учебная подстилка для последующей визуализации. Тёмная и светлая
            темы переключаются в правом верхнем углу.
          </p>
        </footer>
      </main>
    </>
  );
}
