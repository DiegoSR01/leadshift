# Guía de Despliegue en la Nube — LeadShift

> **Stack:** Supabase (PostgreSQL) · Render (NestJS API) · Vercel (React frontend)
>
> Tiempo estimado: 30–45 minutos la primera vez.

---

## Requisitos previos

- Cuenta en [supabase.com](https://supabase.com) (gratis)
- Cuenta en [render.com](https://render.com) (gratis)
- Cuenta en [vercel.com](https://vercel.com) (gratis)
- El repositorio subido a GitHub (ya está: `DiegoSR01/leadshift`)
- Node.js 18+ instalado localmente (solo para correr el seed)

---

## Paso 1 — Base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre (ej. `leadshift`), una contraseña segura y región (ej. `South America - São Paulo`)
3. Espera ~2 minutos a que el proyecto se inicialice
4. Ve a **Project Settings → Database**
5. Copia los siguientes valores (los necesitarás en el Paso 2):

| Variable | Dónde encontrarla |
|---|---|
| `DB_HOST` | Campo **Host** (termina en `.supabase.com`) |
| `DB_PORT` | `5432` (fijo) |
| `DB_USERNAME` | `postgres` (fijo) |
| `DB_PASSWORD` | La contraseña que pusiste al crear el proyecto |
| `DB_NAME` | `postgres` (fijo) |

6. **Permite conexiones externas**: en la misma sección, activa **"Allow external connections"** si está desactivado.

---

## Paso 2 — Poblar la base de datos (seed)

Haz esto **una sola vez** desde tu máquina local antes de desplegar.

1. Crea el archivo `backend/.env` copiando la plantilla:

```bash
# Desde la carpeta raíz del repo
copy backend\.env.example backend\.env
```

2. Edita `backend/.env` con los datos reales de Supabase:

```env
DB_HOST=xxxx.supabase.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu-contraseña-real
DB_NAME=postgres
DB_SSL=true

JWT_SECRET=una-cadena-larga-y-aleatoria-aqui
JWT_EXPIRATION=7d
PORT=3000
NODE_ENV=development
FRONTEND_ORIGINS=http://localhost:5173
```

3. Ejecuta el seed:

```bash
cd backend
npm run seed
```

Deberías ver en consola que se crearon los usuarios demo y admin.

> **Credenciales creadas:**
> - Admin: `admin@leadshift.edu` / `admin1234`
> - Demo: `demo@leadshift.edu` / `demo1234`

---

## Paso 3 — Backend en Render

### 3.1 Crear el servicio

1. Entra a [render.com](https://render.com) → **New → Web Service**
2. Conecta tu cuenta de GitHub y selecciona el repositorio `DiegoSR01/leadshift`
3. Configura el servicio:

| Campo | Valor |
|---|---|
| **Name** | `leadshift-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Plan** | Free |

### 3.2 Variables de entorno en Render

En la sección **Environment**, agrega estas variables con tus valores reales:

```
NODE_ENV          = production
PORT              = 3000
DB_HOST           = xxxx.supabase.com
DB_PORT           = 5432
DB_USERNAME       = postgres
DB_PASSWORD       = tu-contraseña-real
DB_NAME           = postgres
DB_SSL            = true
JWT_SECRET        = una-cadena-larga-y-aleatoria-aqui
JWT_EXPIRATION    = 7d
FRONTEND_ORIGINS  = (déjalo vacío por ahora, lo actualizas en el Paso 4.3)
```

4. Haz clic en **Create Web Service** y espera a que el build termine (~3 min)
5. Copia la URL pública que te da Render:
   ```
   https://leadshift-api.onrender.com
   ```

### 3.3 Verificar que el backend funciona

Abre en el navegador:
```
https://leadshift-api.onrender.com/
```
Debes ver:
```json
{ "status": "ok", "service": "leadshift-api", "timestamp": "..." }
```

---

## Paso 4 — Frontend en Vercel

### 4.1 Crear el proyecto

1. Entra a [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa el repositorio `DiegoSR01/leadshift`
3. Configura el proyecto:

| Campo | Valor |
|---|---|
| **Root Directory** | `leadshift` |
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 4.2 Variables de entorno en Vercel

En la sección **Environment Variables**, agrega:

```
VITE_API_URL = https://leadshift-api.onrender.com/api
```

> Reemplaza la URL con la tuya real de Render.

4. Haz clic en **Deploy** y espera ~2 min
5. Copia la URL pública de Vercel:
   ```
   https://leadshift-xxxx.vercel.app
   ```

### 4.3 Actualizar CORS en Render

1. Vuelve a [render.com](https://render.com) → tu servicio `leadshift-api`
2. Ve a **Environment** y actualiza:
   ```
   FRONTEND_ORIGINS = https://leadshift-xxxx.vercel.app
   ```
3. Guarda y espera a que Render reaplique los cambios (~1 min)

---

## Paso 5 — Verificación final

Abre la URL de Vercel en el navegador y prueba:

- [ ] La landing page carga correctamente
- [ ] El login funciona con `demo@leadshift.edu` / `demo1234`
- [ ] El panel de usuario muestra módulos y progreso
- [ ] El login con `admin@leadshift.edu` / `admin1234` abre el panel admin
- [ ] El panel admin muestra estadísticas y lista de usuarios

---

## Diagrama del flujo

```
Usuario (browser)
       │
       ▼
  Vercel (React)
  leadshift-xxxx.vercel.app
       │  HTTPS + VITE_API_URL
       ▼
  Render (NestJS)
  leadshift-api.onrender.com
       │  TypeORM + DB_SSL=true
       ▼
  Supabase (PostgreSQL)
  xxxx.supabase.com:5432
```

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Frontend carga pero las rutas dan 404 | `vercel.json` mal configurado | Verifica que existe `leadshift/vercel.json` con las rewrites |
| Login falla con "Network Error" | `VITE_API_URL` incorrecta o CORS bloqueando | Revisa la URL en Vercel y `FRONTEND_ORIGINS` en Render |
| Backend da error 500 al iniciar | Variables de DB incorrectas | Revisa `DB_HOST`, `DB_PASSWORD` y `DB_SSL=true` en Render |
| Render pone el servicio en sleep | Plan gratuito suspende tras inactividad | Primera petición tarda ~30s en "despertar"; es normal |
| Seed falla con SSL error | Falta `DB_SSL=true` en `.env` local | Asegúrate de que `DB_SSL=true` está en tu `.env` local |

---

## Variables de entorno — resumen completo

### `backend/.env` (local y Render)

```env
NODE_ENV=production
PORT=3000
DB_HOST=xxxx.supabase.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu-contraseña
DB_NAME=postgres
DB_SSL=true
JWT_SECRET=cadena-aleatoria-min-32-chars
JWT_EXPIRATION=7d
FRONTEND_ORIGINS=https://tu-proyecto.vercel.app
```

### `leadshift/.env` (local) / Variables en Vercel

```env
VITE_API_URL=https://leadshift-api.onrender.com/api
```
