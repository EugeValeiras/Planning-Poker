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
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Story, Vote, CreateStoryDto } from '../models/story.model';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private firestore = inject(Firestore);

  /**
   * Crear una nueva historia
   */
  async createStory(roomId: string, storyData: CreateStoryDto): Promise<string> {
    try {
      console.log('StoryService: Creating story...', { roomId, storyData });
      
      const storiesRef = collection(this.firestore, `rooms/${roomId}/stories`);
      const newStoryRef = doc(storiesRef);
      const storyId = newStoryRef.id;

      // Obtener el orden (última historia + 1)
      const existingStories = await getDocs(query(storiesRef, orderBy('order', 'desc')));
      const nextOrder = existingStories.empty ? 0 : (existingStories.docs[0].data()['order'] || 0) + 1;

      const story: Story = {
        storyId,
        title: storyData.title,
        description: storyData.description,
        status: 'pending',
        order: nextOrder,
        createdAt: serverTimestamp() as Timestamp,
        completedAt: null,
        finalEstimate: null,
        estimateConsensus: false,
        statistics: {
          average: null,
          mode: null,
          min: null,
          max: null,
          totalVotes: 0
        }
      };

      await setDoc(newStoryRef, story);
      console.log('StoryService: Story created!', storyId);
      
      return storyId;
    } catch (error) {
      console.error('StoryService: Error creating story:', error);
      throw error;
    }
  }

  /**
   * Obtener historias de una sala (tiempo real)
   */
  getStories(roomId: string): Observable<Story[]> {
    const storiesRef = collection(this.firestore, `rooms/${roomId}/stories`);
    const q = query(storiesRef, orderBy('order', 'asc'));
    return collectionData(q, { idField: 'storyId' }) as Observable<Story[]>;
  }

  /**
   * Obtener una historia específica
   */
  async getStory(roomId: string, storyId: string): Promise<Story | null> {
    try {
      const storyRef = doc(this.firestore, `rooms/${roomId}/stories/${storyId}`);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        return null;
      }

      return storyDoc.data() as Story;
    } catch (error) {
      console.error('StoryService: Error getting story:', error);
      throw error;
    }
  }

  /**
   * Actualizar historia
   */
  async updateStory(roomId: string, storyId: string, data: Partial<Story>): Promise<void> {
    try {
      console.log('StoryService: Updating story...', { roomId, storyId, data });
      const storyRef = doc(this.firestore, `rooms/${roomId}/stories/${storyId}`);
      await updateDoc(storyRef, data);
      console.log('StoryService: Story updated!');
    } catch (error) {
      console.error('StoryService: Error updating story:', error);
      throw error;
    }
  }

  /**
   * Eliminar historia
   */
  async deleteStory(roomId: string, storyId: string): Promise<void> {
    try {
      const storyRef = doc(this.firestore, `rooms/${roomId}/stories/${storyId}`);
      await deleteDoc(storyRef);
    } catch (error) {
      console.error('StoryService: Error deleting story:', error);
      throw error;
    }
  }

  /**
   * Registrar voto de un usuario
   */
  async vote(roomId: string, storyId: string, userId: string, userName: string, userPhoto: string | null, value: string): Promise<void> {
    try {
      console.log('StoryService: Registering vote...', { roomId, storyId, userId, value });
      
      const voteRef = doc(this.firestore, `rooms/${roomId}/stories/${storyId}/votes/${userId}`);
      
      const vote: Vote = {
        userId,
        userName,
        userPhoto,
        value,
        votedAt: serverTimestamp() as Timestamp
      };

      await setDoc(voteRef, vote);
      console.log('StoryService: Vote registered!');
    } catch (error) {
      console.error('StoryService: Error voting:', error);
      throw error;
    }
  }

  /**
   * Obtener votos de una historia (tiempo real)
   */
  getVotes(roomId: string, storyId: string): Observable<Vote[]> {
    const votesRef = collection(this.firestore, `rooms/${roomId}/stories/${storyId}/votes`);
    const q = query(votesRef, orderBy('votedAt', 'asc'));
    return collectionData(q, { idField: 'userId' }) as Observable<Vote[]>;
  }

  /**
   * Obtener votos de una historia (promesa)
   */
  async getVotesPromise(roomId: string, storyId: string): Promise<Vote[]> {
    try {
      const votesRef = collection(this.firestore, `rooms/${roomId}/stories/${storyId}/votes`);
      const q = query(votesRef, orderBy('votedAt', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data() as Vote);
    } catch (error) {
      console.error('StoryService: Error getting votes:', error);
      throw error;
    }
  }

  /**
   * Calcular estadísticas de votos
   */
  async calculateStatistics(roomId: string, storyId: string): Promise<void> {
    try {
      console.log('StoryService: Calculating statistics...', { roomId, storyId });
      
      const votes = await this.getVotesPromise(roomId, storyId);
      
      if (votes.length === 0) {
        return;
      }

      // Filtrar votos numéricos (excluir "?" y "☕")
      const numericVotes = votes
        .map(v => v.value)
        .filter(v => !isNaN(Number(v)))
        .map(v => Number(v));

      let average: number | null = null;
      let min: string | null = null;
      let max: string | null = null;

      if (numericVotes.length > 0) {
        average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
        min = Math.min(...numericVotes).toString();
        max = Math.max(...numericVotes).toString();
      }

      // Calcular moda (valor más frecuente)
      const valueCounts = new Map<string, number>();
      votes.forEach(v => {
        valueCounts.set(v.value, (valueCounts.get(v.value) || 0) + 1);
      });

      let mode: string | null = null;
      let maxCount = 0;
      valueCounts.forEach((count, value) => {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      });

      const statistics = {
        average: average ? Math.round(average * 100) / 100 : null,
        mode,
        min,
        max,
        totalVotes: votes.length
      };

      // Verificar consenso (todos votaron lo mismo)
      const uniqueValues = new Set(votes.map(v => v.value));
      const estimateConsensus = uniqueValues.size === 1;

      await this.updateStory(roomId, storyId, {
        statistics,
        estimateConsensus,
        finalEstimate: estimateConsensus ? mode : null
      });

      console.log('StoryService: Statistics calculated!', statistics);
    } catch (error) {
      console.error('StoryService: Error calculating statistics:', error);
      throw error;
    }
  }

  /**
   * Limpiar votos de una historia
   */
  async clearVotes(roomId: string, storyId: string): Promise<void> {
    try {
      console.log('StoryService: Clearing votes...', { roomId, storyId });
      
      const votesRef = collection(this.firestore, `rooms/${roomId}/stories/${storyId}/votes`);
      const snapshot = await getDocs(votesRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log('StoryService: Votes cleared!');
    } catch (error) {
      console.error('StoryService: Error clearing votes:', error);
      throw error;
    }
  }
}
