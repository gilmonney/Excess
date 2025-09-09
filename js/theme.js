/**
 * Theme Management System
 * Handles light/dark mode with system preference detection and user preference storage
 */

class ThemeManager {
  constructor() {
    this.storageKey = 'excess-music-theme';
    this.themes = {
      light: 'light',
      dark: 'dark',
      system: 'system'
    };
    
    this.init();
  }

  init() {
    // Get stored preference or default to system
    const storedTheme = localStorage.getItem(this.storageKey) || this.themes.system;
    
    // Apply theme immediately to prevent flash
    this.applyTheme(storedTheme);
    
    // Listen for system theme changes
    this.watchSystemTheme();
    
    // Create theme toggle if it doesn't exist
    this.createThemeToggle();
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  getCurrentTheme() {
    const stored = localStorage.getItem(this.storageKey) || this.themes.system;
    if (stored === this.themes.system) {
      return this.getSystemTheme();
    }
    return stored;
  }

  applyTheme(theme) {
    const actualTheme = theme === this.themes.system ? this.getSystemTheme() : theme;
    
    // Apply to document root
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Update CSS custom properties for immediate effect
    if (actualTheme === 'light') {
      document.documentElement.style.setProperty('--bg', '#ffffff');
      document.documentElement.style.setProperty('--fg', '#1a1a1a');
      document.documentElement.style.setProperty('--muted', '#666666');
      document.documentElement.style.setProperty('--accent', '#0066cc');
    } else {
      document.documentElement.style.setProperty('--bg', '#000000');
      document.documentElement.style.setProperty('--fg', '#ffffff');
      document.documentElement.style.setProperty('--muted', '#9aa0a6');
      document.documentElement.style.setProperty('--accent', '#00e0ff');
    }

    // Update Three.js scene backgrounds if they exist
    this.updateThreeJSTheme(actualTheme);
    
    // Store preference
    localStorage.setItem(this.storageKey, theme);
    
    // Update toggle button if it exists
    this.updateToggleButton(theme);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: actualTheme, preference: theme } 
    }));
  }

  updateThreeJSTheme(theme) {
    // Update Three.js scene background if scene exists
    if (window.scene && window.scene.background) {
      const bgColor = theme === 'light' ? 0xf5f5f5 : 0x000000;
      window.scene.background.setHex(bgColor);
    }

    // Update particle colors if they exist
    if (window.stars && window.stars.material) {
      const particleColor = theme === 'light' ? 0x333333 : 0xffffff;
      window.stars.material.color.setHex(particleColor);
    }
  }

  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', () => {
      const currentPreference = localStorage.getItem(this.storageKey) || this.themes.system;
      if (currentPreference === this.themes.system) {
        this.applyTheme(this.themes.system);
      }
    });
  }

  createThemeToggle() {
    // Check if toggle already exists
    if (document.getElementById('theme-toggle')) return;

    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = `
      <svg class="theme-icon sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg class="theme-icon moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <svg class="theme-icon system-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    `;

    toggle.addEventListener('click', () => {
      this.cycleTheme();
    });

    // Add to navigation if it exists, otherwise to body
    const nav = document.querySelector('.nav nav');
    if (nav) {
      nav.appendChild(toggle);
    } else {
      // For index.html, add to button container
      const buttonContainer = document.querySelector('.button-container');
      if (buttonContainer) {
        buttonContainer.appendChild(toggle);
      } else {
        document.body.appendChild(toggle);
      }
    }

    this.updateToggleButton();
  }

  cycleTheme() {
    const current = localStorage.getItem(this.storageKey) || this.themes.system;
    let next;

    switch (current) {
      case this.themes.system:
        next = this.themes.light;
        break;
      case this.themes.light:
        next = this.themes.dark;
        break;
      case this.themes.dark:
        next = this.themes.system;
        break;
      default:
        next = this.themes.system;
    }

    this.applyTheme(next);
  }

  updateToggleButton(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const currentTheme = theme || localStorage.getItem(this.storageKey) || this.themes.system;
    
    // Reset all icons
    toggle.querySelectorAll('.theme-icon').forEach(icon => {
      icon.style.display = 'none';
    });

    // Show appropriate icon
    switch (currentTheme) {
      case this.themes.light:
        toggle.querySelector('.sun-icon').style.display = 'block';
        toggle.setAttribute('title', 'Switch to dark theme');
        break;
      case this.themes.dark:
        toggle.querySelector('.moon-icon').style.display = 'block';
        toggle.setAttribute('title', 'Switch to system theme');
        break;
      case this.themes.system:
        toggle.querySelector('.system-icon').style.display = 'block';
        toggle.setAttribute('title', 'Switch to light theme');
        break;
    }
  }

  // Public API
  setTheme(theme) {
    if (Object.values(this.themes).includes(theme)) {
      this.applyTheme(theme);
    }
  }

  getTheme() {
    return this.getCurrentTheme();
  }

  getThemePreference() {
    return localStorage.getItem(this.storageKey) || this.themes.system;
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
window.themeManager = themeManager;

export default themeManager;
