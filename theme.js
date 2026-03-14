// ============================================
// НАСТРОЙКИ ТЕМЫ (ЦВЕТА И ЯРКОСТЬ)
// ============================================

const THEME = {
    // Основные цвета
    primary: '#00d4ff',        // Основной цвет (голубой)
    primaryDark: '#00b8d9',    // Цвет при наведении
    
    // Текст
    textMain: '#ffffff',       // Основной текст
    textSecondary: '#b0c4de',  // Вторичный текст
    textHeading: '#e0f0ff',    // Заголовки
    
    // Свечение (прозрачность)
    glowLight: 'rgba(0, 212, 255, 0.15)',   // Лёгкое свечение
    glowMedium: 'rgba(0, 212, 255, 0.3)',   // Среднее свечение
    glowStrong: 'rgba(0, 212, 255, 0.6)',   // Сильное свечение
    glowMax: 'rgba(0, 212, 255, 0.8)',      // Максимальное свечение
    
    // Фон
    background: '#0a0e17',     // Основной фон
    backgroundLight: 'rgba(13, 27, 42, 0.9)',  // Фон карточек
    backgroundOverlay: 'rgba(0, 0, 0, 0.5)',   // Затемнение
    
    // Молнии
    lightningOpacity: 1,       // Прозрачность молний (0.1 - 1)
    lightningDuration: 0.8,    // Длительность анимации (сек)
    
    // Акценты
    success: '#4ade80',        // Зелёный (в наличии)
    danger: '#f87171',         // Красный (нет в наличии/удалить)
    warning: '#fbbf24',        // Жёлтый (предупреждения)
};

// Применить тему при загрузке
function applyTheme() {
    const root = document.documentElement;
    
    // CSS переменные
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
    
    console.log('🎨 Тема применена:', THEME);
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', applyTheme);
