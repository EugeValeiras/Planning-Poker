# Planning Poker 🃏

Una aplicación web de Planning Poker en tiempo real construida con Angular 18, Firebase y PrimeNG.

## 🚀 Características

- ✅ Autenticación con Google y modo invitado
- ✅ Salas de votación en tiempo real
- ✅ Presencia de usuarios (online/offline)
- ✅ Sonidos de retroalimentación
- ✅ Sistema de temas (Dark/Light)
- ✅ 6 esquemas de color personalizables
- ✅ Métricas de votación automáticas
- ✅ Gestión de participantes
- ✅ Responsive design

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)
- Angular CLI (v18.2.21)
- Cuenta de Firebase

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd planning-poker
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar Firebase:
   - Copiar `.env.example` y renombrar a `.env`
   - Completar con las credenciales de tu proyecto Firebase
   - Actualizar `src/environments/environment.ts` y `environment.prod.ts`

## 🎯 Scripts Disponibles

### Desarrollo

```bash
# Servidor de desarrollo (http://localhost:4200)
npm start

# Watch mode (reconstruye automáticamente)
npm run watch
```

### Build

```bash
# Build de desarrollo
npm run build

# Build de producción (usa environment.prod.ts)
npm run build:prod
```

**Diferencias entre builds:**

| Aspecto | Development | Production |
|---------|------------|------------|
| Environment | `environment.ts` | `environment.prod.ts` |
| Optimización | ❌ No | ✅ Sí |
| Source Maps | ✅ Sí | ❌ No |
| Output Hashing | ❌ No | ✅ Sí |
| App URL | `localhost:4200` | `planning-poker-15f4e.web.app` |

### Testing

```bash
# Ejecutar tests unitarios
npm test
```

## 🌍 Configuración de Entornos

### Development (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  firebase: { /* ... */ },
  appUrl: 'http://localhost:4200'
};
```

### Production (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  firebase: { /* ... */ },
  appUrl: 'https://planning-poker-15f4e.web.app'
};
```

## 🎨 Personalización

### Temas
La aplicación soporta:
- 🌙 Modo Oscuro
- ☀️ Modo Claro

### Colores
- 🔵 Azul (default)
- 🟣 Púrpura
- 🟢 Verde
- 🔴 Rojo
- 🟠 Naranja
- 🩷 Rosa

Las preferencias se guardan en `localStorage`.

## 📦 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                 # Servicios core
│   │   ├── guards/          # Route guards
│   │   └── services/        # Auth, Room, Theme, etc.
│   ├── features/            # Módulos de características
│   │   ├── auth/           # Login
│   │   ├── dashboard/      # Dashboard principal
│   │   └── room/           # Sala de votación
│   ├── shared/             # Componentes compartidos
│   │   └── components/     # Header, etc.
│   └── models/             # Interfaces y tipos
├── environments/           # Configuración de entornos
├── assets/                # Imágenes, logos
└── styles.scss           # Estilos globales
```

## 🔥 Firebase

### Servicios Utilizados
- **Authentication**: Google OAuth y Anonymous
- **Firestore**: Base de datos en tiempo real
- **Hosting**: Despliegue de la aplicación

### Estructura de Firestore
```
rooms/
  {roomId}/
    - name, roomCode, votingScale, etc.
    participants/
      {userId}/
        - displayName, role, isOnline, etc.
    stories/
      {storyId}/
        - statistics, estimateConsensus, etc.
        votes/
          {userId}/
            - value, userName, votedAt
```

## 🚀 Despliegue

### Firebase Hosting

1. Construir para producción:
```bash
npm run build:prod
```

2. Desplegar:
```bash
firebase deploy
```

## 🔧 Tecnologías

- **Framework**: Angular 18
- **UI Library**: PrimeNG 17
- **Backend**: Firebase (Auth + Firestore)
- **Estilos**: SCSS + PrimeNG Themes
- **Language**: TypeScript 5.5

## 📱 Soporte de Navegadores

- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)

## 🐛 Problemas Conocidos

- Las reglas de Firestore están en modo permisivo (desarrollo)
- Budget warnings en el build (no críticos)
- Toast notifications usan `alert()` temporalmente

## 📄 Licencia

Este proyecto es privado y no tiene licencia pública.

## 👥 Autor

Eugenio Valeiras

---

**Planning Poker** - Haz tus estimaciones ágiles más eficientes 🎯
