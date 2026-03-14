// ============================================
// НАСТРОЙКИ ТЕМЫ (ЦВЕТА И ЯРКОСТЬ)
// ============================================

const THEME = {
    // Основные цвета (темнее)
    primary: '#008899',        // Основной цвет (темный голубой)
    primaryDark: '#006677',    // Цвет при наведении (ещё темнее)
    
    // Текст (темнее)
    textMain: '#cccccc',       // Основной текст (был #ffffff)
    textSecondary: '#778899',  // Вторичный текст (был #b0c4de)
    textHeading: '#aaccdd',    // Заголовки (был #e0f0ff)
    
    // Свечение (темнее/меньше прозрачность)
    glowLight: 'rgba(0, 136, 153, 0.08)',   // Лёгкое свечение (было 0.15)
    glowMedium: 'rgba(0, 136, 153, 0.15)',  // Среднее свечение (было 0.3)
    glowStrong: 'rgba(0, 136, 153, 0.35)',  // Сильное свечение (было 0.6)
    glowMax: 'rgba(0, 136, 153, 0.5)',      // Максимальное свечение (было 0.8)
    
    // Фон (темнее)
    background: '#05080c',     // Основной фон (был #0a0e17)
    backgroundLight: 'rgba(8, 16, 24, 0.95)',  // Фон карточек (темнее)
    backgroundOverlay: 'rgba(0, 0, 0, 0.7)',   // Затемнение (было 0.5)
    
    // Молнии (тусклее)
    lightningOpacity: 0.6,     // Прозрачность молний (была 1)
    lightningDuration: 0.8,    // Длительность анимации (сек)
    
    // Акценты (темнее)
    success: '#3d994a',        // Зелёный (темнее)
    danger: '#cc4444',         // Красный (темнее)
    warning: '#cc9900',        // Жёлтый (темнее)
};

// Применить тему при загрузке
function applyTheme() {
    const root = document.documentElement;
    
    root.style.setProperty('--primary', THEME.primary);
    root.style.setProperty('--primary-dark', THEME.primaryDark);
    root.style.setProperty('--text-main', THEME.textMain);
    root.style.setProperty('--text-secondary', THEME.textSecondary);
    root.style.setProperty('--text-heading', THEME.textHeading);
    root.style.setProperty('--glow-light', THEME.glowLight);
    root.style.setProperty('--glow-medium', THEME.glowMedium);
    root.style.setProperty('--glow-strong', THEME.glowStrong);
    root.style.setProperty('--glow-max', THEME.glowMax);
    root.style.setProperty('--background', THEME.background);
    root.style.setProperty('--background-light', THEME.backgroundLight);
    root.style.setProperty('--background-overlay', THEME.backgroundOverlay);
    root.style.setProperty('--lightning-opacity', THEME.lightningOpacity);
    root.style.setProperty('--lightning-duration', THEME.lightningDuration + 's');
    root.style.setProperty('--success', THEME.success);
    root.style.setProperty('--danger', THEME.danger);
    root.style.setProperty('--warning', THEME.warning);
    
    console.log('🌑 Тёмная тема применена:', THEME);
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', applyTheme);
