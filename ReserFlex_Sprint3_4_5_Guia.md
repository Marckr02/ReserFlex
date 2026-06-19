# ReserFlex — Guía de Desarrollo Sprint 3, 4 y 5

> **Documento de contexto para IA generativa y equipo de desarrollo**
> Proyecto: ReserFlex | Equipo: Nuvix Inc — Grupo 4
> Integrantes: Rubén Cuenca · Jeremy Jiménez · Marco Ríos
> Curso: GR2SW — Calidad de Software | EPN 2026-A
> Docente: Ph.D. Cindy Pamela López Chulca

---

## CONTEXTO COMPLETO DEL PROYECTO

### ¿Qué es ReserFlex?

ReserFlex es una aplicación web **multi-tenant** de gestión de reservas adaptable a distintos tipos de negocios (salones, consultorios, restaurantes, hoteles, canchas, gimnasios). Permite que múltiples negocios operen en una misma instancia con datos completamente aislados. Cada negocio tiene su propia URL pública (`/reservas/:slug`) desde donde los clientes pueden reservar.

### Stack tecnológico (NO cambiar)

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Node.js + Express | 20 + 4 |
| ORM | Prisma | 5 |
| Base de datos | PostgreSQL | 16 |
| Frontend | React + Vite | 18 + latest |
| Estilos | Tailwind CSS | 3 |
| Auth | JWT + bcrypt | — |
| Correo | Brevo API HTTP nativo | — |
| Deploy backend | Railway | — |
| Deploy frontend | Vercel | — |
| Control de versiones | GitHub + Azure DevOps | — |

### URLs de producción

```
Frontend:  https://[proyecto].vercel.app
Backend:   https://reserflex-production.up.railway.app
API base:  https://reserflex-production.up.railway.app/api
Health:    https://reserflex-production.up.railway.app/api/health
```

---

## ESTADO DEL PROYECTO — LO QUE YA EXISTE

### Sprint 1 ✅ COMPLETADO (13 pts)

**HU1 — Login y Registro**
- Registro con verificación de correo (Brevo API)
- Login con JWT que incluye: `id`, `role`, `email`, `businessId`, `name`
- Indicadores de fortaleza de contraseña en el frontend
- Redirección por rol: SUPER_ADMIN→`/admin/negocios`, ADMIN_NEGOCIO→`/admin/dashboard`, EMPLEADO→`/admin/empleado`, CLIENTE→`/`
- Super Admin puede iniciar sesión sin verificar correo (excepción explícita)
- Middleware de autenticación: `authenticate` y `authorize(...roles)`

**HU3 — Registrar Negocios**
- 6 tipos: `SALON_BARBERIA`, `CONSULTORIO`, `RESTAURANTE`, `HOTEL`, `CANCHA_GIMNASIO`, `GENERICO`
- Al crear negocio se genera Admin automáticamente con contraseña temporal
- Credenciales enviadas por correo vía Brevo
- Solo `SUPER_ADMIN` puede crear negocios

**HU18 — URL Única**
- Slug generado desde el nombre: normalizar → minúsculas → guiones
- Campo `slug` con `@@unique` en Prisma
- Endpoint público: `GET /api/business/slug/:slug` (filtra `active: true`)
- Ruta frontend: `/reservas/:slug` → `BusinessPortal.jsx`

### Sprint 2 ✅ COMPLETADO (47 pts)

**HU2 — Recuperación de contraseña**
- `POST /api/auth/forgot-password` → genera token 60 min
- `POST /api/auth/reset-password` → valida token y actualiza contraseña
- `PATCH /api/auth/change-password` → cambio desde perfil (requiere auth)
- Páginas: `ForgotPassword.jsx`, `ResetPassword.jsx`, `Profile.jsx`

**HU4 — Horarios**
- Modelo `Schedule` (businessId, dayOfWeek 0-6, startTime "HH:mm", endTime, isActive)
- `GET /api/schedules/:businessId` — público
- `PUT /api/schedules/:businessId` — upsert batch (ADMIN)

**HU5 — Empleados y servicios**
- Modelo `EmployeeService` (many-to-many)
- `GET/POST /api/employees/:businessId`
- `PUT /api/employees/:employeeId/services` — reemplaza asignaciones

**HU6 — Catálogo de servicios**
- Modelo `Service` (name, description, price: Float, duration: Int minutos, active: Boolean)
- CRUD completo con soft delete (`active: false`)
- `GET /api/services/:businessId` público con empleados incluidos

**HU7 — Reservar servicio**
- `GET /api/reservations/slots?businessId&serviceId&employeeId&date`
- Generación de slots basada en horario del día y duración del servicio
- `POST /api/reservations` — requiere auth, valida disponibilidad, envía correo confirmación

**HU8 — Reservar sin cuenta**
- `POST /api/reservations/guest` — sin auth
- Campos extra en Reservation: `guestName`, `guestEmail`, `guestPhone`, `accessCode` (6 dígitos)

**HU9 — Cancelar/Reprogramar**
- `PATCH /api/reservations/:id/cancel` — política 2h antes
- `PATCH /api/reservations/:id/reschedule` — política 2h antes

**HU10 — Historial**
- `GET /api/reservations/my` — filtros por status y businessId

**HU11 — Agenda empleado**
- `GET /api/reservations/employee?date=` — filtrado por fecha

**HU12 — Gestión admin**
- `GET /api/reservations/business/:businessId?date&status`
- `PATCH /api/reservations/:id/status` — cambio de estado (ADMIN)
- Búsqueda de clientes para reserva manual

**HU13 — Métricas**
- `GET /api/reservations/metrics/:businessId`
- Retorna: today, week, month, cancellationRate, byEmployee
- Gráfico de barras con recharts en `Metricas.jsx`

**HU14 — Confirmación por correo**
- `sendConfirmationEmail(to, reservation, accessCode?)` en `mail.service.js`

**HU17 — Toggle negocio**
- `PATCH /api/business/:id/toggle` — activa/desactiva (SUPER_ADMIN)

### Mejoras adicionales implementadas en Sprint 2

- **AdminNav.jsx** — navbar compartida con link activo (useLocation), link a Perfil
- **Profile.jsx** — cambio de contraseña con validación de clave actual
- **Fecha mínima en Reservar** — `min={new Date().toISOString().split('T')[0]}`
- **Página 404** — catch-all para rutas inexistentes
- **Modal de creación manual de reserva** en ReservasAdmin con búsqueda de clientes
- **Toggle activo/inactivo** en Dashboard de Super Admin
- **businessId en JWT** — incluido en el payload del token

---

## ESTRUCTURA DE ARCHIVOS ACTUAL

```
ReserFlex/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              ← modelos actuales
│   │   └── migrations/               ← historial de migraciones
│   ├── src/
│   │   ├── index.js                   ← servidor Express, rutas registradas
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     ← register, verifyEmail, login,
│   │   │   │                            forgotPassword, resetPassword,
│   │   │   │                            changePassword
│   │   │   ├── business.controller.js ← createBusiness, getAllBusinesses,
│   │   │   │                            getBusinessBySlug, toggleBusiness
│   │   │   ├── schedule.controller.js ← getSchedules, upsertSchedules
│   │   │   ├── service.controller.js  ← getServices, createService,
│   │   │   │                            updateService, deleteService
│   │   │   ├── employee.controller.js ← getEmployees, createEmployee,
│   │   │   │                            assignServices
│   │   │   └── reservation.controller.js ← getSlots, createReservation,
│   │   │                                   createGuestReservation,
│   │   │                                   getMyReservations,
│   │   │                                   getEmployeeReservations,
│   │   │                                   getBusinessReservations,
│   │   │                                   cancelReservation,
│   │   │                                   rescheduleReservation,
│   │   │                                   updateReservationStatus,
│   │   │                                   getMetrics
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js     ← authenticate, authorize(...roles)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── schedule.routes.js
│   │   │   ├── service.routes.js
│   │   │   ├── employee.routes.js
│   │   │   └── reservation.routes.js
│   │   └── services/
│   │       └── mail.service.js        ← sendVerificationEmail,
│   │                                    sendCredentialsEmail,
│   │                                    sendResetEmail,
│   │                                    sendConfirmationEmail
│   ├── .env                           ← variables de entorno locales
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                    ← router principal con PrivateRoute
    │   ├── context/
    │   │   └── AuthContext.jsx        ← user, login, logout, businessId
    │   ├── services/
    │   │   └── api.js                 ← axios con JWT automático
    │   ├── components/
    │   │   └── AdminNav.jsx           ← navbar admin con link activo
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── ForgotPassword.jsx
    │       ├── ResetPassword.jsx
    │       ├── VerifyEmail.jsx
    │       ├── Profile.jsx
    │       ├── Dashboard.jsx          ← Super Admin y Admin Negocio
    │       ├── BusinessPortal.jsx     ← portal público /reservas/:slug
    │       ├── NotFound.jsx           ← página 404
    │       ├── admin/
    │       │   ├── Horarios.jsx
    │       │   ├── Servicios.jsx
    │       │   ├── Empleados.jsx
    │       │   ├── ReservasAdmin.jsx
    │       │   └── Metricas.jsx
    │       ├── cliente/
    │       │   ├── Catalogo.jsx
    │       │   ├── Reservar.jsx
    │       │   └── MisReservas.jsx
    │       └── empleado/
    │           └── Agenda.jsx
    └── package.json
```

---

## SCHEMA PRISMA ACTUAL (Sprint 1 + 2)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ADMIN_NEGOCIO
  EMPLEADO
  CLIENTE
}

enum BusinessType {
  SALON_BARBERIA
  CONSULTORIO
  RESTAURANTE
  HOTEL
  CANCHA_GIMNASIO
  GENERICO
}

enum ReservationStatus {
  PENDIENTE
  COMPLETADA
  CANCELADA
  NO_SE_PRESENTO
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  password     String
  role         Role      @default(CLIENTE)
  verified     Boolean   @default(false)
  verifyToken  String?
  resetToken   String?
  resetExpires DateTime?
  createdAt    DateTime  @default(now())

  business             Business?         @relation("AdminBusiness", fields: [businessId], references: [id])
  businessId           String?
  employeeServices     EmployeeService[]
  reservations         Reservation[]     @relation("ClientReservations")
  employeeReservations Reservation[]     @relation("EmployeeReservations")
}

model Business {
  id        String       @id @default(uuid())
  name      String
  slug      String       @unique
  type      BusinessType
  address   String
  logoUrl   String?
  active    Boolean      @default(true)
  createdAt DateTime     @default(now())

  admin        User[]        @relation("AdminBusiness")
  schedules    Schedule[]
  services     Service[]
  reservations Reservation[]
}

model Schedule {
  id         String   @id @default(uuid())
  businessId String
  dayOfWeek  Int
  startTime  String
  endTime    String
  isActive   Boolean  @default(true)

  business   Business @relation(fields: [businessId], references: [id])

  @@unique([businessId, dayOfWeek])
}

model Service {
  id          String   @id @default(uuid())
  businessId  String
  name        String
  description String?
  price       Float
  duration    Int
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  business         Business          @relation(fields: [businessId], references: [id])
  employeeServices EmployeeService[]
  reservations     Reservation[]
}

model EmployeeService {
  id         String  @id @default(uuid())
  employeeId String
  serviceId  String

  employee   User    @relation(fields: [employeeId], references: [id])
  service    Service @relation(fields: [serviceId], references: [id])

  @@unique([employeeId, serviceId])
}

model Reservation {
  id         String            @id @default(uuid())
  businessId String
  serviceId  String
  clientId   String?
  employeeId String?
  status     ReservationStatus @default(PENDIENTE)
  startTime  DateTime
  endTime    DateTime
  notes      String?
  guestName  String?
  guestEmail String?
  guestPhone String?
  accessCode String?
  createdAt  DateTime          @default(now())

  business Business @relation(fields: [businessId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])
  client   User?    @relation("ClientReservations", fields: [clientId], references: [id])
  employee User?    @relation("EmployeeReservations", fields: [employeeId], references: [id])
}
```

---

## VARIABLES DE ENTORNO

### Backend `.env`
```env
DATABASE_URL="postgresql://usuario:password@host:5432/reservflex"
JWT_SECRET="secreto_largo_y_seguro"
JWT_EXPIRES_IN="7d"
BREVO_API_KEY="xkeysib-..."
FRONTEND_URL="https://tu-app.vercel.app"
PORT=8080
```

### Frontend `.env`
```env
VITE_API_URL="https://reserflex-production.up.railway.app/api"
```

---

## VERSIONAMIENTO Y AZURE DEVOPS

### Ramas Git
```
main      ← producción (Railway/Vercel autodeploy)
develop   ← integración de features
feature/HU19-responsive
feature/HU21-slug-preview
feature/HU22-filtros-catalogo
feature/HU31-mesas-restaurante
```

### Convención de commits
```
feat(HU19): descripción
fix(HU22): descripción
style(HU19): descripción
refactor(HU31): descripción
test(HU22): descripción
```

### Fechas de sprints en Azure DevOps
```
Sprint 3: 16 jun 2026 → 27 jun 2026  (revisión pares: 3 jul 2026)
Sprint 4: 30 jun 2026 → 11 jul 2026  (revisión: por confirmar)
Sprint 5: 14 jul 2026 → 25 jul 2026  (revisión: por confirmar)
```

---

---

# SPRINT 3 — UX, RESPONSIVE Y PORTAL DE RESTAURANTE

**Período:** 16 junio – 27 junio 2026 (2 semanas laborables)
**Revisión de pares:** 3 julio 2026
**Puntos:** 18 pts
**Rama base:** `develop`

## HUs del Sprint 3

| HU | Descripción | Pts | Responsable sugerido |
|---|---|---|---|
| HU19 | Diseño responsive completo | 5 | Persona C (Frontend) |
| HU21 | Preview URL única al registrar negocio | 2 | Persona A (Backend + Frontend) |
| HU22 | Búsqueda y filtros en portal público | 5 | Persona C (Frontend) |
| HU31 | Portal visual de mesas para restaurantes | 6 | Persona A + B (Full Stack) |

---

## HU19 — DISEÑO RESPONSIVE COMPLETO (5 pts)

### Historia
Como usuario del sistema, quiero que la interfaz se adapte correctamente a
dispositivos móviles y tablets, para poder usar ReserFlex desde cualquier
dispositivo sin distorsiones.

### Criterios de aceptación

**HU19-CA1:** Dado que el usuario abre `/login` en móvil, cuando la pantalla
es menor a 640px, entonces el formulario ocupa el ancho completo sin
desbordamientos ni scroll horizontal.

**HU19-CA2:** Dado que el cliente accede al portal `/reservas/:slug` desde
móvil, cuando navega por el catálogo y selecciona un slot, entonces todos los
elementos son táctiles (mínimo 44px) y legibles.

**HU19-CA3:** Dado que el admin accede al panel desde tablet (768px), cuando
visualiza ReservasAdmin y Metricas, entonces los elementos se reorganizan en
columnas adaptativas sin pérdida de información.

**HU19-CA4:** Dado que el empleado revisa su agenda desde móvil, cuando carga
la vista de citas, entonces las tarjetas son legibles y los botones tienen
tamaño mínimo táctil de 44px.

### Subtareas y código

**HU19-T1: Auditar Login.jsx y Register.jsx**

Problema reportado por el grupo revisor: distorsiones severas en móvil.
Calificación ISO 25010 Adaptabilidad: 3/5.

Cambios necesarios en `Login.jsx`:
```jsx
// ANTES — contenedor sin adaptación móvil
<div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">

// DESPUÉS — padding lateral en móvil, centrado en desktop
<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-0">
  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-md">
```

Cambios en inputs para móvil:
```jsx
// Agregar text-base para evitar zoom automático en iOS (< 16px hace zoom)
<input
  type="email"
  className="w-full border rounded-lg px-3 py-2 text-base sm:text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**HU19-T2: Responsive BusinessPortal.jsx**

```jsx
// Galería de fotos — de 3 columnas a 1 en móvil
<div className="grid grid-cols-1 sm:grid-cols-3 gap-1 h-auto sm:h-40">

// Tabs — scroll horizontal en móvil
<div className="flex border-b overflow-x-auto scrollbar-hide px-4">
  <div className="tab whitespace-nowrap">Reservar</div>

// Catálogo — 1 columna en móvil, 2 en tablet
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

**HU19-T3: Responsive ReservasAdmin.jsx y Metricas.jsx**

```jsx
// Tabla de reservas → tarjetas en móvil
<div className="hidden sm:block"> {/* tabla desktop */}
  <table>...</table>
</div>
<div className="block sm:hidden space-y-3"> {/* tarjetas móvil */}
  {reservations.map(r => (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="font-semibold">{r.client?.name}</p>
      <p className="text-sm text-gray-500">{r.service?.name}</p>
      ...
    </div>
  ))}
</div>

// Grid de métricas — 2 columnas en móvil, 4 en desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

**HU19-T4: Responsive AdminNav.jsx**

```jsx
// Navbar — menú hamburguesa en móvil
const [menuOpen, setMenuOpen] = useState(false);

// Mobile: botón hamburguesa
<button className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
  ☰
</button>

// Links — ocultos en móvil, visibles en sm+
<div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row
                 absolute sm:static top-14 left-0 w-full sm:w-auto
                 bg-white sm:bg-transparent shadow sm:shadow-none z-50`}>
  {links.map(l => <Link key={l.to} to={l.to}>...</Link>)}
</div>
```

**HU19-T5: Testing breakpoints**

Probar en Chrome DevTools (F12 → icono de móvil) con estos dispositivos:
- iPhone SE: 375×667px
- iPhone 14: 390×844px
- iPad: 768×1024px
- Desktop: 1280×800px

### Casos de prueba

| ID | Caso | Prioridad | Estimate |
|---|---|---|---|
| C77 | Login sin desbordamiento en 375px | High | 300s |
| C78 | Register sin scroll horizontal en móvil | High | 300s |
| C79 | Portal de reserva táctil en móvil (botones ≥44px) | High | 300s |
| C80 | Panel admin legible en 768px sin pérdida de info | High | 300s |
| C81 | Agenda empleado con tarjetas legibles en móvil | Medium | 300s |
| C82 | Métricas y gráficas adaptadas en pantalla pequeña | Medium | 300s |

---

## HU21 — PREVIEW DE URL ÚNICA AL REGISTRAR NEGOCIO (2 pts)

### Historia
Como Super Admin, quiero ver en tiempo real cómo quedará la URL del negocio
mientras escribo el nombre, para confirmar el slug antes de crearlo.

### Criterios de aceptación

**HU21-CA1:** Dado que el Super Admin escribe el nombre del negocio, cuando el
campo pierde el foco, entonces se muestra debajo el preview:
`"Tu URL: /reservas/salon-el-rey"`.

**HU21-CA2:** Dado que el slug generado ya existe en el sistema, cuando el
sistema lo detecta, entonces muestra advertencia en rojo indicando que el
nombre ya está en uso.

### Subtareas y código

**HU21-T1: Agregar endpoint de verificación de slug (backend)**

Agregar en `business.controller.js`:
```js
// GET /api/business/check-slug?name=Salon El Rey
const checkSlug = async (req, res) => {
  try {
    const { name } = req.query;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const exists = await prisma.business.findUnique({ where: { slug } });
    res.json({ slug, available: !exists });
  } catch (err) {
    res.status(500).json({ message: 'Error al verificar slug' });
  }
};
```

Agregar en `business.routes.js`:
```js
router.get('/check-slug', checkSlug); // público, sin auth
```

**HU21-T2: Preview en el formulario de creación de negocio (frontend)**

En el modal/formulario de creación en `Dashboard.jsx`:
```jsx
const [slugPreview, setSlugPreview] = useState('');
const [slugAvailable, setSlugAvailable] = useState(null);

const generateSlug = (name) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').trim();

const handleNameBlur = async (e) => {
  const name = e.target.value.trim();
  if (!name) return;
  const slug = generateSlug(name);
  setSlugPreview(slug);
  try {
    const { data } = await api.get(`/business/check-slug?name=${encodeURIComponent(name)}`);
    setSlugAvailable(data.available);
  } catch {
    setSlugAvailable(null);
  }
};

// En el JSX del formulario, debajo del input de nombre:
<input
  type="text"
  placeholder="Nombre del negocio"
  onBlur={handleNameBlur}
  className="w-full border rounded-lg px-3 py-2"
/>
{slugPreview && (
  <div className={`text-xs mt-1 flex items-center gap-1
    ${slugAvailable === true ? 'text-green-600' :
      slugAvailable === false ? 'text-red-500' : 'text-gray-500'}`}>
    <span>URL: /reservas/{slugPreview}</span>
    {slugAvailable === true && <span>✓ Disponible</span>}
    {slugAvailable === false && <span>✗ Ya está en uso</span>}
  </div>
)}
```

### Casos de prueba

| ID | Caso | Prioridad | Estimate |
|---|---|---|---|
| C83 | Preview aparece al salir del campo nombre | Medium | 300s |
| C84 | Nombre con acentos genera slug normalizado | Medium | 300s |
| C85 | Slug duplicado muestra advertencia en rojo | High | 300s |

---

## HU22 — BÚSQUEDA Y FILTROS EN EL PORTAL PÚBLICO (5 pts)

### Historia
Como cliente que visita el portal de un negocio, quiero poder buscar y filtrar
los servicios disponibles, para encontrar rápidamente lo que necesito.

### Criterios de aceptación

**HU22-CA1:** Dado que el cliente escribe en el buscador, cuando escribe
cualquier texto, entonces el listado se filtra en tiempo real mostrando solo
los servicios cuyo nombre o descripción coinciden (sin llamadas al servidor).

**HU22-CA2:** Dado que el cliente aplica un filtro de precio, cuando selecciona
un rango, entonces solo se muestran servicios dentro de ese rango.

**HU22-CA3:** Dado que el cliente filtra por duración, cuando selecciona
"menos de 30 min", entonces solo aparecen servicios con duración ≤ 30 minutos.

**HU22-CA4:** Dado que no hay servicios que coincidan con el filtro, cuando el
catálogo está vacío, entonces muestra `"No se encontraron servicios con estos
filtros"` con botón de limpiar filtros.

### Subtareas y código

**HU22-T1 a T4: Todo en el frontend (sin cambios en backend)**

Reemplazar el contenido de `Catalogo.jsx` o la sección de catálogo en
`BusinessPortal.jsx`:

```jsx
import { useState, useMemo } from 'react';

// Estados de filtro
const [search, setSearch] = useState('');
const [priceRange, setPriceRange] = useState('all');
const [durationFilter, setDurationFilter] = useState('all');

// Filtrado sin llamadas al servidor (useMemo para performance)
const filtered = useMemo(() => {
  return services.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase());

    const matchPrice =
      priceRange === 'all' ? true :
      priceRange === '0-20' ? s.price <= 20 :
      priceRange === '20-50' ? s.price > 20 && s.price <= 50 :
      priceRange === '50+' ? s.price > 50 : true;

    const matchDuration =
      durationFilter === 'all' ? true :
      durationFilter === 'short' ? s.duration <= 30 :
      durationFilter === 'medium' ? s.duration > 30 && s.duration <= 60 :
      durationFilter === 'long' ? s.duration > 60 : true;

    return matchSearch && matchPrice && matchDuration;
  });
}, [services, search, priceRange, durationFilter]);

const clearFilters = () => {
  setSearch('');
  setPriceRange('all');
  setDurationFilter('all');
};

// JSX de filtros
return (
  <div>
    {/* Barra de búsqueda */}
    <input
      type="text"
      placeholder="Buscar servicio..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
    />

    {/* Filtros */}
    <div className="flex gap-2 flex-wrap mb-4">
      <select value={priceRange} onChange={e => setPriceRange(e.target.value)}
        className="text-sm border rounded-lg px-2 py-1">
        <option value="all">Cualquier precio</option>
        <option value="0-20">Hasta $20</option>
        <option value="20-50">$20 – $50</option>
        <option value="50+">Más de $50</option>
      </select>

      <select value={durationFilter} onChange={e => setDurationFilter(e.target.value)}
        className="text-sm border rounded-lg px-2 py-1">
        <option value="all">Cualquier duración</option>
        <option value="short">Menos de 30 min</option>
        <option value="medium">30 – 60 min</option>
        <option value="long">Más de 60 min</option>
      </select>

      {(search || priceRange !== 'all' || durationFilter !== 'all') && (
        <button onClick={clearFilters}
          className="text-sm text-blue-600 hover:underline">
          Limpiar filtros
        </button>
      )}
    </div>

    {/* Resultados */}
    {filtered.length === 0 ? (
      <div className="text-center py-8 text-gray-400">
        <p className="mb-2">No se encontraron servicios con estos filtros</p>
        <button onClick={clearFilters}
          className="text-blue-600 text-sm hover:underline">
          Ver todos los servicios
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow p-4
                                           border border-gray-100">
            <h3 className="font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.description}</p>
            <div className="flex justify-between mt-2">
              <span className="text-blue-700 font-medium">${service.price}</span>
              <span className="text-sm text-gray-400">{service.duration} min</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
```

### Casos de prueba

| ID | Caso | Prioridad | Estimate |
|---|---|---|---|
| C86 | Búsqueda filtra por nombre en tiempo real | High | 300s |
| C87 | Búsqueda filtra por descripción | Medium | 300s |
| C88 | Filtro de precio muestra solo servicios en rango | High | 300s |
| C89 | Filtro de duración muestra servicios correctos | High | 300s |
| C90 | Estado vacío con mensaje y botón limpiar | Medium | 300s |
| C91 | Limpiar filtros restaura el catálogo completo | Medium | 300s |

---

## HU31 — PORTAL VISUAL DE MESAS PARA RESTAURANTES (6 pts)

### Historia
Como cliente de un restaurante, quiero ver el plano visual de las mesas y su
disponibilidad en tiempo real, para elegir mi mesa y reservar directamente.

### Criterios de aceptación

**HU31-CA1:** Dado que el cliente accede al portal de un negocio tipo
`RESTAURANTE`, cuando carga la sección de reservas, entonces ve un plano visual
con las mesas coloreadas: verde = disponible, rojo = ocupada, amarillo = pronto
libre.

**HU31-CA2:** Dado que el cliente hace clic en una mesa disponible, cuando se
abre el modal, entonces puede seleccionar fecha, hora, número de personas y
ocasión especial, y confirmar la reserva.

**HU31-CA3:** Dado que una mesa está ocupada, cuando el cliente hace clic en
ella, entonces el sistema muestra `"Esta mesa está ocupada, elige otra"`.

**HU31-CA4:** Dado que el cliente visita el portal del restaurante, cuando
carga la página, entonces ve una galería con fotos del local, platos y ambiente.

**HU31-CA5:** Dado que el Admin accede a la configuración, cuando edita el
plano, entonces puede agregar, mover y eliminar mesas, asignar capacidad y
subir fotos del local.

### Subtareas y código

**HU31-T1: Nuevos modelos en `schema.prisma`**

Agregar al schema existente:

```prisma
model RestaurantTable {
  id         String  @id @default(uuid())
  businessId String
  number     Int
  capacity   Int
  posX       Float   @default(0)   // posición % en el plano (0-100)
  posY       Float   @default(0)   // posición % en el plano (0-100)
  shape      String  @default("round")  // "round" | "square" | "rectangle"
  active     Boolean @default(true)

  business          Business           @relation(fields: [businessId], references: [id])
  tableReservations TableReservation[]

  @@unique([businessId, number])
}

model TableReservation {
  id         String            @id @default(uuid())
  tableId    String
  businessId String
  date       String            // "2026-06-20"
  time       String            // "20:00"
  guests     Int
  occasion   String?
  status     ReservationStatus @default(PENDIENTE)
  clientId   String?
  guestName  String?
  guestEmail String?
  guestPhone String?
  accessCode String?
  createdAt  DateTime          @default(now())

  table      RestaurantTable @relation(fields: [tableId], references: [id])
}

model BusinessPhoto {
  id         String   @id @default(uuid())
  businessId String
  url        String
  caption    String?
  order      Int      @default(0)
  createdAt  DateTime @default(now())

  business   Business @relation(fields: [businessId], references: [id])
}
```

Agregar relaciones en el modelo `Business`:
```prisma
model Business {
  // ... campos existentes ...
  tables  RestaurantTable[]
  photos  BusinessPhoto[]
}
```

Correr migración:
```bash
cd backend
npx prisma migrate dev --name sprint3_restaurant_tables
npx prisma generate
```

En Railway:
```bash
railway run npx prisma migrate deploy
```

**HU31-T2: Controller de mesas**

Crear `backend/src/controllers/table.controller.js`:

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/tables/:businessId?date=2026-06-20&time=20:00
const getTables = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, time } = req.query;

    const tables = await prisma.restaurantTable.findMany({
      where: { businessId, active: true },
      orderBy: { number: 'asc' }
    });

    if (!date || !time) return res.json(tables.map(t => ({
      ...t, status: 'available'
    })));

    // Verificar disponibilidad para la fecha/hora
    const reservations = await prisma.tableReservation.findMany({
      where: {
        businessId, date,
        status: { not: 'CANCELADA' }
      }
    });

    const tablesWithStatus = tables.map(table => {
      const reservation = reservations.find(r => r.tableId === table.id);
      let status = 'available';
      if (reservation) {
        // Si la reserva es dentro de 30 min → "soon"
        const [rh, rm] = reservation.time.split(':').map(Number);
        const [qh, qm] = time.split(':').map(Number);
        const diff = (rh * 60 + rm) - (qh * 60 + qm);
        status = diff > 0 && diff <= 30 ? 'soon' : 'busy';
      }
      return { ...table, status, reservation: reservation || null };
    });

    res.json(tablesWithStatus);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener mesas' });
  }
};

// POST /api/tables/reserve
const reserveTable = async (req, res) => {
  try {
    const {
      tableId, businessId, date, time, guests,
      occasion, clientId, guestName, guestEmail, guestPhone
    } = req.body;

    // Verificar disponibilidad
    const conflict = await prisma.tableReservation.findFirst({
      where: { tableId, date, time, status: { not: 'CANCELADA' } }
    });
    if (conflict) return res.status(409).json({
      message: 'Esta mesa ya está reservada para esa fecha y hora'
    });

    const accessCode = !clientId
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : null;

    const reservation = await prisma.tableReservation.create({
      data: {
        tableId, businessId, date, time,
        guests: parseInt(guests),
        occasion: occasion || null,
        clientId: clientId || null,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        accessCode
      },
      include: { table: true }
    });

    // Enviar correo de confirmación
    const { sendTableConfirmationEmail } = require('../services/mail.service');
    const email = clientId
      ? (await prisma.user.findUnique({ where: { id: clientId } }))?.email
      : guestEmail;
    if (email) await sendTableConfirmationEmail(email, reservation, accessCode);

    res.status(201).json({
      message: 'Reserva de mesa confirmada',
      reservation,
      accessCode
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al reservar mesa' });
  }
};

// CRUD de mesas para el admin
const createTable = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { number, capacity, posX, posY, shape } = req.body;
    const table = await prisma.restaurantTable.create({
      data: { businessId, number: parseInt(number), capacity: parseInt(capacity),
              posX: parseFloat(posX || 10), posY: parseFloat(posY || 10),
              shape: shape || 'round' }
    });
    res.status(201).json(table);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({
      message: `La mesa número ${req.body.number} ya existe`
    });
    res.status(500).json({ message: 'Error al crear mesa' });
  }
};

const updateTable = async (req, res) => {
  try {
    const table = await prisma.restaurantTable.update({
      where: { id: req.params.tableId },
      data: req.body
    });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar mesa' });
  }
};

const deleteTable = async (req, res) => {
  try {
    await prisma.restaurantTable.update({
      where: { id: req.params.tableId },
      data: { active: false }
    });
    res.json({ message: 'Mesa eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar mesa' });
  }
};

module.exports = { getTables, reserveTable, createTable, updateTable, deleteTable };
```

**HU31-T3: Rutas de mesas**

Crear `backend/src/routes/table.routes.js`:

```js
const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/table.controller');

const adminOnly = [authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN')];

router.get('/:businessId',              ctrl.getTables);        // público
router.post('/reserve',                 ctrl.reserveTable);     // público (guest) o auth
router.post('/:businessId',             ...adminOnly, ctrl.createTable);
router.put('/:tableId',                 ...adminOnly, ctrl.updateTable);
router.delete('/:tableId',              ...adminOnly, ctrl.deleteTable);

module.exports = router;
```

Registrar en `index.js`:
```js
const tableRoutes = require('./routes/table.routes');
app.use('/api/tables', tableRoutes);
```

**HU31-T4: Upload de fotos con Cloudinary**

Instalar dependencias:
```bash
cd backend
npm install cloudinary multer multer-storage-cloudinary
```

Agregar en `.env`:
```env
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

Crear `backend/src/services/upload.service.js`:
```js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'reservflex', allowed_formats: ['jpg','jpeg','png','webp'] }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
module.exports = { upload, cloudinary };
```

Endpoint de fotos en `business.routes.js`:
```js
const { upload } = require('../services/upload.service');

// POST /api/business/:id/photos
router.post('/:id/photos',
  authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'),
  upload.array('photos', 5),
  async (req, res) => {
    try {
      const photos = await Promise.all(req.files.map((f, i) =>
        prisma.businessPhoto.create({
          data: {
            businessId: req.params.id,
            url: f.path,
            order: i
          }
        })
      ));
      res.status(201).json(photos);
    } catch (err) {
      res.status(500).json({ message: 'Error al subir fotos' });
    }
  }
);

// GET /api/business/:id/photos — público
router.get('/:id/photos', async (req, res) => {
  const photos = await prisma.businessPhoto.findMany({
    where: { businessId: req.params.id },
    orderBy: { order: 'asc' }
  });
  res.json(photos);
});
```

**HU31-T5: Componente del plano interactivo en el frontend**

Crear `frontend/src/components/RestaurantFloorPlan.jsx`:

```jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUS_CONFIG = {
  available: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  busy:      { bg: 'bg-red-100',   border: 'border-red-500',   text: 'text-red-700'   },
  soon:      { bg: 'bg-yellow-100',border: 'border-yellow-500',text: 'text-yellow-700' },
  selected:  { bg: 'bg-blue-100',  border: 'border-blue-600',  text: 'text-blue-700'  },
};

export default function RestaurantFloorPlan({ businessId, date, time }) {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ guests: 2, occasion: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    api.get(`/tables/${businessId}`, {
      params: date && time ? { date, time } : {}
    }).then(({ data }) => setTables(data))
      .finally(() => setLoading(false));
  }, [businessId, date, time]);

  const handleTableClick = (table) => {
    if (table.status === 'busy') {
      setToast('Esta mesa está ocupada. Elige otra disponible.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setSelected(table);
    setShowModal(true);
  };

  const handleReserve = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/tables/reserve', {
        tableId: selected.id,
        businessId,
        date,
        time,
        guests: form.guests,
        occasion: form.occasion,
        ...(token ? {} : {
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
        })
      });
      setShowModal(false);
      setSelected(null);
      setTables(prev => prev.map(t =>
        t.id === selected.id ? { ...t, status: 'busy' } : t
      ));
      setToast('¡Reserva confirmada! Recibirás un correo de confirmación.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setToast(err.response?.data?.message || 'Error al reservar');
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Cargando plano del restaurante...
    </div>
  );

  return (
    <div>
      {/* Leyenda */}
      <div className="flex gap-4 flex-wrap mb-3">
        {[
          { s:'available', label:'Disponible' },
          { s:'busy',      label:'Ocupada'    },
          { s:'soon',      label:'Pronto libre'},
        ].map(({ s, label }) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-3 h-3 rounded-sm border ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].border}`}/>
            {label}
          </div>
        ))}
      </div>

      {/* Plano */}
      <div className="relative bg-gray-50 border-2 border-gray-200 rounded-xl"
           style={{ height: '320px' }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2
                        text-xs text-gray-400 uppercase tracking-widest">
          Plano del restaurante
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2
                        text-xs text-gray-400 flex items-center gap-1">
          🚪 Entrada
        </div>

        {tables.map(table => {
          const isSelected = selected?.id === table.id;
          const statusKey = isSelected ? 'selected' : table.status;
          const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;
          const isRound = table.shape === 'round';
          const isRect  = table.shape === 'rectangle';
          const w = isRect ? 72 : 52;
          const h = 52;

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`absolute flex flex-col items-center justify-center
                          cursor-pointer border-2 transition-all duration-150
                          hover:scale-105 select-none
                          ${cfg.bg} ${cfg.border}
                          ${isRound ? 'rounded-full' : 'rounded-lg'}`}
              style={{
                left: `${table.posX}%`,
                top:  `${table.posY}%`,
                width: `${w}px`,
                height:`${h}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className={`text-xs font-semibold ${cfg.text}`}>
                M{table.number}
              </span>
              <span className="text-xs text-gray-500">
                👥 {table.capacity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modal de reserva */}
      {showModal && selected && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-3">
            Reservar Mesa {selected.number} · hasta {selected.capacity} personas
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Número de personas
              </label>
              <select
                value={form.guests}
                onChange={e => setForm({ ...form, guests: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Array.from({ length: selected.capacity }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Ocasión especial (opcional)
              </label>
              <select
                value={form.occasion}
                onChange={e => setForm({ ...form, occasion: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Ninguna</option>
                <option value="cumpleanos">🎂 Cumpleaños</option>
                <option value="aniversario">💑 Aniversario</option>
                <option value="negocios">💼 Reunión de negocios</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setShowModal(false); setSelected(null); }}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm
                         text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReserve}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm
                         hover:bg-blue-700"
            >
              Confirmar reserva
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="mt-3 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
```

**HU31-T6: Integrar en BusinessPortal.jsx**

En `BusinessPortal.jsx`, dentro de la pestaña de reservas, agregar lógica
condicional según el tipo de negocio:

```jsx
import RestaurantFloorPlan from '../components/RestaurantFloorPlan';

// En la sección de reservas del portal:
{business.type === 'RESTAURANTE' ? (
  <div>
    <div className="flex gap-3 mb-4 flex-wrap">
      <input type="date"
        value={selectedDate}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => setSelectedDate(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm" />
      <select value={selectedTime}
        onChange={e => setSelectedTime(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm">
        {['19:00','19:30','20:00','20:30','21:00','21:30','22:00'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
    <RestaurantFloorPlan
      businessId={business.id}
      date={selectedDate}
      time={selectedTime}
    />
  </div>
) : (
  // flujo genérico de slots existente
  <Reservar businessId={business.id} />
)}
```

**HU31-T7: Editor de plano para el Admin**

Crear `frontend/src/pages/admin/PlanoRestaurante.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

export default function PlanoRestaurante() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [newTable, setNewTable] = useState({ number:'', capacity:2, shape:'round' });
  const [photos, setPhotos] = useState([]);
  const planRef = useRef(null);

  useEffect(() => {
    if (!user?.businessId) return;
    api.get(`/tables/${user.businessId}`).then(({ data }) => setTables(data));
    api.get(`/business/${user.businessId}/photos`).then(({ data }) => setPhotos(data));
  }, [user]);

  const handleDragEnd = async (tableId, e) => {
    const rect = planRef.current.getBoundingClientRect();
    const posX = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const posY = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    await api.put(`/tables/${tableId}`, { posX: parseFloat(posX), posY: parseFloat(posY) });
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, posX: parseFloat(posX), posY: parseFloat(posY) } : t
    ));
  };

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) return;
    const { data } = await api.post(`/tables/${user.businessId}`, newTable);
    setTables(prev => [...prev, { ...data, status: 'available' }]);
    setNewTable({ number:'', capacity:2, shape:'round' });
  };

  const handleDeleteTable = async (tableId) => {
    await api.delete(`/tables/${tableId}`);
    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  const handlePhotoUpload = async (e) => {
    const formData = new FormData();
    Array.from(e.target.files).forEach(f => formData.append('photos', f));
    const { data } = await api.post(`/business/${user.businessId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setPhotos(prev => [...prev, ...data]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editor de Plano del Restaurante
        </h1>

        {/* Agregar mesa */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-3 flex-wrap">
          <input type="number" placeholder="Nº mesa"
            value={newTable.number}
            onChange={e => setNewTable({ ...newTable, number: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm w-24" />
          <input type="number" placeholder="Capacidad"
            value={newTable.capacity}
            onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
            className="border rounded-lg px-3 py-2 text-sm w-28" />
          <select value={newTable.shape}
            onChange={e => setNewTable({ ...newTable, shape: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="round">Redonda</option>
            <option value="square">Cuadrada</option>
            <option value="rectangle">Rectangular</option>
          </select>
          <button onClick={handleAddTable}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            + Agregar mesa
          </button>
        </div>

        {/* Plano drag-and-drop */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-semibold mb-3 text-gray-700">
            Arrastra las mesas para posicionarlas
          </h2>
          <div
            ref={planRef}
            className="relative bg-gray-50 border-2 border-dashed border-gray-300
                       rounded-xl"
            style={{ height: '360px' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (dragging) handleDragEnd(dragging, e);
            }}
          >
            {tables.map(table => (
              <div
                key={table.id}
                draggable
                onDragStart={() => setDragging(table.id)}
                onDragEnd={() => setDragging(null)}
                className={`absolute flex flex-col items-center justify-center
                             cursor-grab active:cursor-grabbing border-2
                             border-blue-400 bg-blue-50 select-none
                             ${table.shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}
                style={{
                  left: `${table.posX}%`,
                  top: `${table.posY}%`,
                  width: table.shape === 'rectangle' ? '72px' : '52px',
                  height: '52px',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-xs font-bold text-blue-700">M{table.number}</span>
                <span className="text-xs text-gray-500">👥{table.capacity}</span>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white
                               rounded-full w-4 h-4 text-xs flex items-center
                               justify-center hover:bg-red-600"
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3 text-gray-700">Fotos del restaurante</h2>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload}
            className="mb-4 text-sm" />
          <div className="grid grid-cols-3 gap-3">
            {photos.map(photo => (
              <img key={photo.id} src={photo.url} alt={photo.caption || ''}
                className="rounded-lg object-cover h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

Agregar ruta en `App.jsx`:
```jsx
import PlanoRestaurante from './pages/admin/PlanoRestaurante';

<Route path="/admin/plano"
  element={<PrivateRoute roles={['ADMIN_NEGOCIO','SUPER_ADMIN']}>
    <PlanoRestaurante />
  </PrivateRoute>}
/>
```

Agregar link en `AdminNav.jsx` (solo visible para `RESTAURANTE`):
```jsx
// Agregar condicionalmente si el negocio es restaurante
{ user?.businessType === 'RESTAURANTE' && (
  <Link to="/admin/plano">Plano mesas</Link>
)}
```

### Casos de prueba

| ID | Caso | Prioridad | Estimate |
|---|---|---|---|
| C92 | Mesas coloreadas correctamente por estado | High | 600s |
| C93 | Clic en mesa disponible abre modal de reserva | High | 600s |
| C94 | Clic en mesa ocupada muestra mensaje error | High | 300s |
| C95 | Reserva de mesa crea registro en BD | High | 600s |
| C96 | Galería de fotos carga imágenes del restaurante | Medium | 300s |
| C97 | Admin puede agregar mesa nueva al plano | High | 600s |
| C98 | Admin puede mover mesa con drag-and-drop | Medium | 600s |
| C99 | Admin puede subir fotos al portal | Medium | 300s |

---

## PLAN DÍA A DÍA — SPRINT 3

```
SEMANA 1 (16–20 junio)
──────────────────────────────────────────────────────────────────────
Lun 16  Persona A: Setup Azure DevOps + ramas Git + HU21 backend
        Persona B: Modelos Prisma HU31 (Table, TableReservation, Photo)
        Persona C: Inicio HU19 — auditar y corregir Login + Register

Mar 17  Persona A: HU21 frontend (preview slug en formulario)
        Persona B: table.controller.js + table.routes.js
        Persona C: HU19 — responsive BusinessPortal + Catalogo

Mié 18  Persona A: Iniciar HU31 upload fotos (Cloudinary setup)
        Persona B: endpoint GET /api/tables con disponibilidad
        Persona C: HU19 — responsive ReservasAdmin + Metricas

Jue 19  Persona A: HU31 endpoint POST /tables/reserve + mail service
        Persona B: RestaurantFloorPlan.jsx (componente visual)
        Persona C: HU19 — responsive AdminNav + Agenda + testing

Vie 20  Todo el equipo: PR review cruzado → merge features a develop
        Testing integrado en develop, fix de bugs urgentes

SEMANA 2 (23–27 junio)
──────────────────────────────────────────────────────────────────────
Lun 23  Persona A: PlanoRestaurante.jsx (editor admin drag-and-drop)
        Persona B: Integrar RestaurantFloorPlan en BusinessPortal
        Persona C: HU22 — búsqueda y filtros completos

Mar 24  Persona A: Integración fotos en BusinessPortal galería
        Persona B: Fix bugs HU31 + testing mesas
        Persona C: HU22 — estado vacío + limpiar filtros + testing

Mié 25  Todo el equipo: testing end-to-end de todas las HUs
        Fix de bugs encontrados en testing

Jue 26  Merge develop → main
        git tag v3.0.0
        Verificar deploy en Railway y Vercel

Vie 27  Buffer: fix de issues post-deploy
        Preparar informe Sprint 3 para revisión del 3 julio
        Generar XML TestRail con casos C77-C99
```

---

---

# SPRINT 4 — RESEÑAS Y REPORTES

**Período:** 30 junio – 11 julio 2026
**Puntos:** 17 pts

## HUs del Sprint 4

| HU | Descripción | Pts |
|---|---|---|
| HU20 | Onboarding para nuevos administradores | 3 |
| HU23 | Sistema de reseñas y calificaciones | 5 |
| HU24 | Respuesta del negocio a reseñas | 2 |
| HU25 | Exportar reservas a Excel/PDF | 5 |
| HU26 | Reporte de ingresos estimados | 2 |

## Nuevos modelos Prisma

```prisma
model Review {
  id            String      @id @default(uuid())
  reservationId String      @unique
  businessId    String
  rating        Int         // 1-5
  comment       String?
  reply         String?
  createdAt     DateTime    @default(now())
}

# Agregar en Reservation:
# review Review?

# Agregar campo price en Reservation:
# price Float? (copiado de Service.price al momento de reservar)
# discountPercent Float? (% de descuento aplicado si es cliente frecuente)
```

## Dependencias nuevas

```bash
cd backend
npm install xlsx pdfkit
```

## Endpoints nuevos Sprint 4

| Método | Endpoint | HU | Auth |
|---|---|---|---|
| POST | /api/reviews | HU23 | CLIENTE |
| GET | /api/reviews/:businessId | HU23 | No |
| PATCH | /api/reviews/:id/reply | HU24 | ADMIN |
| GET | /api/reservations/export/:businessId?format=xlsx | HU25 | ADMIN |
| GET | /api/reservations/export/:businessId?format=pdf | HU25 | ADMIN |
| GET | /api/reservations/income/:businessId?period=month | HU26 | ADMIN |

## Páginas frontend nuevas Sprint 4

- `frontend/src/pages/admin/Resenas.jsx` — listar reseñas y responder
- Modificar `MisReservas.jsx` — agregar botón "Dejar reseña" en COMPLETADAS
- Modificar `Metricas.jsx` — agregar tarjeta de ingresos estimados
- Modificar `ReservasAdmin.jsx` — agregar botones de exportación
- `frontend/src/components/OnboardingModal.jsx` — stepper 4 pasos

---

---

# SPRINT 5 — FIDELIZACIÓN Y CIERRE

**Período:** 14 julio – 25 julio 2026
**Puntos:** 16 pts

## HUs del Sprint 5

| HU | Descripción | Pts |
|---|---|---|
| HU27 | Perfil público del negocio mejorado | 3 |
| HU28 | Historial de visitas y cliente frecuente | 5 |
| HU29 | Descuentos para clientes frecuentes | 5 |
| HU30 | Landing page pública de ReserFlex | 3 |

## Nuevos modelos Prisma

```prisma
model LoyaltyConfig {
  id               String  @id @default(uuid())
  businessId       String  @unique
  minReservations  Int     @default(5)
  discountPercent  Float   @default(10)
  active           Boolean @default(true)

  business         Business @relation(fields: [businessId], references: [id])
}
```

## Endpoints nuevos Sprint 5

| Método | Endpoint | HU | Auth |
|---|---|---|---|
| GET | /api/clients/:businessId | HU28 | ADMIN |
| GET | /api/clients/:businessId/:clientId | HU28 | ADMIN |
| GET | /api/loyalty/:businessId | HU29 | ADMIN |
| PUT | /api/loyalty/:businessId | HU29 | ADMIN |

## Páginas frontend nuevas Sprint 5

- `frontend/src/pages/LandingPage.jsx` — hero, features, CTA
- `frontend/src/pages/admin/Clientes.jsx` — listado con badge frecuente
- Modificar `BusinessPortal.jsx` — horarios, detalle servicio, reseñas paginadas
- Modificar `App.jsx` — redirección condicional en `/` según sesión

---

---

# CHECKLIST ENTREGA SPRINT 3

Para el grupo revisor (revisión: 3 julio 2026):

## Técnico
- [ ] `git tag v3.0.0` creado en GitHub
- [ ] Deploy en Railway funcionando (health check verde)
- [ ] Deploy en Vercel funcionando (sin errores en consola)
- [ ] Migración `sprint3_restaurant_tables` aplicada en Railway
- [ ] Variables de entorno `CLOUDINARY_*` configuradas en Railway

## HU19 — Responsive
- [ ] Login sin desbordamiento en 375px (iPhone SE)
- [ ] Register sin scroll horizontal en móvil
- [ ] BusinessPortal táctil en móvil
- [ ] Panel admin legible en 768px
- [ ] AdminNav con menú hamburguesa en móvil

## HU21 — Preview URL
- [ ] Preview se muestra al salir del campo nombre
- [ ] Slug normaliza acentos y espacios
- [ ] Indicador verde/rojo según disponibilidad

## HU22 — Filtros
- [ ] Búsqueda en tiempo real por nombre y descripción
- [ ] Filtro por rango de precio
- [ ] Filtro por duración
- [ ] Estado vacío con botón limpiar

## HU31 — Mesas restaurante
- [ ] Plano visible en portal de negocio tipo RESTAURANTE
- [ ] Mesas con colores por estado
- [ ] Modal de reserva funcional
- [ ] Mesa ocupada muestra error al hacer clic
- [ ] Admin puede agregar mesas
- [ ] Admin puede mover mesas en el plano
- [ ] Admin puede subir fotos
- [ ] Fotos visibles en el portal público

## Documentación
- [ ] Informe Sprint 3 en PDF
- [ ] Casos de prueba C77–C99 importados en TestRail
- [ ] Referencias de Jira actualizadas en TestRail
- [ ] User Stories marcadas como Done en Azure DevOps

---

*Fin del documento — ReserFlex Sprint 3, 4 y 5*
*Generado: junio 2026 | Nuvix Inc — Grupo 4 | GR2SW EPN*
