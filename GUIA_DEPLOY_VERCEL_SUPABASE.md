# Guia de despliegue: LeadShift en Vercel + Supabase

Esta guia documenta, de forma practica, como publicar tu proyecto con esta arquitectura:

- Frontend (Vite + React): Vercel
- Backend (NestJS + TypeORM): Render o Railway
- Base de datos PostgreSQL: Supabase

## 1. Arquitectura recomendada

Para este proyecto, lo mas estable es separar frontend y backend:

- Vercel para frontend estatico.
- Render o Railway para backend Node persistente.
- Supabase para PostgreSQL administrado.

Motivo principal:

- El backend usa transcripcion con Python y archivos temporales en `backend/src/transcription/transcription.service.ts`.
- Esto no encaja bien con funciones serverless puras de Vercel para todo el backend.

## 2. Requisitos previos

- Repo subido a GitHub.
- Cuenta en Vercel.
- Cuenta en Supabase.
- Cuenta en Render o Railway.
- Variables de entorno listas para backend (DB + JWT).

## 3. Crear proyecto en Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a Database > Connection parameters.
3. Copia estos valores:
	 - Host
	 - Port
	 - Database
	 - User
	 - Password

Valores recomendados para backend:

```env
DB_HOST=tu-host-de-supabase
DB_PORT=5432
DB_USERNAME=tu-user
DB_PASSWORD=tu-password
DB_NAME=postgres
DB_SSL=true

JWT_SECRET=pon_un_valor_largo_y_seguro
JWT_EXPIRATION=7d

NODE_ENV=production
PORT=3000
```

Nota:

- `DB_SSL=true` es importante para Supabase y ya esta soportado en `backend/src/app.module.ts`.

## 4. Inicializar tablas y seed en Supabase

Tu script `backend/src/seed/seed.ts` tiene `synchronize: true`, por lo que crea tablas automaticamente.

Ejecuta una vez, apuntando a Supabase:

```bash
cd backend
npm ci
npm run seed
```

Importante:

- Este seed borra y vuelve a insertar datos demo.
- No lo ejecutes en cada deploy de produccion.

## 5. Desplegar backend en Render o Railway

### 5.1 Configuracion base

- Root directory: `backend`
- Build command:

```bash
npm ci && npm run build
```

- Start command:

```bash
npm run start:prod
```

### 5.2 Variables de entorno

Carga todas las variables del bloque del paso 3.

### 5.3 URL publica

Cuando despliegue, guarda la URL final, por ejemplo:

- `https://tu-api.onrender.com`


## 7. Desplegar frontend en Vercel

1. Importa el repo en Vercel.
2. Configura:
	 - Root Directory: `leadshift`
	 - Build Command: `npm run build`
	 - Output Directory: `dist`
3. Agrega variable de entorno en Vercel:

```env
VITE_API_URL=https://tu-api.onrender.com/api
```

4. Deploy.

## 8. Validacion post-despliegue

Checklist rapido:

- Frontend abre en dominio de Vercel.
- Registro funciona.
- Login funciona.
- Endpoints protegidos responden.
- Dashboard carga.
- Modulos cargan sin errores CORS.

Prueba de salud simple del backend:

```bash
curl https://tu-api.onrender.com/
```

Prueba de endpoint protegido:

```bash
curl https://tu-api.onrender.com/api/modules -H "Authorization: Bearer TU_TOKEN"
```

## 9. Transcripcion (Python) en produccion

Como el backend ejecuta Python (`transcribe.py`) y usa `faster-whisper`, verifica en tu host de backend:

- Python disponible.
- Dependencias de `backend/requirements.txt` instaladas.
- Permisos de escritura para carpeta temporal.

Valida endpoint:

```bash
curl https://tu-api.onrender.com/api/transcribe/status -H "Authorization: Bearer TU_TOKEN"
```

Esperado:

```json
{ "available": true }
```

## 10. Problemas comunes

### 10.1 CORS bloqueado

Revisa:

- `FRONTEND_ORIGINS` en backend.
- Dominio exacto de Vercel (sin slash final).

### 10.2 Error de DB SSL

Revisa:

- `DB_SSL=true`
- Credenciales correctas de Supabase.

### 10.3 Frontend sigue llamando localhost

Revisa:

- `VITE_API_URL` en Vercel.
- Cambio aplicado en `leadshift/app/lib/api.ts`.
- Redeploy despues de cambiar variables.

### 10.4 Transcripcion no disponible

Revisa:

- Python instalado en host del backend.
- `pip install -r requirements.txt` ejecutado en entorno del backend.
- Logs del backend para ver error exacto.

## 11. Flujo recomendado de despliegue

Orden sugerido:

1. Crear Supabase.
2. Desplegar backend (Render/Railway) con variables DB/JWT.
3. Ejecutar seed una sola vez contra Supabase.
4. Desplegar frontend en Vercel con `VITE_API_URL` al backend.
5. Validar login, modulos y dashboard.
6. Validar transcripcion.

Con esto tienes una base solida para produccion sin acoplar todo a un solo proveedor.
