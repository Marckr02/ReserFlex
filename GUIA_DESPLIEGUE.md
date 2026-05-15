# Guía de Despliegue - ReserFlex

## Requisitos Previos
- Cuenta en [Railway.app](https://railway.app)
- Cuenta en [Vercel.com](https://vercel.com)
- Cuenta en [GitHub.com](https://github.com)
- Proyecto Subido a GitHub

---

## Paso 1: Subir código a GitHub

```bash
cd reservflex
git init
git add .
git commit -m "Initial commit - ReserFlex"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/reservflex.git
git push -u origin main
```

---

## Paso 2: Crear Base de Datos en Railway

1. Ir a [railway.app](https://railway.app)
2. Click en **"New Project"**
3. Seleccionar **"Empty Project"**
4. Click en **"+ New"** → **"Database"** → **"PostgreSQL"**
5. Esperar a que se aprovisione
6. En la pestaña **"Variables"**, copiar la `DATABASE_URL`
   - Formato: `postgresql://usuario:password@host:5432/db`

---

## Paso 3: Desplegar Backend en Railway

1. En Railway, click en **"+ New"** → **"GitHub Repo"**
2. Seleccionar tu repositorio `reservflex`
3. **IMPORTANTE:** En **"Root Directory"** escribir: `backend`
4. En **"Variables"**, agregar:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | (la de PostgreSQL) |
| `JWT_SECRET` | Una cadena segura larga (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | `7d` |
| `GMAIL_USER` | `tuemail@gmail.com` |
| `GMAIL_PASS` | (contraseña de aplicación de Gmail) |
| `FRONTEND_URL` | `https://tu-app.vercel.app` |
| `PORT` | `3000` |

5. Click en **"Deploy"**
6. Esperar a que termine el build (puede tomar 2-3 minutos)
7. Copiar la URL del backend (ej: `https://reservflex-backend.up.railway.app`)

### Importante: Correr migraciones

Una vez desplegado, ejecutar la migración desde Railway CLI:

```bash
# Instalar CLI de Railway
npm install -g @railway/cli

# Login
railway login

# Vincular al proyecto
railway link

# Ejecutar migración
railway run npx prisma migrate deploy
```

---

## Paso 4: Desplegar Frontend en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click en **"Add New..."** → **"Project"**
3. Seleccionar tu repositorio `reservflex`
4. **IMPORTANTE:** En **"Root Directory"** seleccionar: `frontend`
5. En **"Environment Variables"**, agregar:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

6. Click en **"Deploy"**
7. Obtendrás una URL como: `https://reservflex-frontend.vercel.app`

---

## Paso 5: Actualizar URLs en Backend

**Antes de crear el Super Admin**, en Railway actualizar:
- `FRONTEND_URL` = `https://tu-app.vercel.app` (tu URL de Vercel)

---

## Paso 6: Crear Super Admin

Una vez desplegado el backend y las migraciones, ejecutar el script para crear el Super Admin:

```bash
railway run node scripts/createSuperAdmin.js
```

Credenciales iniciales:
- **Email:** `superadmin@reservflex.com`
- **Contraseña:** `Admin123!`

---

## URLs de Producción

Al final tendrás:
- **Backend:** `https://reservflex-backend.up.railway.app`
- **Frontend:** `https://reservflex-frontend.vercel.app`
- **API:** `https://reservflex-backend.up.railway.app/api`

---

## Notas Importantes

### Gmail SMTP
Para que funcione el envío de correos:
1. Ir a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos → Activar
3. Contraseñas de aplicación → Crear (seleccionar Gmail)
4. Usar esa contraseña de 16 caracteres en `GMAIL_PASS`

### Errores comunes

| Error | Solución |
|-------|----------|
| **502 Bad Gateway** | Revisar que el backend esté corriendo y la URL sea correcta |
| **CORS error** | Verificar que `FRONTEND_URL` en backend coincida con tu URL de Vercel |
| **Database connection** | Revisar que `DATABASE_URL` sea correcta |
| **Build failed** | Verificar que el Root Directory sea `backend` en Railway y `frontend` en Vercel |
| **Prisma error** | Asegúrate de ejecutar `npx prisma migrate deploy` después del deploy |

---

## Desarrollo Local

```bash
# Backend
cd backend
npm install
# Configurar .env con tu URL de Railway o localhost
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Archivo .env del backend (local)

```env
DATABASE_URL=postgresql://usuario:password@host:5432/db
JWT_SECRET=tu_secreto_muy_largo
JWT_EXPIRES_IN=7d
GMAIL_USER=tuemail@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
PORT=3000
```