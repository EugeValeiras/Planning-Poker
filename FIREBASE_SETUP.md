# 🔥 Configuración de Firebase para Dominio Custom

## ❌ Error Actual

```
Error en signInWithGoogle: FirebaseError: Firebase: Error (auth/unauthorized-domain).
```

Este error ocurre porque Firebase Authentication no reconoce el dominio `planning-poker.eugeniovaleiras.com` como un dominio autorizado.

## ✅ Solución: Autorizar el Dominio

### Paso 1: Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **planning-poker-15f4e**

### Paso 2: Configurar Authentication

1. En el menú lateral izquierdo, haz click en **"Authentication"**
2. Haz click en la pestaña **"Settings"** (⚙️ icono de engranaje)
3. Desplázate hacia abajo hasta la sección **"Authorized domains"**

### Paso 3: Agregar el Dominio

1. Haz click en el botón **"Add domain"**
2. Ingresa: `planning-poker.eugeniovaleiras.com`
3. Haz click en **"Add"** o **"Agregar"**

### Paso 4: Verificar Dominios Autorizados

Deberías tener estos dominios en la lista:

```
✅ localhost
✅ planning-poker-15f4e.web.app
✅ planning-poker-15f4e.firebaseapp.com
✅ planning-poker.eugeniovaleiras.com  ← NUEVO
```

### Paso 5: Esperar Propagación

- Los cambios pueden tardar **1-5 minutos** en propagarse
- No es necesario redesplegar la aplicación
- Simplemente recarga la página después de unos minutos

## 🔍 Ubicación en Firebase Console

```
Firebase Console
└── 📁 planning-poker-15f4e (Proyecto)
    └── 🔐 Authentication
        └── ⚙️ Settings
            └── 🌐 Authorized domains
                ├── localhost
                ├── planning-poker-15f4e.web.app
                ├── planning-poker-15f4e.firebaseapp.com
                └── planning-poker.eugeniovaleiras.com ← AGREGAR AQUÍ
```

## 📋 Checklist de Verificación

Después de agregar el dominio, verifica:

- [ ] El dominio aparece en la lista de "Authorized domains"
- [ ] Esperaste al menos 2-3 minutos
- [ ] Recargaste la página (Ctrl + Shift + R para borrar caché)
- [ ] Intentaste login con Google nuevamente

## 🚀 Próximos Pasos

Una vez autorizado el dominio:

1. **Recarga la aplicación** en `planning-poker.eugeniovaleiras.com`
2. **Intenta login con Google** nuevamente
3. Debería funcionar sin errores ✅

## 🔒 Seguridad

Firebase solo permite logins desde dominios autorizados. Esto previene:
- ❌ Ataques de phishing
- ❌ Uso no autorizado de tus credenciales de Firebase
- ❌ Login desde dominios maliciosos

Por eso es importante **SOLO** agregar dominios que tú controlas.

## 📱 Dominios Adicionales

Si en el futuro despliegas en otros dominios, recuerda agregarlos:

```
# Ejemplos de dominios que podrías necesitar:
✅ planningpoker.com (dominio principal)
✅ app.planningpoker.com (subdominio)
✅ staging.eugeniovaleiras.com (ambiente de staging)
```

## ⚠️ Importante

- **NO** agregues dominios que no controles
- **NO** uses wildcards (*.eugeniovaleiras.com) - Firebase no los soporta
- Cada subdominio debe agregarse individualmente

## 🆘 Si Sigue sin Funcionar

1. **Verifica la consola del navegador** para ver el error exacto
2. **Limpia cookies y caché** del navegador
3. **Prueba en modo incógnito**
4. **Verifica que el dominio esté correctamente escrito** (sin http://, sin trailing slash)
5. **Espera 5-10 minutos** y prueba nuevamente

## 📞 Soporte

Si después de seguir todos estos pasos sigue sin funcionar:

1. Revisa la [Documentación de Firebase](https://firebase.google.com/docs/auth/web/google-signin)
2. Verifica que Google OAuth esté correctamente configurado
3. Revisa que las credenciales de Firebase sean correctas

---

**Última actualización**: 2024
**Proyecto**: Planning Poker
**Dominio**: planning-poker.eugeniovaleiras.com
