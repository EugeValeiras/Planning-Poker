import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-share-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './share-room-dialog.component.html',
  styleUrls: ['./share-room-dialog.component.scss']
})
export class ShareRoomDialogComponent {
  private roomService = inject(RoomService);
  private router = inject(Router);

  @Input() roomCode = '';
  @Input() roomName = '';

  visible = false;
  codeCopied = false;
  linkCopied = false;

  get inviteLink(): string {
    return this.roomService.getInviteLink(this.roomCode);
  }

  show() {
    this.visible = true;
    this.codeCopied = false;
    this.linkCopied = false;
  }

  hide() {
    this.visible = false;
  }

  goToRoom() {
    console.log('ShareRoomDialog: Navigating to room:', this.roomCode);
    this.hide();
    this.router.navigate(['/room', this.roomCode]);
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.roomCode);
      this.codeCopied = true;
      setTimeout(() => {
        this.codeCopied = false;
      }, 3000);
    } catch (error) {
      console.error('Error copiando código:', error);
    }
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.inviteLink);
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    } catch (error) {
      console.error('Error copiando link:', error);
    }
  }
}
