import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { RoomService } from '../../core/services/room.service';
import { ParticipantService } from '../../core/services/participant.service';
import { AuthService } from '../../core/services/auth.service';
import { StoryService } from '../../core/services/story.service';
import { SoundService } from '../../core/services/sound.service';
import { Room, Participant } from '../../core/models/room.model';
import { Story, Vote } from '../../core/models/story.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    CardModule,
    ButtonModule,
    AvatarModule,
    AvatarGroupModule,
    BadgeModule,
    ChipModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private roomService = inject(RoomService);
  private participantService = inject(ParticipantService);
  private authService = inject(AuthService);
  private storyService = inject(StoryService);
  private soundService = inject(SoundService);

  roomCode = '';
  room?: Room;
  participants: Participant[] = [];
  currentUserId = '';
  loading = true;
  error = false;
  isParticipant = false;
  joiningRoom = false;
  checkingParticipant = true; // Nueva variable para el loading de verificación

  private roomSubscription?: Subscription;
  private participantsSubscription?: Subscription;
  private votesSubscription?: Subscription;
  private storySubscription?: Subscription;

  // Escalas de votación para display
  votingCards: string[] = [];
  selectedVote: string | null = null;
  hasVoted = false;

  // Current story (para votación sin lista de historias)
  currentStoryId: string | null = null;
  currentStory: Story | null = null;
  votes: Vote[] = [];

  // Estado anterior para detectar cambios y reproducir sonidos
  private previousVotingActive: boolean | null = null;
  private previousVotesRevealed: boolean | null = null;

  ngOnInit() {
    console.log('RoomComponent: Initializing...');
    
    // Obtener código de sala de la URL
    this.roomCode = this.route.snapshot.paramMap.get('roomCode') || '';
    console.log('RoomComponent: Room code from URL:', this.roomCode);

    if (!this.roomCode) {
      console.error('RoomComponent: No room code provided');
      this.error = true;
      this.loading = false;
      return;
    }

    // Obtener usuario actual
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('RoomComponent: No current user');
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = currentUser.uid;
    console.log('RoomComponent: Current user ID:', this.currentUserId);

    this.loadRoom();
  }

  async ngOnDestroy() {
    console.log('RoomComponent: Destroying, unsubscribing...');
    
    // Marcar como offline antes de destruir el componente
    // Solo si el usuario sigue siendo participante (no fue removido manualmente)
    if (this.isParticipant) {
      await this.setOnlineStatus(false);
    }
    
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
    if (this.participantsSubscription) {
      this.participantsSubscription.unsubscribe();
    }
    if (this.votesSubscription) {
      this.votesSubscription.unsubscribe();
    }
    if (this.storySubscription) {
      this.storySubscription.unsubscribe();
    }

    // Remover listeners de presencia
    this.removePresenceListeners();
  }

  async loadRoom() {
    try {
      console.log('RoomComponent: Loading room...');
      
      // Buscar sala por código
      const room = await this.roomService.getRoomByCode(this.roomCode);
      
      if (!room) {
        console.error('RoomComponent: Room not found');
        this.error = true;
        this.loading = false;
        return;
      }

      console.log('RoomComponent: Room found:', room);
      this.room = room;
      this.votingCards = room.votingScale;

      // Suscribirse a cambios en tiempo real
      this.subscribeToRoom(room.roomId);
      this.subscribeToParticipants(room.roomId);

      // Configurar listeners para detectar desconexión
      this.setupPresenceListeners();

      this.loading = false;
    } catch (error) {
      console.error('RoomComponent: Error loading room:', error);
      this.error = true;
      this.loading = false;
    }
  }

  subscribeToRoom(roomId: string) {
    console.log('RoomComponent: Subscribing to room updates...');
    this.roomSubscription = this.roomService.getRoomById(roomId).subscribe(
      room => {
        if (room) {
          console.log('RoomComponent: Room updated:', room);
          
          // Detectar cambios en el estado de votación y reproducir sonidos
          // SOLO si NO somos moderador (el moderador ya escucha el sonido al hacer clic)
          if (!this.isModerator) {
            this.handleVotingStateChanges(room);
          }
          
          this.room = room;
          this.votingCards = room.votingScale;
          this.currentStoryId = room.currentStoryId;

          // Si hay una historia activa, suscribirse a los votos y a la historia
          if (room.currentStoryId && room.isVotingActive) {
            this.subscribeToVotes(roomId, room.currentStoryId);
            this.subscribeToStory(roomId, room.currentStoryId);
          } else {
            // Limpiar suscripciones si no hay votación activa
            if (this.votesSubscription) {
              this.votesSubscription.unsubscribe();
              this.votesSubscription = undefined;
            }
            if (this.storySubscription) {
              this.storySubscription.unsubscribe();
              this.storySubscription = undefined;
            }
            this.votes = [];
            this.currentStory = null;
          }
        }
      },
      error => console.error('RoomComponent: Error in room subscription:', error)
    );
  }

  /**
   * Detecta cambios en el estado de votación y reproduce sonidos para participantes no moderadores
   */
  private handleVotingStateChanges(newRoom: Room) {
    // Si es la primera vez que recibimos datos, solo guardamos el estado
    if (this.previousVotingActive === null && this.previousVotesRevealed === null) {
      this.previousVotingActive = newRoom.isVotingActive;
      this.previousVotesRevealed = newRoom.votesRevealed;
      return;
    }

    const votingJustStarted = !this.previousVotingActive && newRoom.isVotingActive;
    const votesJustRevealed = !this.previousVotesRevealed && newRoom.votesRevealed;
    const votingJustCanceled = this.previousVotingActive && !newRoom.isVotingActive && !newRoom.votesRevealed;
    
    // Reproducir sonido cuando se inicia votación
    if (votingJustStarted) {
      console.log('RoomComponent: Voting started by moderator, playing sound');
      this.soundService.play('start');
    }
    
    // Reproducir sonido cuando se revelan votos
    if (votesJustRevealed) {
      console.log('RoomComponent: Votes revealed by moderator, playing sound');
      this.soundService.play('reveal');
    }
    
    // Reproducir sonido cuando se cancela votación
    if (votingJustCanceled) {
      console.log('RoomComponent: Voting canceled by moderator, playing sound');
      this.soundService.play('cancel');
    }

    // Actualizar estado anterior
    this.previousVotingActive = newRoom.isVotingActive;
    this.previousVotesRevealed = newRoom.votesRevealed;
  }

  subscribeToParticipants(roomId: string) {
    console.log('RoomComponent: Subscribing to participants...');
    this.participantsSubscription = this.participantService.getParticipants(roomId).subscribe(
      participants => {
        console.log('RoomComponent: Participants updated:', participants.length);
        this.participants = participants;
        
        // Verificar si el usuario actual es participante
        const currentParticipant = participants.find(p => p.userId === this.currentUserId);
        const wasParticipant = this.isParticipant;
        this.isParticipant = !!currentParticipant;
        this.hasVoted = currentParticipant?.hasVoted || false;
        
        console.log('RoomComponent: isParticipant:', this.isParticipant);
        
        // Desactivar loading de verificación después de la primera comprobación
        if (this.checkingParticipant) {
          this.checkingParticipant = false;
          console.log('RoomComponent: Participant check completed');
        }
        
        // Si el usuario acaba de convertirse en participante, marcar como online
        if (this.isParticipant && !wasParticipant) {
          console.log('RoomComponent: User just became participant, setting online status');
          this.setOnlineStatus(true);
        }
        
        // Si el participante estaba offline, marcarlo como online
        if (this.isParticipant && currentParticipant && !currentParticipant.isOnline) {
          console.log('RoomComponent: Participant is offline, setting online status');
          this.setOnlineStatus(true);
        }
      },
      error => console.error('RoomComponent: Error in participants subscription:', error)
    );
  }

  subscribeToVotes(roomId: string, storyId: string) {
    console.log('RoomComponent: Subscribing to votes...', { roomId, storyId });
    
    // Limpiar suscripción anterior si existe
    if (this.votesSubscription) {
      this.votesSubscription.unsubscribe();
    }

    this.votesSubscription = this.storyService.getVotes(roomId, storyId).subscribe(
      async votes => {
        console.log('RoomComponent: Votes updated:', votes.length);
        this.votes = votes;
        
        // Actualizar estado hasVoted de participantes basado en votos
        const voterIds = new Set(votes.map(v => v.userId));
        this.participants.forEach(async (p) => {
          const hasVotedNow = voterIds.has(p.userId);
          if (p.hasVoted !== hasVotedNow && this.room) {
            // Actualizar estado local inmediatamente
            p.hasVoted = hasVotedNow;
            // Actualizar Firestore
            await this.participantService.updateVotedStatus(this.room.roomId, p.userId, hasVotedNow);
          }
        });

        // Verificar si el usuario actual ha votado
        this.hasVoted = voterIds.has(this.currentUserId);
        const vote = votes.find(v => v.userId === this.currentUserId);
        this.selectedVote = vote?.value || null;

        // Calcular estadísticas automáticamente cuando hay votos
        // Esto actualiza las métricas en tiempo real
        if (votes.length > 0) {
          try {
            await this.storyService.calculateStatistics(roomId, storyId);
            console.log('RoomComponent: Statistics updated automatically');
          } catch (error) {
            console.warn('RoomComponent: Error calculating statistics:', error);
          }
        }
      },
      error => console.error('RoomComponent: Error in votes subscription:', error)
    );
  }

  subscribeToStory(roomId: string, storyId: string) {
    console.log('RoomComponent: Subscribing to story...', { roomId, storyId });
    
    // Limpiar suscripción anterior si existe
    if (this.storySubscription) {
      this.storySubscription.unsubscribe();
    }

    // Suscribirse a cambios en la historia para obtener estadísticas
    this.storySubscription = this.storyService.getStories(roomId).subscribe(
      stories => {
        const story = stories.find(s => s.storyId === storyId);
        if (story) {
          console.log('RoomComponent: Story updated:', story);
          this.currentStory = story;
        }
      },
      error => console.error('RoomComponent: Error in story subscription:', error)
    );
  }

  // ==========================================
  // VOTACIÓN
  // ==========================================
  
  async vote(value: string) {
    if (!this.room || !this.room.isVotingActive || !this.currentStoryId) {
      console.log('RoomComponent: Voting is not active or no story');
      return;
    }

    // Permitir cambiar el voto si el usuario ya votó
    if (this.selectedVote === value) {
      console.log('RoomComponent: Same vote, ignoring');
      return;
    }

    try {
      console.log('RoomComponent: Voting with value:', value, this.hasVoted ? '(changing vote)' : '(new vote)');
      
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('RoomComponent: No current user');
        return;
      }

      // Reproducir sonido
      this.soundService.play('vote');
      
      // Registrar voto en Firestore
      await this.storyService.vote(
        this.room.roomId,
        this.currentStoryId,
        currentUser.uid,
        currentUser.displayName || 'Usuario',
        currentUser.photoURL,
        value
      );

      // Actualizar estado local (se actualizará con la suscripción)
      this.selectedVote = value;
      this.hasVoted = true;

      // Actualizar estado de voto del participante
      await this.participantService.updateVotedStatus(
        this.room.roomId,
        currentUser.uid,
        true
      );

      console.log('RoomComponent: Vote recorded successfully');
    } catch (error) {
      console.error('RoomComponent: Error voting:', error);
      alert('Error al registrar voto. Por favor intenta nuevamente.');
    }
  }

  // ==========================================
  // CONTROLES DE MODERADOR
  // ==========================================
  
  async startVoting() {
    if (!this.room || !this.isModerator) {
      return;
    }

    try {
      // Reproducir sonido
      this.soundService.play('start');
      
      // Establecer loading en Firestore (todos los usuarios lo verán)
      await this.roomService.setActionLoading(this.room.roomId, 'Iniciando votación...');
      console.log('RoomComponent: Starting voting...');

      // Crear una historia temporal si no existe
      let storyId = this.room.currentStoryId;
      
      if (!storyId) {
        storyId = await this.storyService.createStory(this.room.roomId, {
          title: 'Votación rápida',
          description: 'Sesión de estimación'
        });
      }

      // Resetear votos de todos los participantes
      await this.participantService.resetAllVotes(this.room.roomId);

      // Activar votación
      await this.roomService.startVoting(this.room.roomId, storyId);

      console.log('RoomComponent: Voting started!');
    } catch (error) {
      console.error('RoomComponent: Error starting voting:', error);
      alert('Error al iniciar votación. Por favor intenta nuevamente.');
    } finally {
      // Limpiar loading en Firestore
      if (this.room) {
        await this.roomService.clearActionLoading(this.room.roomId);
      }
    }
  }

  async revealVotes() {
    if (!this.room || !this.isModerator || !this.currentStoryId) {
      return;
    }

    try {
      // Reproducir sonido
      this.soundService.play('reveal');
      
      // Establecer loading en Firestore (todos los usuarios lo verán)
      await this.roomService.setActionLoading(this.room.roomId, 'Calculando resultados...');
      console.log('RoomComponent: Revealing votes...');

      // Calcular estadísticas
      await this.storyService.calculateStatistics(this.room.roomId, this.currentStoryId);

      // Revelar votos
      await this.roomService.revealVotes(this.room.roomId);

      console.log('RoomComponent: Votes revealed!');
    } catch (error) {
      console.error('RoomComponent: Error revealing votes:', error);
      alert('Error al revelar votos. Por favor intenta nuevamente.');
    } finally {
      // Limpiar loading en Firestore
      if (this.room) {
        await this.roomService.clearActionLoading(this.room.roomId);
      }
    }
  }

  async newRound() {
    if (!this.room || !this.isModerator) {
      return;
    }

    try {
      // Reproducir sonido
      this.soundService.play('complete');
      
      // Establecer loading en Firestore (todos los usuarios lo verán)
      await this.roomService.setActionLoading(this.room.roomId, 'Preparando nueva ronda...');
      console.log('RoomComponent: Starting new round...');

      // Limpiar votos de la historia actual si existe
      if (this.currentStoryId) {
        await this.storyService.clearVotes(this.room.roomId, this.currentStoryId);
      }

      // Resetear estado de votación
      await this.roomService.resetVoting(this.room.roomId);

      // Resetear votos de participantes
      await this.participantService.resetAllVotes(this.room.roomId);

      // Limpiar estado local
      this.selectedVote = null;
      this.hasVoted = false;
      this.votes = [];

      console.log('RoomComponent: New round prepared, starting voting...');

      // Crear una nueva historia temporal o reutilizar la actual
      let storyId = this.room.currentStoryId;
      
      if (!storyId) {
        storyId = await this.storyService.createStory(this.room.roomId, {
          title: 'Votación rápida',
          description: 'Sesión de estimación'
        });
      }

      // Activar votación automáticamente
      await this.roomService.startVoting(this.room.roomId, storyId);

      console.log('RoomComponent: New round started and voting active!');
    } catch (error) {
      console.error('RoomComponent: Error starting new round:', error);
      alert('Error al iniciar nueva ronda. Por favor intenta nuevamente.');
    } finally {
      // Limpiar loading en Firestore
      if (this.room) {
        await this.roomService.clearActionLoading(this.room.roomId);
      }
    }
  }

  async cancelVoting() {
    if (!this.room || !this.isModerator) {
      return;
    }

    try {
      // Reproducir sonido
      this.soundService.play('cancel');
      
      // Establecer loading en Firestore (todos los usuarios lo verán)
      await this.roomService.setActionLoading(this.room.roomId, 'Cancelando votación...');
      console.log('RoomComponent: Canceling voting...');

      // Detener votación
      await this.roomService.stopVoting(this.room.roomId);

      // Resetear votos de participantes
      await this.participantService.resetAllVotes(this.room.roomId);

      // Limpiar votos de la historia si existe
      if (this.currentStoryId) {
        await this.storyService.clearVotes(this.room.roomId, this.currentStoryId);
      }

      // Limpiar estado local
      this.selectedVote = null;
      this.hasVoted = false;
      this.votes = [];

      console.log('RoomComponent: Voting canceled!');
    } catch (error) {
      console.error('RoomComponent: Error canceling voting:', error);
      alert('Error al cancelar votación. Por favor intenta nuevamente.');
    } finally {
      // Limpiar loading en Firestore
      if (this.room) {
        await this.roomService.clearActionLoading(this.room.roomId);
      }
    }
  }

  // Helpers
  get isModerator(): boolean {
    return this.room?.moderatorId === this.currentUserId;
  }

  get actionLoading(): boolean {
    return this.room?.actionLoading || false;
  }

  get actionLoadingMessage(): string {
    return this.room?.actionLoadingMessage || '';
  }

  get currentParticipant(): Participant | undefined {
    return this.participants.find(p => p.userId === this.currentUserId);
  }

  get voters(): Participant[] {
    return this.participants.filter(p => p.role === 'voter' || p.role === 'moderator');
  }

  get observers(): Participant[] {
    return this.participants.filter(p => p.role === 'observer');
  }

  get votersWhoVoted(): number {
    return this.voters.filter(v => v.hasVoted).length;
  }

  get totalVoters(): number {
    return this.voters.length;
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'moderator': return 'Moderador';
      case 'voter': return 'Votante';
      case 'observer': return 'Observador';
      default: return role;
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'moderator': return 'pi-star-fill';
      case 'voter': return 'pi-user';
      case 'observer': return 'pi-eye';
      default: return 'pi-user';
    }
  }

  /**
   * Obtener votos agrupados por valor de carta
   */
  getVotesForCard(cardValue: string): Vote[] {
    if (!this.room?.votesRevealed) {
      return [];
    }
    return this.votes.filter(v => v.value === cardValue);
  }

  /**
   * Verificar si una carta tiene votos
   */
  cardHasVotes(cardValue: string): boolean {
    return this.getVotesForCard(cardValue).length > 0;
  }

  copyRoomCode() {
    // Construir URL completa de acceso a la sala
    const baseUrl = window.location.origin;
    const roomUrl = `${baseUrl}/room/${this.roomCode}`;
    
    navigator.clipboard.writeText(roomUrl);
    console.log('RoomComponent: Room URL copied:', roomUrl);
    
    // Mostrar feedback visual temporal
    const badge = document.querySelector('.room-code-badge');
    if (badge) {
      badge.classList.add('copied');
      setTimeout(() => {
        badge.classList.remove('copied');
      }, 2000);
    }
  }

  async leaveRoom() {
    console.log('RoomComponent: Leaving room');
    
    // Si el usuario es participante, eliminarlo de la sala
    if (this.room && this.isParticipant) {
      try {
        console.log('RoomComponent: Removing participant from room');
        await this.participantService.removeParticipant(this.room.roomId, this.currentUserId);
        console.log('RoomComponent: Participant removed successfully');
      } catch (error) {
        console.error('RoomComponent: Error removing participant:', error);
        // Continuar con la navegación aunque falle la eliminación
      }
    }
    
    this.router.navigate(['/dashboard']);
  }

  async kickParticipant(participant: Participant) {
    if (!this.room || !this.isModerator) {
      return;
    }

    // No permitir que el moderador se expulse a sí mismo
    if (participant.userId === this.currentUserId) {
      console.warn('RoomComponent: Cannot kick yourself');
      return;
    }

    // Confirmar acción
    const confirmKick = confirm(`¿Estás seguro de que quieres expulsar a ${participant.displayName}?`);
    if (!confirmKick) {
      return;
    }

    try {
      console.log('RoomComponent: Kicking participant:', participant.displayName);
      await this.participantService.removeParticipant(this.room.roomId, participant.userId);
      console.log('RoomComponent: Participant kicked successfully');
      
      // Mostrar feedback visual
      const badge = document.querySelector('.room-code-badge');
      if (badge) {
        // Usar el mismo mecanismo de feedback que copiar código
        console.log(`RoomComponent: ${participant.displayName} expulsado de la sala`);
      }
    } catch (error) {
      console.error('RoomComponent: Error kicking participant:', error);
      alert('Error al expulsar participante. Por favor intenta nuevamente.');
    }
  }

  toggleSound() {
    const currentState = this.soundService.isEnabled();
    this.soundService.setEnabled(!currentState);
    console.log(`RoomComponent: Sound ${!currentState ? 'enabled' : 'disabled'}`);
  }

  get isSoundEnabled(): boolean {
    return this.soundService.isEnabled();
  }

  async joinRoom() {
    if (!this.room || this.joiningRoom) {
      return;
    }

    try {
      this.joiningRoom = true;
      console.log('RoomComponent: Joining room...');

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('RoomComponent: No current user');
        return;
      }

      // Agregar usuario como participante con rol 'voter'
      await this.participantService.addParticipant(this.room.roomId, currentUser.uid, 'voter');
      
      // Marcar como online después de unirse
      await this.setOnlineStatus(true);
      
      console.log('RoomComponent: Successfully joined room!');
      // isParticipant se actualizará automáticamente por la suscripción
    } catch (error) {
      console.error('RoomComponent: Error joining room:', error);
      alert('Error al unirse a la sala. Por favor intenta nuevamente.');
      this.joiningRoom = false;
    }
  }

  // ==========================================
  // SISTEMA DE PRESENCIA
  // ==========================================
  
  private handleBeforeUnload = () => {
    // beforeunload debe ser síncrono, usar updateDoc directamente
    if (this.room && this.isParticipant) {
      this.setOnlineStatusSync(false);
    }
  };

  private handleVisibilityChange = async () => {
    if (document.hidden) {
      await this.setOnlineStatus(false);
    } else if (this.isParticipant) {
      await this.setOnlineStatus(true);
    }
  };

  setupPresenceListeners() {
    // Detectar cuando el usuario cierra la pestaña/navegador
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Detectar cuando el usuario cambia de pestaña
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    console.log('RoomComponent: Presence listeners configured');
  }

  removePresenceListeners() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('RoomComponent: Presence listeners removed');
  }

  async setOnlineStatus(isOnline: boolean) {
    if (!this.room || !this.isParticipant) {
      return;
    }

    try {
      console.log(`RoomComponent: Setting online status to ${isOnline}`);
      await this.participantService.updatePresence(
        this.room.roomId,
        this.currentUserId,
        isOnline
      );
    } catch (error) {
      console.error('RoomComponent: Error updating presence:', error);
    }
  }

  setOnlineStatusSync(isOnline: boolean) {
    if (!this.room) {
      return;
    }

    try {
      console.log(`RoomComponent: Setting online status (sync) to ${isOnline}`);
      // Usar updateDoc de forma síncrona para beforeunload
      import('@angular/fire/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
        const participantRef = doc(this.firestore, `rooms/${this.room!.roomId}/participants/${this.currentUserId}`);
        updateDoc(participantRef, {
          isOnline,
          lastSeen: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('RoomComponent: Error updating presence (sync):', error);
    }
  }
}
