# Guía de instalación y validación completa (LeadShift)

Este documento permite que cualquier integrante del equipo levante y valide el proyecto completo:
- Frontend (Vite + React)
- Backend (NestJS + TypeORM)
- Base de datos PostgreSQL
- Seed de datos
- Servicio de transcripción (Python + faster-whisper)

Está pensado para equipos en Windows, macOS o Linux.

## 1. Requisitos mínimos

Instala estas herramientas antes de iniciar:

- Git
- Node.js 20 LTS o superior
- npm 10 o superior
- PostgreSQL 14 o superior
- Python 3.10 o superior (para transcripción)
- pip (incluido normalmente con Python)

Comandos de verificación:

```bash
node -v
npm -v
python --version
pip --version
```

Para PostgreSQL:

```bash
psql --version
```

Si no tienes `psql` en PATH, puedes validar PostgreSQL desde GUI (pgAdmin) o con Docker (ver sección opcional).

## 2. Estructura esperada

Este documento asume esta estructura (carpetas hermanas):

- `leadshift-project/leadshift` -> frontend
- `leadshift-project/backend` -> backend

## 3. Configurar variables de entorno del backend

En `backend/.env` debe existir al menos esta configuración:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=leadshift

# JWT
JWT_SECRET=CHANGE_ME_leadshift_super_secret_key_2026
JWT_EXPIRATION=7d

# App
PORT=3000
NODE_ENV=development
```

Notas:
- Cambia `JWT_SECRET` por un valor seguro para entornos reales.
- Si usas otro usuario/contraseña de PostgreSQL, ajusta `DB_USERNAME` y `DB_PASSWORD`.

## 4. Crear y validar la base de datos

### Opción A: PostgreSQL local

1. Asegura que PostgreSQL esté encendido.
2. Crea la base de datos `leadshift`.

Comando sugerido:

```bash
createdb -U postgres leadshift
```

Si ya existe, no pasa nada.

3. Verifica conexión:

```bash
psql -h localhost -U postgres -p 5432 -d leadshift -c "SELECT current_database(), version();"
```

Si responde sin error, la BD está lista.

### Opción B (recomendada para estandarizar): Docker

Si el equipo prefiere una BD idéntica en todos lados:

```bash
docker run --name leadshift-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=leadshift -p 5432:5432 -d postgres:16
```

Validación:

```bash
docker ps
```

Debe aparecer el contenedor `leadshift-postgres` como `Up`.

## 5. Instalar dependencias

### Backend

```bash
cd backend
npm ci
```

### Frontend

En otra terminal:

```bash
cd leadshift
npm ci
```

## 6. Instalar dependencias de transcripción (Python)

Desde `backend`:

```bash
pip install -r requirements.txt
```

Esto instala `faster-whisper`.

## 7. Levantar backend

Desde `backend`:

```bash
npm run start:dev
```

Validaciones esperadas:
- Debe iniciar en `http://localhost:3000`
- Debe mostrar algo como: `LeadShift API running on http://localhost:3000`

Pruebas rápidas del backend:

```bash
curl http://localhost:3000/
```

Debe responder `Hello World!`.

## 8. Poblar datos iniciales (seed)

Con backend detenido o en otra terminal (manteniendo variables de entorno):

```bash
cd backend
npm run seed
```

Salida esperada:
- `Seed complete!`
- Usuario demo: `demo@leadshift.edu / demo1234`

Esto crea módulos, escenarios, ejercicios, logros y usuario demo.

## 9. Levantar frontend

Desde `leadshift`:

```bash
npm run dev
```

Validaciones esperadas:
- Vite levantado en `http://localhost:5173`
- La app carga sin pantalla en blanco ni errores de compilación

## 10. Validación integral API + autenticación + módulos

Con backend y frontend levantados, ejecutar estas pruebas API.

### 10.1 Registro de usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tester Equipo","email":"tester.equipo@mail.com","password":"Test1234!","university":"Universidad Demo","career":"Ing. Sistemas","semester":8}'
```

Si ese correo ya existe, cambia el valor de `email` y vuelve a intentar.

Si estás en PowerShell, usa este bloque:

```powershell
$body = @{
  name = "Tester Equipo"
  email = "tester.equipo@mail.com"
  password = "Test1234!"
  university = "Universidad Demo"
  career = "Ing. Sistemas"
  semester = 8
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/register" -ContentType "application/json" -Body $body
```

La respuesta debe incluir `token` y `user`.

### 10.2 Login con usuario demo

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@leadshift.edu","password":"demo1234"}'
```

Guarda el `token` para siguientes pruebas.

### 10.3 Endpoint protegido de módulos

```bash
curl http://localhost:3000/api/modules \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Debe responder una lista de módulos (liderazgo, oral, escrita, etc.).

### 10.4 Dashboard

```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Debe devolver datos de progreso del usuario.

## 11. Validar servicio de transcripción

El endpoint está protegido con JWT.

```bash
curl http://localhost:3000/api/transcribe/status \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Respuesta esperada:

```json
{ "available": true }
```

Si devuelve `false`, revisar:
- `python --version`
- `pip install -r backend/requirements.txt`
- acceso a internet para descargar modelo Whisper la primera vez

## 12. Verificación del frontend contra backend

En navegador, abrir `http://localhost:5173` y comprobar:

1. Registro de usuario funcional.
2. Login funcional (demo o usuario nuevo).
3. Carga de módulos sin errores.
4. Dashboard con datos.
5. Perfil editable.

Si aparece error de API:
- Confirmar backend vivo en `http://localhost:3000`
- Confirmar que frontend usa `http://localhost:3000/api` (actualmente está fijo en `leadshift/app/lib/api.ts`)

## 13. Pruebas automáticas (recomendadas antes de merge)

### Backend

```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend (compilación)

```bash
cd leadshift
npm run build
```

Si estos comandos pasan, se considera un estado mínimo saludable para compartir el proyecto.

## 14. Checklist de “todo arriba”

Marca cada punto como ✅ antes de dar por funcional el entorno:

- [ ] PostgreSQL corriendo en puerto 5432
- [ ] Base de datos `leadshift` creada
- [ ] `backend/.env` configurado
- [ ] `npm ci` ejecutado en backend y frontend
- [ ] `pip install -r backend/requirements.txt` ejecutado
- [ ] Backend arriba en `http://localhost:3000`
- [ ] Frontend arriba en `http://localhost:5173`
- [ ] Seed ejecutado (`npm run seed`)
- [ ] Login con demo exitoso
- [ ] Endpoints protegidos responden con token
- [ ] `GET /api/transcribe/status` responde `{ "available": true }`
- [ ] `npm run test` y `npm run test:e2e` (backend) pasan
- [ ] `npm run build` (frontend) pasa

## 15. Solución rápida de problemas comunes

1. `ECONNREFUSED 127.0.0.1:5432`
- PostgreSQL no está corriendo o credenciales incorrectas.
- Verificar `DB_*` en `.env`.

2. `password authentication failed for user postgres`
- Credenciales de `.env` no coinciden con PostgreSQL.

3. `relation "..." does not exist`
- Ejecutar `npm run seed` para crear estructura con `synchronize: true`.

4. `Unauthorized` en endpoints protegidos
- Token ausente/inválido.
- Hacer login de nuevo y usar `Authorization: Bearer <token>`.

5. `Whisper transcription is NOT available`
- Python no accesible en PATH o falta `faster-whisper`.
- Ejecutar `python --version` y `pip install -r requirements.txt`.

---

Con este flujo, cualquier miembro del equipo puede instalar, levantar y verificar integralmente frontend, backend y base de datos con criterios claros de aceptación.
