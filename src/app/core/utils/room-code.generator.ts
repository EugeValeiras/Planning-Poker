/**
 * Genera un código aleatorio de 6 caracteres alfanuméricos (A-Z, 0-9)
 * Ejemplo: ABC123, XY9K2L
 */
export function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Valida que un código tenga el formato correcto
 */
export function isValidRoomCode(code: string): boolean {
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code);
}
