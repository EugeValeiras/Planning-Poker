import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  signInWithPopup, 
  signInAnonymously,
  GoogleAuthProvider, 
  signOut, 
  user,
  updateProfile,
  User as FirebaseUser 
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, of, switchMap } from 'rxjs';
import { User, CreateUserDto } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Observable del usuario autenticado de Firebase Auth
  user$ = user(this.auth);

  constructor() {}

  /**
   * Iniciar sesión con Google
   */
  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      
      if (result.user) {
        // Crear o actualizar el documento del usuario en Firestore
        await this.createOrUpdateUser(result.user, false);
        
        // La redirección será manejada por el componente que escucha user$
        // this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('Error en signInWithGoogle:', error);
      // Re-lanzar el error para que el componente lo maneje
      throw error;
    }
  }

  /**
   * Iniciar sesión como invitado con nombre personalizado
   */
  async signInAsGuest(guestName: string): Promise<void> {
    try {
      // Autenticación anónima de Firebase
      const result = await signInAnonymously(this.auth);
      
      if (result.user) {
        // Actualizar el perfil con el nombre del guest
        await updateProfile(result.user, {
          displayName: guestName
        });

        // Crear documento en Firestore marcado como guest
        await this.createOrUpdateUser(result.user, true);
        
        // La redirección será manejada por el componente que escucha user$
        // this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('Error en signInAsGuest:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  }

  /**
   * Obtener el usuario actual de Firebase Auth
   */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /**
   * Observable del usuario autenticado (devuelve boolean)
   */
  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(
      switchMap(user => of(!!user))
    );
  }

  /**
   * Obtener datos del usuario desde Firestore
   */
  getUserData(uid: string): Observable<User | undefined> {
    return from(this.getUserDataPromise(uid));
  }

  private async getUserDataPromise(uid: string): Promise<User | undefined> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return undefined;
    }
  }

  /**
   * Crear o actualizar documento del usuario en Firestore
   */
  private async createOrUpdateUser(firebaseUser: FirebaseUser, isGuest: boolean): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
      const userDoc = await getDoc(userDocRef);

      const userData: CreateUserDto = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isGuest: isGuest
      };

      if (!userDoc.exists()) {
        // Usuario nuevo - crear documento
        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp()
        });
      } else {
        // Usuario existente - actualizar datos (por si cambió nombre o foto)
        await setDoc(userDocRef, userData, { merge: true });
      }
    } catch (error) {
      console.error('Error creando/actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario está autenticado (promesa)
   */
  async isAuthenticatedPromise(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }
}
