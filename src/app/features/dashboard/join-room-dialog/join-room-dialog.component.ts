import { Component, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RoomService } from '../../../core/services/room.service';
import { ParticipantService } from '../../../core/services/participant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-join-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './join-room-dialog.component.html',
  styleUrls: ['./join-room-dialog.component.scss']
})
export class JoinRoomDialogComponent {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private participantService = inject(ParticipantService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() visibleChange = new EventEmitter<boolean>();

  visible = false;
  loading = false;
  errorMessage = '';
  joinForm: FormGroup;

  constructor() {
    this.joinForm = this.fb.group({
      roomCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6}$/)]]
    });
  }

  show() {
    this.visible = true;
    this.joinForm.reset();
    this.errorMessage = '';
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCodeInput(event: any) {
    // Convertir a mayúsculas automáticamente
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.joinForm.patchValue({ roomCode: input.value });
  }

  async onSubmit() {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    try {
      this.loading = true;
      this.errorMessage = '';
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const roomCode = this.joinForm.value.roomCode.trim().toUpperCase();

      // Buscar sala por código
      const room = await this.roomService.getRoomByCode(roomCode);

      if (!room) {
        this.errorMessage = 'No se encontró una sala con este código';
        return;
      }

      // Verificar si ya es participante
      const isParticipant = await this.participantService.isParticipant(room.roomId, currentUser.uid);

      if (!isParticipant) {
        // Agregar como participante (votante por defecto)
        await this.participantService.addParticipant(room.roomId, currentUser.uid, 'voter');
      }

      // Navegar a la sala
      this.hide();
      this.router.navigate(['/room', roomCode]);
    } catch (error) {
      console.error('Error uniéndose a sala:', error);
      this.errorMessage = 'Error al unirse a la sala. Por favor intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  get roomCodeControl() {
    return this.joinForm.get('roomCode');
  }
}
