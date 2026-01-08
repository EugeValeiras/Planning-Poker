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
  serverTimestamp,
  collectionData,
  query,
  orderBy,
  Timestamp,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Participant, RoleType } from '../models/room.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  /**
   * Agregar participante a una sala
   */
  async addParticipant(roomId: string, userId: string, role: RoleType = 'voter'): Promise<void> {
    try {
      console.log('ParticipantService: Adding participant', { roomId, userId, role });
      
      // Obtener usuario actual de Firebase Auth directamente
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('Usuario no autenticado o ID no coincide');
      }

      console.log('ParticipantService: User data from Auth:', {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email
      });

      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      
      const participant: Participant = {
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Usuario',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL,
        role,
        isOnline: true,
        lastSeen: serverTimestamp() as Timestamp,
        hasVoted: false,
        joinedAt: serverTimestamp() as Timestamp
      };

      console.log('ParticipantService: Saving participant to Firestore...', participant);
      await setDoc(participantRef, participant);
      console.log('ParticipantService: Participant saved successfully!');
    } catch (error) {
      console.error('ParticipantService: Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Obtener participantes de una sala (tiempo real)
   */
  getParticipants(roomId: string): Observable<Participant[]> {
    const participantsRef = collection(this.firestore, `rooms/${roomId}/participants`);
    const q = query(participantsRef, orderBy('joinedAt', 'asc'));
    return collectionData(q, { idField: 'userId' }) as Observable<Participant[]>;
  }

  /**
   * Verificar si un usuario es participante de una sala
   */
  async isParticipant(roomId: string, userId: string): Promise<boolean> {
    try {
      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      const participantDoc = await getDoc(participantRef);
      return participantDoc.exists();
    } catch (error) {
      console.error('Error verificando participante:', error);
      return false;
    }
  }

  /**
   * Actualizar rol de participante
   */
  async updateParticipantRole(roomId: string, userId: string, role: RoleType): Promise<void> {
    try {
      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      await updateDoc(participantRef, { role });
    } catch (error) {
      console.error('Error actualizando rol:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de voto
   */
  async updateVotedStatus(roomId: string, userId: string, hasVoted: boolean): Promise<void> {
    try {
      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      await updateDoc(participantRef, { hasVoted });
    } catch (error) {
      console.error('Error actualizando estado de voto:', error);
      throw error;
    }
  }

  /**
   * Actualizar presencia
   */
  async updatePresence(roomId: string, userId: string, isOnline: boolean): Promise<void> {
    try {
      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      await updateDoc(participantRef, {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando presencia:', error);
      throw error;
    }
  }

  /**
   * Remover participante de una sala
   */
  async removeParticipant(roomId: string, userId: string): Promise<void> {
    try {
      const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${userId}`);
      await deleteDoc(participantRef);
    } catch (error) {
      console.error('Error removiendo participante:', error);
      throw error;
    }
  }

  /**
   * Resetear votos de todos los participantes
   */
  async resetAllVotes(roomId: string): Promise<void> {
    try {
      const participantsRef = collection(this.firestore, `rooms/${roomId}/participants`);
      const snapshot = await getDocs(query(participantsRef));
      
      // Resetear currentVote de todos los participantes usando batch
      const batch = writeBatch(this.firestore);
      
      snapshot.docs.forEach(docSnap => {
        const participantRef = doc(this.firestore, `rooms/${roomId}/participants/${docSnap.id}`);
        batch.update(participantRef, {
          currentVote: null
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error reseteando votos:', error);
      throw error;
    }
  }
}
