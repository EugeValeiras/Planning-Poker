import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  serverTimestamp,
  collectionData,
  docData,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Room, CreateRoomDto } from '../models/room.model';
import { RoomCodeService } from './room-code.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const DEFAULT_VOTING_SCALE = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕"];

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private firestore = inject(Firestore);
  private roomCodeService = inject(RoomCodeService);
  private authService = inject(AuthService);

  /**
   * Crear una nueva sala
   */
  async createRoom(roomData: CreateRoomDto): Promise<{ roomId: string; roomCode: string }> {
    try {
      console.log('RoomService: Starting createRoom...', roomData);
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      console.log('RoomService: User authenticated:', currentUser.uid);

      // Generar código único para la sala
      console.log('RoomService: Generating unique code...');
      const roomCode = await this.roomCodeService.generateUniqueCode();
      console.log('RoomService: Code generated:', roomCode);
      
      // Crear documento de sala
      const roomsRef = collection(this.firestore, 'rooms');
      const newRoomRef = doc(roomsRef);
      const roomId = newRoomRef.id;

      console.log('RoomService: Creating room document with ID:', roomId);

      const room: Partial<Room> = {
        roomId,
        roomCode,
        name: roomData.name,
        description: roomData.description,
        createdBy: currentUser.uid,
        moderatorId: currentUser.uid,
        votingScale: roomData.votingScale || DEFAULT_VOTING_SCALE,
        isVotingActive: false,
        votesRevealed: false,
        currentStoryId: null,
        timerDuration: 300, // 5 minutos por defecto
        timerStartedAt: null,
        timerPausedAt: null,
        timerRemainingSeconds: null,
        actionLoading: false,
        actionLoadingMessage: '',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      console.log('RoomService: Saving to Firestore...');
      await setDoc(newRoomRef, room);
      console.log('RoomService: Room saved successfully!');

      return { roomId, roomCode };
    } catch (error) {
      console.error('RoomService: Error creating room:', error);
      throw error;
    }
  }

  /**
   * Obtener sala por código
   */
  async getRoomByCode(roomCode: string): Promise<Room | null> {
    try {
      const roomsRef = collection(this.firestore, 'rooms');
      const q = query(roomsRef, where('roomCode', '==', roomCode.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as Room;
    } catch (error) {
      console.error('Error obteniendo sala por código:', error);
      throw error;
    }
  }

  /**
   * Obtener sala por ID (tiempo real)
   */
  getRoomById(roomId: string): Observable<Room | undefined> {
    const roomRef = doc(this.firestore, `rooms/${roomId}`);
    return docData(roomRef, { idField: 'roomId' }) as Observable<Room | undefined>;
  }

  /**
   * Obtener salas del usuario (tiempo real)
   */
  getUserRooms(userId: string): Observable<Room[]> {
    const roomsRef = collection(this.firestore, 'rooms');
    const q = query(
      roomsRef, 
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'roomId' }) as Observable<Room[]>;
  }

  /**
   * Obtener salas donde el usuario es participante o creador
   * Nota: Este método usa collectionGroup para buscar en todos los participants
   * Si hay problemas de permisos, usar el método alternativo basado en createdBy
   */
  async getRoomsWhereParticipant(userId: string): Promise<Room[]> {
    try {
      // Estrategia: Obtener salas donde el usuario es creador
      // Ya que al crear una sala automáticamente el creador es participante
      const roomsRef = collection(this.firestore, 'rooms');
      const q = query(
        roomsRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const rooms: Room[] = snapshot.docs.map(doc => doc.data() as Room);
      
      return rooms;
    } catch (error) {
      console.error('Error obteniendo salas del participante:', error);
      // Si hay error, devolver array vacío en lugar de lanzar error
      return [];
    }
  }

  /**
   * Actualizar sala
   */
  async updateRoom(roomId: string, data: Partial<Room>): Promise<void> {
    try {
      const roomRef = doc(this.firestore, `rooms/${roomId}`);
      await updateDoc(roomRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando sala:', error);
      throw error;
    }
  }

  /**
   * Eliminar sala
   */
  async deleteRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(this.firestore, `rooms/${roomId}`);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('Error eliminando sala:', error);
      throw error;
    }
  }

  /**
   * Iniciar votación
   */
  async startVoting(roomId: string, storyId: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        isVotingActive: true,
        votesRevealed: false,
        currentStoryId: storyId
      });
    } catch (error) {
      console.error('Error iniciando votación:', error);
      throw error;
    }
  }

  /**
   * Detener votación
   */
  async stopVoting(roomId: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        isVotingActive: false
      });
    } catch (error) {
      console.error('Error deteniendo votación:', error);
      throw error;
    }
  }

  /**
   * Revelar votos
   */
  async revealVotes(roomId: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        votesRevealed: true
      });
    } catch (error) {
      console.error('Error revelando votos:', error);
      throw error;
    }
  }

  /**
   * Resetear votación
   */
  async resetVoting(roomId: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        isVotingActive: false,
        votesRevealed: false,
        currentStoryId: null
      });
    } catch (error) {
      console.error('Error reseteando votación:', error);
      throw error;
    }
  }

  /**
   * Generar link de invitación
   */
  getInviteLink(roomCode: string): string {
    return `${environment.appUrl}/room/${roomCode}`;
  }

  /**
   * Establecer estado de loading (sincronizado en tiempo real)
   */
  async setActionLoading(roomId: string, message: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        actionLoading: true,
        actionLoadingMessage: message
      });
    } catch (error) {
      console.error('Error setting action loading:', error);
      throw error;
    }
  }

  /**
   * Limpiar estado de loading (sincronizado en tiempo real)
   */
  async clearActionLoading(roomId: string): Promise<void> {
    try {
      await this.updateRoom(roomId, {
        actionLoading: false,
        actionLoadingMessage: ''
      });
    } catch (error) {
      console.error('Error clearing action loading:', error);
      throw error;
    }
  }
}
