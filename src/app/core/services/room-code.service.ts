import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs 
} from '@angular/fire/firestore';
import { generateRoomCode, isValidRoomCode } from '../utils/room-code.generator';

@Injectable({
  providedIn: 'root'
})
export class RoomCodeService {
  private firestore = inject(Firestore);
  private maxRetries = 10;

  /**
   * Genera un código único de sala verificando que no exista en Firestore
   * NOTA: Temporalmente deshabilitada la verificación hasta que se configuren las reglas de Firestore
   */
  async generateUniqueCode(): Promise<string> {
    console.log('RoomCodeService: Starting code generation...');
    
    // TODO: Re-habilitar verificación cuando las reglas de Firestore estén configuradas
    // Por ahora, generar código aleatorio sin verificar
    const code = generateRoomCode();
    console.log(`RoomCodeService: Generated code ${code} (verification disabled)`);
    
    /* CÓDIGO ORIGINAL - Descomentar cuando las reglas de Firestore estén configuradas:
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      const code = generateRoomCode();
      console.log(`RoomCodeService: Attempt ${attempts + 1}: Generated code ${code}`);
      
      const isAvailable = await this.isCodeAvailable(code);
      console.log(`RoomCodeService: Code ${code} available:`, isAvailable);
      
      if (isAvailable) {
        console.log(`RoomCodeService: Using code ${code}`);
        return code;
      }
      
      attempts++;
    }
    
    throw new Error(`No se pudo generar un código único después de ${this.maxRetries} intentos`);
    */
    
    return code;
  }

  /**
   * Verifica si un código está disponible (no existe en Firestore)
   */
  async isCodeAvailable(code: string): Promise<boolean> {
    try {
      console.log(`RoomCodeService: Checking if code ${code} is available...`);
      const roomsRef = collection(this.firestore, 'rooms');
      const q = query(roomsRef, where('roomCode', '==', code));
      
      console.log('RoomCodeService: Executing query...');
      const snapshot = await getDocs(q);
      
      console.log(`RoomCodeService: Query completed. Empty:`, snapshot.empty);
      return snapshot.empty;
    } catch (error) {
      console.error('RoomCodeService: Error checking code availability:', error);
      throw error;
    }
  }

  /**
   * Valida el formato de un código
   */
  validateCode(code: string): boolean {
    return isValidRoomCode(code);
  }
}
