import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    CardModule, 
    ButtonModule, 
    InputTextModule,
    DividerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  
  loading = false;
  guestForm: FormGroup;
  private authSubscription?: Subscription;
  private returnUrl: string = '/dashboard';

  constructor() {
    this.guestForm = this.fb.group({
      guestName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    // Leer el returnUrl de los query params (si existe)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    console.log('LoginComponent: returnUrl =', this.returnUrl);

    // Verificar si el usuario ya está autenticado
    // Esto maneja el caso de redirección de Google OAuth
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        // Usuario autenticado, redirigir a la URL guardada o al dashboard
        console.log('LoginComponent: User authenticated, redirecting to:', this.returnUrl);
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async signInWithGoogle() {
    try {
      this.loading = true;
      await this.authService.signInWithGoogle();
      // No necesitamos resetear loading aquí porque ngOnInit redirigirá cuando user$ emita
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      // Solo resetear loading si hubo un error real (no cancelación por el usuario)
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        alert('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
      }
      this.loading = false;
    }
  }

  async signInAsGuest() {
    if (this.guestForm.invalid) {
      this.guestForm.markAllAsTouched();
      return;
    }

    try {
      this.loading = true;
      const guestName = this.guestForm.value.guestName.trim();
      await this.authService.signInAsGuest(guestName);
    } catch (error) {
      console.error('Error al iniciar sesión como invitado:', error);
      this.loading = false;
    }
  }

  get guestNameControl() {
    return this.guestForm.get('guestName');
  }
}
