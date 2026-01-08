import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService, PrimaryColor, ColorPalette } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule, AvatarModule, MenuModule, TooltipModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  @ViewChild('colorMenu') colorMenu!: Menu;

  user$ = this.authService.user$;

  colorMenuItems: MenuItem[] = [
    { label: 'Azul', data: 'blue' },
    { label: 'Púrpura', data: 'purple' },
    { label: 'Verde', data: 'green' },
    { label: 'Rojo', data: 'red' },
    { label: 'Naranja', data: 'orange' },
    { label: 'Rosa', data: 'pink' }
  ];

  async signOut() {
    await this.authService.signOut();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setColor(color: PrimaryColor) {
    this.themeService.setColor(color);
    
    // Cerrar el menú después de seleccionar
    if (this.colorMenu) {
      this.colorMenu.hide();
    }
  }

  getColorPalette(color: PrimaryColor): ColorPalette {
    return this.themeService.getColorPalette(color);
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  get currentColor(): PrimaryColor {
    return this.themeService.getCurrentColor();
  }
}
