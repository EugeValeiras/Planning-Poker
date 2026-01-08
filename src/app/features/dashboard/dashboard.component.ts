import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CreateRoomDialogComponent } from './create-room-dialog/create-room-dialog.component';
import { JoinRoomDialogComponent } from './join-room-dialog/join-room-dialog.component';
import { ShareRoomDialogComponent } from './share-room-dialog/share-room-dialog.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { RoomService } from '../../core/services/room.service';
import { AuthService } from '../../core/services/auth.service';
import { Room } from '../../core/models/room.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    CardModule, 
    ButtonModule,
    SkeletonModule,
    CreateRoomDialogComponent,
    JoinRoomDialogComponent,
    ShareRoomDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private roomService = inject(RoomService);
  authService = inject(AuthService); // Public for template access
  private router = inject(Router);

  @ViewChild(CreateRoomDialogComponent) createDialog!: CreateRoomDialogComponent;
  @ViewChild(JoinRoomDialogComponent) joinDialog!: JoinRoomDialogComponent;
  @ViewChild(ShareRoomDialogComponent) shareDialog!: ShareRoomDialogComponent;

  rooms: Room[] = [];
  loading = true;
  private authSubscription?: Subscription;

  ngOnInit() {
    console.log('Dashboard: ngOnInit called');
    // Suscribirse al estado de autenticación y cargar salas cuando esté listo
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('Dashboard: user$ emitted', user ? `User: ${user.uid}` : 'No user');
      if (user) {
        this.loadRooms(user.uid);
      } else {
        console.log('Dashboard: No user, setting loading to false');
        this.loading = false;
        this.rooms = [];
      }
    });
  }

  ngAfterViewInit() {
    console.log('Dashboard: ngAfterViewInit called');
    console.log('Dashboard: createDialog:', this.createDialog);
    console.log('Dashboard: joinDialog:', this.joinDialog);
    console.log('Dashboard: shareDialog:', this.shareDialog);
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadRooms(userId: string) {
    try {
      console.log('Dashboard: loadRooms called for user', userId);
      this.loading = true;
      // Obtener salas donde el usuario es participante
      this.rooms = await this.roomService.getRoomsWhereParticipant(userId);
      console.log('Dashboard: Rooms loaded', this.rooms.length);
    } catch (error) {
      console.error('Dashboard: Error cargando salas:', error);
      this.rooms = [];
    } finally {
      console.log('Dashboard: Setting loading to false');
      this.loading = false;
    }
  }

  showCreateDialog() {
    console.log('Dashboard: showCreateDialog called', this.createDialog);
    if (this.createDialog) {
      this.createDialog.show();
    } else {
      console.error('Dashboard: createDialog is undefined!');
    }
  }

  showJoinDialog() {
    console.log('Dashboard: showJoinDialog called', this.joinDialog);
    if (this.joinDialog) {
      this.joinDialog.show();
    } else {
      console.error('Dashboard: joinDialog is undefined!');
    }
  }

  async onRoomCreated(event: { roomId: string; roomCode: string }) {
    // Mostrar dialog de compartir
    this.shareDialog.roomCode = event.roomCode;
    this.shareDialog.roomName = this.rooms.find(r => r.roomId === event.roomId)?.name || 'Nueva sala';
    
    // Recargar salas
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      await this.loadRooms(currentUser.uid);
    }
    
    // Mostrar dialog de compartir después de un pequeño delay
    setTimeout(() => {
      this.shareDialog.show();
    }, 300);
  }

  enterRoom(roomCode: string) {
    this.router.navigate(['/room', roomCode]);
  }

  getTimeSince(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' años';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' meses';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' días';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' horas';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutos';
    
    return 'Ahora';
  }
}
