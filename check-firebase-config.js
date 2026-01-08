#!/usr/bin/env node

/**
 * Script para verificar la configuración de Firebase
 * Uso: node check-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Verificando configuración de Firebase...\n');

// Leer archivos de environment
const envPath = path.join(__dirname, 'src/environments/environment.ts');
const envProdPath = path.join(__dirname, 'src/environments/environment.prod.ts');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envProdContent = fs.readFileSync(envProdPath, 'utf8');

  // Extraer URLs
  const devUrlMatch = envContent.match(/appUrl:\s*['"]([^'"]+)['"]/);
  const prodUrlMatch = envProdContent.match(/appUrl:\s*['"]([^'"]+)['"]/);

  console.log('📋 Configuración Actual:\n');
  console.log('DEVELOPMENT:');
  console.log(`  URL: ${devUrlMatch ? devUrlMatch[1] : 'No encontrada'}`);
  console.log('');
  console.log('PRODUCTION:');
  console.log(`  URL: ${prodUrlMatch ? prodUrlMatch[1] : 'No encontrada'}`);
  console.log('');

  // Extraer authDomain
  const authDomainMatch = envProdContent.match(/authDomain:\s*['"]([^'"]+)['"]/);
  const authDomain = authDomainMatch ? authDomainMatch[1] : 'No encontrado';

  console.log('🔐 Firebase Authentication:');
  console.log(`  Auth Domain: ${authDomain}`);
  console.log('');

  console.log('⚠️  DOMINIOS QUE DEBES AUTORIZAR EN FIREBASE:');
  console.log('');
  console.log('  1. localhost');
  console.log('  2. planning-poker-15f4e.web.app');
  console.log('  3. planning-poker-15f4e.firebaseapp.com');
  console.log(`  4. ${prodUrlMatch ? new URL(prodUrlMatch[1]).hostname : 'planning-poker.eugeniovaleiras.com'}`);
  console.log('');
  console.log('📝 Instrucciones:');
  console.log('  1. Ve a: https://console.firebase.google.com/');
  console.log('  2. Selecciona: planning-poker-15f4e');
  console.log('  3. Ve a: Authentication > Settings > Authorized domains');
  console.log('  4. Agrega los dominios listados arriba');
  console.log('');
  console.log('✅ Documentación completa en: FIREBASE_SETUP.md');

} catch (error) {
  console.error('❌ Error al leer archivos:', error.message);
  process.exit(1);
}
