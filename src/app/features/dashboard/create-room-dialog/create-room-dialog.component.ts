import { Component, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RoomService } from '../../../core/services/room.service';
import { ParticipantService } from '../../../core/services/participant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule
  ],
  templateUrl: './create-room-dialog.component.html',
  styleUrls: ['./create-room-dialog.component.scss']
})
export class CreateRoomDialogComponent {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private participantService = inject(ParticipantService);
  private authService = inject(AuthService);

  @Output() roomCreated = new EventEmitter<{ roomId: string; roomCode: string }>();
  @Output() visibleChange = new EventEmitter<boolean>();

  visible = false;
  loading = false;
  roomForm: FormGroup;

  constructor() {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  show() {
    this.visible = true;
    this.roomForm.reset();
  }

  hide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async onSubmit() {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    try {
      console.log('CreateRoomDialog: Starting room creation...');
      this.loading = true;
      const currentUser = this.authService.getCurrentUser();
      
      console.log('CreateRoomDialog: Current user:', currentUser?.uid);
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      console.log('CreateRoomDialog: Calling roomService.createRoom...');
      // Crear sala
      const { roomId, roomCode } = await this.roomService.createRoom({
        name: this.roomForm.value.name.trim(),
        description: this.roomForm.value.description?.trim() || ''
      });

      console.log('CreateRoomDialog: Room created!', { roomId, roomCode });

      console.log('CreateRoomDialog: Adding participant...');
      // Agregar creador como moderador
      await this.participantService.addParticipant(roomId, currentUser.uid, 'moderator');

      console.log('CreateRoomDialog: Participant added!');

      // Emitir evento de sala creada
      this.roomCreated.emit({ roomId, roomCode });
      
      console.log('CreateRoomDialog: Event emitted, hiding dialog');
      this.hide();
    } catch (error) {
      console.error('CreateRoomDialog: Error creating room:', error);
      alert('Error al crear la sala. Por favor intenta nuevamente.');
    } finally {
      console.log('CreateRoomDialog: Finally block, setting loading to false');
      this.loading = false;
    }
  }

  get nameControl() {
    return this.roomForm.get('name');
  }

  get descriptionControl() {
    return this.roomForm.get('description');
  }
}
