import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar__brand">
        Forward pass
        <span className="topbar__brand-sub">Qwen-2.5-3B · «Reaching ATH (»</span>
      </div>
      <div className="topbar__spacer" />
      <nav className="topbar__nav" aria-label="Быстрая навигация">
        <a href="#tokenize">Вход</a>
        <a href="#rmsnorm">Блок</a>
        <a href="#layer-loop">Слои</a>
        <a href="#unembedding">Выход</a>
        <a href="#summary">Сводка</a>
      </nav>
      <ThemeToggle />
    </div>
  );
}
