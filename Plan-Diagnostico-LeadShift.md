# Plan de Diagnóstico LeadShift

**Fecha:** 28 de abril de 2026  
**Stack:** React/Vite (Vercel) · NestJS/TypeORM (Render) · PostgreSQL (Supabase)  
**Versión analizada:** Código fuente local actual

---

## 1. Análisis Técnico de la Falla

### 1.1 Problema Raíz: `VITE_API_URL` no inyectada en tiempo de build

**Archivo:** `app/lib/api.ts`, línea 1

```ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Por qué es crítico:** Vite incrusta las variables de entorno con prefijo `VITE_` en el bundle de JavaScript **en tiempo de compilación (build time)**, no en tiempo de ejecución. Si la variable `VITE_API_URL` no está definida en el panel de Vercel cuando se ejecuta el build, el fallback `http://localhost:3000/api` queda **permanentemente hardcodeado** en el bundle desplegado.

**Consecuencias en producción:**
- Toda petición fetch apunta a `http://localhost:3000` → el navegador del usuario final lanza `ERR_CONNECTION_REFUSED`
- El usuario ve "Failed to fetch" o la pantalla no responde
- El backend en Render **jamás recibe ninguna solicitud**

---

### 1.2 Por qué el Frontend navega a `/app` incluso si la API falla

**Veredicto: NO ocurre en el código local actual.** El flujo es correcto:

```
LoginPage.handleSubmit
  └─ try { await login(email, password) → navigate('/app') }
  └─ catch { setError(err.message) }   ← aquí se detiene si falla
```

El `navigate('/app')` está **dentro del bloque `try`**, por lo que solo se ejecuta si `login()` resuelve con éxito. Si la API lanza un error, la ejecución va al `catch` y muestra el mensaje de error.

**Sin embargo, el bypass sí ocurre si hay un token previo en localStorage:**

```
Carga inicial → AuthContext.loadUser()
  isAuthenticated() → true  (hay token en localStorage de sesión anterior)
  await api.auth.me()  →  ERR_CONNECTION_REFUSED (URL apunta a localhost)
  catch { clearToken(); setUser(null) }
```

En este flujo, si la verificación del token falla por red, el usuario es redirigido a `/login` correctamente. **Pero si el bundle desplegado en Vercel es el ANTIGUO** (que tenía lógica de demo), ese bundle podría estar configurando `user` directamente con datos mock sin pasar por la API.

---

### 1.3 Vulnerabilidad en `routes.ts`: Ausencia de AuthGuard explícito

**Archivo:** `app/routes.ts`

```ts
{
  path: '/app',
  Component: AppLayout,   // ← No hay un AuthGuard wrapper explícito
  children: [...]
}
```

No existe ningún componente `AuthGuard`, `ProtectedRoute` o `RequireAuth`. La protección depende **únicamente** de que `AppLayout.tsx` haga el chequeo internamente:

```ts
// AppLayout.tsx
if (loading) return <div>Cargando...</div>;
if (!user)   return <Navigate to="/login" replace />;
```

Esto es funcional pero frágil porque:
1. Si `AppLayout` es modificado accidentalmente y se elimina el guard, **todas las rutas privadas quedan expuestas** sin ninguna capa de seguridad adicional.
2. El check de `loading` crea una ventana de tiempo donde `Outlet` podría renderizarse brevemente si hay un bug de estado.

**Riesgo actual:** Bajo (el guard funciona). **Riesgo de mantenimiento:** Alto.

---

### 1.4 Desincronización: Botón "Acceso Demo" visible en Vercel pero no en local

**Causa:** Vercel está sirviendo un bundle antiguo (compilado antes del commit que eliminó el botón demo). Esto ocurre por una de estas razones:

| Causa | Probabilidad |
|-------|-------------|
| Build fallido en Vercel después del commit (el deploy no se ejecutó) | Alta |
| Vercel tiene caché de build y no detectó los cambios | Media |
| La rama desplegada en Vercel no es `main` | Media |
| El navegador tiene caché del service worker / caché HTTP agresiva | Baja |

---

## 2. Matriz de Culpabilidad

### 2.1 Vercel (Frontend) — **Culpabilidad: ALTA**

| Síntoma | Causa | Evidencia en el código |
|---------|-------|----------------------|
| `ERR_CONNECTION_REFUSED` en producción | `VITE_API_URL` ausente en variables de entorno de Vercel → bundle apunta a `localhost:3000` | `api.ts` línea 1: fallback hardcodeado |
| Botón demo visible en la nube pero no en local | Build desactualizado en Vercel; se sirve bundle anterior al commit de limpieza | — |
| Login acepta cualquier credencial en producción | Si el bundle antiguo tenía lógica demo, sigue activo en Vercel | — |

**Cómo confirmarlo:** Abrir `https://leadshift.vercel.app`, F12 → Network → intentar login → si la petición va a `localhost:3000`, la variable de entorno no está configurada en Vercel.

---

### 2.2 Render (Backend) — **Culpabilidad: BAJA (no recibe tráfico)**

El backend en Render **nunca recibe peticiones** del frontend en producción porque la URL del bundle apunta a localhost. Por lo tanto, cualquier error de CORS, JWT o base de datos en Render es actualmente irrelevante hasta resolver el punto 2.1.

| Punto a verificar | Estado probable |
|-------------------|----------------|
| CORS configurado para `https://leadshift.vercel.app` | Desconocido — no verificable hasta que lleguen peticiones reales |
| Variables de entorno de Supabase en Render | Desconocido |
| Endpoint `/api/auth/login` funcionando | Funcionando en local (confirmado: servidor arrancó en puerto 3000 correctamente) |

**Cómo confirmarlo:** Revisar los logs de Render → si no hay ninguna entrada de petición POST a `/api/auth/login`, el frontend no está llegando al backend.

---

### 2.3 Supabase (Base de datos) — **Culpabilidad: INDETERMINADA**

No es posible diagnosticar Supabase hasta que el frontend esté correctamente configurado y las peticiones lleguen al backend en Render. Los síntomas actuales no son causados por la base de datos.

| Punto a verificar | Cómo verificarlo |
|------------------|-----------------|
| Variables `DATABASE_URL` / `SUPABASE_*` en Render | Panel de Render → Environment |
| Puerto 5432 accesible desde Render | Intentar registrar un usuario nuevo desde producción después de aplicar el fix del punto 3 |
| Usuario `demo@leadshift.edu` existe en la BD | Conectarse directamente a Supabase Studio y verificar la tabla `users` |

---

## 3. Pasos de Resolución

### Paso 1 (CRÍTICO) — Configurar `VITE_API_URL` en Vercel

1. Entrar al panel de Vercel → Proyecto → **Settings → Environment Variables**
2. Añadir la variable:
   ```
   VITE_API_URL = https://leadshift-api.onrender.com/api
   ```
   ⚠️ Asegurarse de que incluye `/api` al final y **sin barra diagonal al final**
3. Ir a **Deployments → Redeploy** (seleccionar el commit más reciente) para que el nuevo build tome la variable

> **¿Por qué hacer redeploy?** Vite lee las variables en build time. Añadir la variable en Vercel no actualiza el bundle ya desplegado; se necesita un nuevo build.

---

### Paso 2 — Limpiar caché de build en Vercel

En el redeploy del paso anterior, marcar la opción **"Clear Build Cache"** para asegurarse de que Vercel no reutilice artefactos del build anterior (que contenía el botón demo).

---

### Paso 3 — Configurar CORS en el backend (Render)

Una vez que el frontend apunte correctamente al backend, es probable que Render bloquee las peticiones por CORS. Verificar que las variables de entorno en Render incluyan:

```
FRONTEND_ORIGINS = https://leadshift.vercel.app
```

Si el backend usa `@nestjs/config`, revisar el `main.ts` del backend para confirmar que la configuración de CORS usa esta variable.

---

### Paso 4 — Fortalecer el AuthGuard en `routes.ts`

Para evitar que la protección de rutas dependa exclusivamente de `AppLayout`, crear un componente explícito:

**Archivo:** `app/components/RequireAuth.tsx` (nuevo archivo)

```tsx
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null; // o un spinner global
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

**Archivo:** `app/routes.ts` (modificar)

```ts
import { RequireAuth } from './components/RequireAuth';

// Cambiar el bloque /app:
{
  path: '/app',
  Component: RequireAuth,   // ← Guard explícito
  children: [
    { path: '', Component: AppLayout, children: [...rutas internas...] }
  ],
}
```

Esto garantiza que **ninguna ruta hija de `/app` se renderice nunca** si el usuario no está autenticado, independientemente de lo que ocurra dentro de `AppLayout`.

---

### Paso 5 — Verificar usuario demo en Supabase

Después de aplicar los pasos 1–3, intentar el login con `demo@leadshift.edu`:
- Si responde `401 Unauthorized`: las credenciales no coinciden con lo que está en la BD → ejecutar el seed del backend: `npm run seed`
- Si responde `500 Internal Server Error`: revisar los logs de Render para ver si hay error de conexión a Supabase

---

## 4. Resumen de Prioridades

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| 🔴 P1 | Añadir `VITE_API_URL` en Vercel + Redeploy con cache limpia | Resuelve todos los errores de conexión |
| 🔴 P1 | Verificar/configurar CORS en Render (`FRONTEND_ORIGINS`) | Sin esto, el P1 sigue fallando por CORS |
| 🟡 P2 | Verificar usuario `demo@leadshift.edu` en Supabase | Resuelve el problema de credenciales |
| 🟢 P3 | Implementar `RequireAuth` como AuthGuard explícito | Mejora la seguridad y mantenibilidad |

---

## 5. Diagrama de Flujo del Problema

```
Usuario en producción → login()
        │
        ▼
api.ts: fetch('http://localhost:3000/api/auth/login')  ← URL INCORRECTA
        │
        ▼
   ERR_CONNECTION_REFUSED
        │
        ▼
LoginPage.catch → setError("Failed to fetch")
        │
        ▼
   Usuario ve error en pantalla ✓ (no hay bypass real en el código local)
   
PERO en el bundle ANTIGUO de Vercel:
        │
        ▼
   Botón "Acceso Demo" → setUser(mockData) → navigate('/app')  ← BYPASS
```

**Conclusión final:** El bypass no existe en el código local actual. El problema en producción es una combinación de (a) bundle desactualizado en Vercel con lógica demo y (b) `VITE_API_URL` no configurada. Resolviendo el Paso 1 y 2, ambos problemas desaparecen en el mismo redeploy.
