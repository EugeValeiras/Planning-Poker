import { Injectable } from '@angular/core';

export type Theme = 'lara-dark-blue' | 'lara-light-blue';
export type PrimaryColor = 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink';

export interface ColorPalette {
  name: string;
  primary: string;
  primaryDark: string;
  primaryDarker: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'planning-poker-theme';
  private readonly COLOR_STORAGE_KEY = 'planning-poker-color';
  private currentTheme: Theme = 'lara-dark-blue';
  private currentColor: PrimaryColor = 'blue';

  readonly colorPalettes: Record<PrimaryColor, ColorPalette> = {
    blue: {
      name: 'Azul',
      primary: '#3B82F6',
      primaryDark: '#2563eb',
      primaryDarker: '#1d4ed8',
      icon: 'pi-circle-fill'
    },
    purple: {
      name: 'Púrpura',
      primary: '#8b5cf6',
      primaryDark: '#7c3aed',
      primaryDarker: '#6d28d9',
      icon: 'pi-circle-fill'
    },
    green: {
      name: 'Verde',
      primary: '#10b981',
      primaryDark: '#059669',
      primaryDarker: '#047857',
      icon: 'pi-circle-fill'
    },
    red: {
      name: 'Rojo',
      primary: '#ef4444',
      primaryDark: '#dc2626',
      primaryDarker: '#b91c1c',
      icon: 'pi-circle-fill'
    },
    orange: {
      name: 'Naranja',
      primary: '#f97316',
      primaryDark: '#ea580c',
      primaryDarker: '#c2410c',
      icon: 'pi-circle-fill'
    },
    pink: {
      name: 'Rosa',
      primary: '#ec4899',
      primaryDark: '#db2777',
      primaryDarker: '#be185d',
      icon: 'pi-circle-fill'
    }
  };

  constructor() {
    this.loadTheme();
    this.loadColor();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme(this.currentTheme);
  }

  private loadColor(): void {
    const savedColor = localStorage.getItem(this.COLOR_STORAGE_KEY) as PrimaryColor;
    if (savedColor && this.colorPalettes[savedColor]) {
      this.currentColor = savedColor;
    } else {
      // Si no hay color guardado, usar azul por defecto y guardarlo
      this.currentColor = 'blue';
      localStorage.setItem(this.COLOR_STORAGE_KEY, this.currentColor);
    }
    this.applyColor(this.currentColor);
  }

  private applyTheme(theme: Theme): void {
    const themeLink = document.getElementById('app-theme') as HTMLLinkElement;
    const themePath = `/assets/themes/${theme}/theme.css`;
    
    if (themeLink) {
      themeLink.href = themePath;
    } else {
      // Si no existe, crear el link element
      const head = document.getElementsByTagName('head')[0];
      const newThemeLink = document.createElement('link');
      newThemeLink.id = 'app-theme';
      newThemeLink.rel = 'stylesheet';
      newThemeLink.href = themePath;
      head.appendChild(newThemeLink);
    }

    // Agregar atributo data-theme al body para CSS custom
    document.body.setAttribute('data-theme', theme === 'lara-dark-blue' ? 'dark' : 'light');
  }

  private applyColor(color: PrimaryColor): void {
    const palette = this.colorPalettes[color];
    
    // Aplicar directamente en el body para mayor especificidad
    document.body.style.setProperty('--primary-color', palette.primary);
    document.body.style.setProperty('--primary-color-dark', palette.primaryDark);
    document.body.style.setProperty('--primary-color-darker', palette.primaryDarker);
    
    // Guardar el color actual en el body
    document.body.setAttribute('data-color', color);
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  getCurrentColor(): PrimaryColor {
    return this.currentColor;
  }

  getColorPalette(color: PrimaryColor): ColorPalette {
    return this.colorPalettes[color];
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'lara-dark-blue' 
      ? 'lara-light-blue' 
      : 'lara-dark-blue';
    
    this.applyTheme(this.currentTheme);
    localStorage.setItem(this.THEME_STORAGE_KEY, this.currentTheme);
  }

  setColor(color: PrimaryColor): void {
    this.currentColor = color;
    this.applyColor(color);
    localStorage.setItem(this.COLOR_STORAGE_KEY, color);
  }

  isDarkMode(): boolean {
    return this.currentTheme === 'lara-dark-blue';
  }
}
