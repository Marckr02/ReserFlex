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
│   │   ├── schema.prisma              ← modelos Sprint 1-3
│   │   └── migrations/               ← historial de migraciones
│   ├── src/
│   │   ├── index.js                   ← servidor Express, rutas registradas
│   │   ├── lib/
│   │   │   └── prisma.js              ← cliente Prisma
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     ← register, verifyEmail, login,
│   │   │   │                            forgotPassword, resetPassword,
│   │   │   │                            changePassword
│   │   │   ├── business.controller.js ← createBusiness, getAllBusinesses,
│   │   │   │                            getBusinessBySlug, toggleBusiness,
│   │   │   │                            checkSlug, getBusinessPhotos,
│   │   │   │                            uploadBusinessPhotos
│   │   │   ├── schedule.controller.js ← getSchedules, upsertSchedules
│   │   │   ├── service.controller.js  ← getServices, createService,
│   │   │   │                            updateService, deleteService
│   │   │   ├── employee.controller.js ← getEmployees, createEmployee,
│   │   │   │                            assignServices
│   │   │   ├── reservation.controller.js ← getSlots, createReservation,
│   │   │   │                                   createGuestReservation,
│   │   │   │                                   getMyReservations,
│   │   │   │                                   getEmployeeReservations,
│   │   │   │                                   getBusinessReservations,
│   │   │   │                                   cancelReservation,
│   │   │   │                                   rescheduleReservation,
│   │   │   │                                   updateReservationStatus,
│   │   │   │                                   getMetrics
│   │   │   └── table.controller.js    ← getTables, reserveTable,
│   │   │                               createTable, updateTable, deleteTable
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js     ← authenticate, authorize(...roles)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── schedule.routes.js
│   │   │   ├── service.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── reservation.routes.js
│   │   │   └── table.routes.js        ← Sprint 3
│   │   └── services/
│   │       └── mail.service.js        ← sendVerificationEmail,
│   │                                    sendCredentialsEmail,
│   │                                    sendResetEmail,
│   │                                    sendConfirmationEmail,
│   │                                    sendTableConfirmationEmail
│   ├── uploads/                       ← fotos de negocio
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
    │   │   ├── AdminNav.jsx           ← navbar admin con menú móvil,
    │   │   │                          grupos de navegación colapsables,
    │   │   │                          link "Plano mesas" condicional RESTAURANTE
    │   │   └── RestaurantFloorPlan.jsx ← plano interactivo de mesas (Sprint 3)
    │   ├── pages/
    │   │   ├── Login.jsx              ← show/hide password, spinner, olvidé contraseña
    │   │   ├── Register.jsx           ← indicador fortaleza contraseña animado
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   ├── VerifyEmail.jsx
    │   │   ├── Profile.jsx
    │   │   ├── Dashboard.jsx          ← Super Admin y Admin Negocio,
    │   │   │                          modal crear negocio con preview slug,
    │   │   │                          link "Plano" para tipo RESTAURANTE
    │   │   ├── Catalogo.jsx           ← cliente con búsqueda y filtros,
    │   │   │                          skeleton loader, temas dinámicos
    │   │   ├── BusinessPortal.jsx     ← portal público /reservas/:slug,
    │   │   │                          RestaurantFloorPlan para RESTAURANTE,
    │   │   │                          galería de fotos
    │   │   ├── NotFound.jsx           ← página 404
    │   │   ├── admin/
    │   │   │   ├── Horarios.jsx
    │   │   │   ├── Servicios.jsx
    │   │   │   ├── Empleados.jsx
    │   │   │   ├── ReservasAdmin.jsx   ← modal crear reserva manual,
    │   │   │   │                      búsqueda de clientes por nombre/email
    │   │   │   ├── Metricas.jsx
    │   │   │   └── PlanoRestaurante.jsx ← editor de plano con drag-and-drop
    │   │   ├── cliente/
    │   │   │   ├── Catalogo.jsx
    │   │   │   ├── Reservar.jsx
    │   │   │   └── MisReservas.jsx
    │   │   └── empleado/
    │   │       └── Agenda.jsx
    │   └── package.json
```

**Archivos nuevos Sprint 3:**

| Archivo | Descripción |
|---------|-------------|
| `backend/src/services/upload.service.js` | Configuración multer para subir fotos de negocio |
| `backend/src/controllers/table.controller.js` | CRUD completo de mesas y reservas de mesa |
| `backend/src/routes/table.routes.js` | Rutas para gestión de mesas |
| `frontend/src/components/RestaurantFloorPlan.jsx` | Componente visual interactivo de plano de restaurante |
| `frontend/src/pages/admin/PlanoRestaurante.jsx` | Editor admin del plano con drag-and-drop |
| `frontend/src/utils/themeHelper.js` | BUSINESS_THEMES: temas dinámicos (colores, gradientes, botones) por tipo de negocio |
| `backend/uploads/` | Directorio para almacenar fotos de negocios y restaurantes |

---

## SCHEMA PRISMA ACTUAL (Sprint 1 + 2 + 3)

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

  admin        User[]              @relation("AdminBusiness")
  schedules    Schedule[]
  services     Service[]
  reservations Reservation[]
  tables       RestaurantTable[]   // Sprint 3
  photos       BusinessPhoto[]     // Sprint 3
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

// ── Modelos Sprint 3 ──────────────────────────────────────────────────────────

model RestaurantTable {
  id         String   @id @default(uuid())
  businessId String
  number     Int
  capacity   Int
  posX       Float    @default(0)
  posY       Float    @default(0)
  shape      String   @default("round")   // "round", "square", "rectangle"
  active     Boolean  @default(true)

  business          Business           @relation(fields: [businessId], references: [id])
  tableReservations TableReservation[]

  @@unique([businessId, number])
}

model TableReservation {
  id         String            @id @default(uuid())
  tableId    String
  businessId String
  date       String
  time       String
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

| HU | Descripción | Pts | Estado |
|---|---|---|---|
| HU19 | Diseño responsive completo | 5 | ✅ COMPLETADO |
| HU21 | Preview URL única al registrar negocio | 2 | ✅ COMPLETADO |
| HU22 | Búsqueda y filtros en portal público | 5 | ✅ COMPLETADO |
| HU31 | Portal visual de mesas para restaurantes | 6 | ✅ COMPLETADO |

---

## HU19 — DISEÑO RESPONSIVE COMPLETO (5 pts) ✅ COMPLETADO

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

### Implementación realizada

**HU19-T1: Login.jsx y Register.jsx**

- Fondo con gradiente (`from-slate-100 via-blue-50 to-indigo-100`)
- Inputs con iconos SVG y funcionalidad show/hide password
- Texto responsive (`text-base sm:text-sm`)
- Spinner de carga en submit
- Indicador de fortaleza de contraseña animado en Register
- Link "Olvidaste tu contraseña?" adicionado

**HU19-T2: BusinessPortal.jsx y Catalogo.jsx**

- Skeleton loader con shimmer animation en carga
- Filtros glass-morphism con búsqueda en tiempo real
- Grid responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Temas dinámicos por tipo de negocio

**HU19-T3: ReservasAdmin.jsx y Metricas.jsx**

- Gráficos con recharts y gradientes
- Grid de métricas: `grid-cols-2 lg:grid-cols-4`
- Date picker para filtrado
- Modal de creación manual de reserva

**HU19-T4: AdminNav.jsx**

- Menú hamburguesa en móvil (`lg:hidden`)
- Navegación colapsable con grupos de enlaces (Principal, Gestión, Análisis)
- Link "Plano mesas" dinámico para tipo RESTAURANTE (desktop y móvil)
- Link "Mi perfil" en desktop y móvil
- Botón cerrar sesión con confirmación visual
- Indicador de link activo usando useLocation
- Animaciones de rotación en acordeones móviles

**HU19-T5: TemaHelper.jsx / themeHelper.js**

- Utilidad `getTheme(businessType)` exportada desde `frontend/src/utils/themeHelper.js`
- `BUSINESS_THEMES` define colores, gradientes, badges y estilos de botones para cada `BusinessType`
- Usado en `Catalogo.jsx` y `BusinessPortal.jsx` para aplicar tema dinámico según tipo de negocio
- Temas incluyen: `gradient`, `button`, `ring`, `softBg`, `primaryText`, `accentText`, `badge`, `selectedSlot`

### Casos de prueba

| ID | Caso | Prioridad | Estado |
|---|---|---|---|
| C77 | Login sin desbordamiento en 375px | High | ✅ |
| C78 | Register sin scroll horizontal en móvil | High | ✅ |
| C79 | Portal de reserva táctil en móvil (botones ≥44px) | High | ✅ |
| C80 | Panel admin legible en 768px sin pérdida de info | High | ✅ |
| C81 | Agenda empleado con tarjetas legibles en móvil | Medium | ✅ |
| C82 | Métricas y gráficas adaptadas en pantalla pequeña | Medium | ✅ |

---

## HU21 — PREVIEW DE URL ÚNICA AL REGISTRAR NEGOCIO (2 pts) ✅ COMPLETADO

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

### Implementación realizada

**Backend — `business.controller.js`:**

```js
// GET /api/business/check-slug?name=Salon El Rey
const checkSlug = async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ message: 'El nombre es requerido' });

    const slug = normalizeSlug(name);
    const existingBusiness = await prisma.business.findUnique({ where: { slug } });

    res.json({ slug, available: !existingBusiness });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar slug' });
  }
};
```

**Ruta en `business.routes.js`:**
```js
router.get('/check-slug', checkSlug); // público
```

**Frontend — `Dashboard.jsx`:**

```jsx
const [slugPreview, setSlugPreview] = useState('');
const [slugAvailable, setSlugAvailable] = useState(null);

const normalizeSlug = (value) => value
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const handleNameBlur = async (e) => {
  const name = e.target.value.trim();
  if (!name) { setSlugPreview(''); setSlugAvailable(null); return; }

  const slug = normalizeSlug(name);
  setSlugPreview(slug);
  try {
    const { data } = await api.get(`/business/check-slug?name=${encodeURIComponent(name)}`);
    setSlugAvailable(data.available);
  } catch { setSlugAvailable(null); }
};
```

En el modal de creación en `Dashboard.jsx`, debajo del input de nombre:
```jsx
{slugPreview && (
  <div className={`mt-2.5 text-sm flex items-center gap-2
    ${slugAvailable === true ? 'text-green-600' :
      slugAvailable === false ? 'text-red-500' : 'text-slate-500'}`}>
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
    </svg>
    <span className="font-medium">reservas/{slugPreview}</span>
    {slugAvailable === true && <span className="text-green-500 font-semibold">✓ Disponible</span>}
    {slugAvailable === false && <span className="text-red-500 font-semibold">✕ Ya está en uso</span>}
  </div>
)}
```

### Casos de prueba

| ID | Caso | Prioridad | Estado |
|---|---|---|---|
| C83 | Preview aparece al salir del campo nombre | Medium | ✅ |
| C84 | Nombre con acentos genera slug normalizado | Medium | ✅ |
| C85 | Slug duplicado muestra advertencia en rojo | High | ✅ |

---

## MEJORAS ADICIONALES SPRINT 3

### Dashboard — Link "Plano" para restaurantes

En `Dashboard.jsx` para ADMIN_NEGOCIO con `businessType === 'RESTAURANTE'`:

```jsx
// QuickActionCard para acceso directo al plano
{user?.businessType === 'RESTAURANTE' && (
  <QuickActionCard
    to="/admin/plano"
    title="Plano de Mesas"
    description="Configura el layout y gestiona mesas"
    icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
    color="from-rose-500 to-rose-600"
  />
)}
```

En la tarjeta de negocio para SUPER_ADMIN:

```jsx
{biz.type === 'RESTAURANTE' && (
  <Link
    to={`/admin/plano/${biz.id}`}
    className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
    </svg>
    Plano
  </Link>
)}
```

### BusinessPortal — Integración RestaurantFloorPlan y Galería

En `BusinessPortal.jsx`, para negocios tipo RESTAURANTE se renderiza el componente `RestaurantFloorPlan` dentro de una sección "Reservar Mesa Física". La galería de fotos se muestra si `photos.length > 0` con un grid `grid-cols-1 sm:grid-cols-3` que muestra hasta 6 fotos.

### ReservasAdmin — Búsqueda de clientes para reserva manual

En `ReservasAdmin.jsx`, el modal de creación manual de reservas incluye búsqueda de clientes existentes:

```js
// GET /api/reservations/clients/search?q=nombre
// Busca usuarios con rol CLIENTE por nombre o email
// Endpoint usado en ReservasAdmin.jsx para autocompletar cliente
useEffect(() => {
  const searchClients = async () => {
    if (clientQuery.trim().length < 2) { setClientResults([]); return; }
    setSearchingClients(true);
    try {
      const { data } = await api.get('/reservations/clients/search', {
        params: { q: clientQuery.trim() }
      });
      setClientResults(data);
    } finally { setSearchingClients(false); }
  };
  const timeoutId = setTimeout(searchClients, 300); // debounce 300ms
  return () => clearTimeout(timeoutId);
}, [clientQuery]);
```

```js
// POST /api/reservations/business/:businessId/manual — crear reserva manual
// Body: { serviceId, employeeId?, startTime, notes?, clientId?, guestName?, guestEmail?, guestPhone? }
```

### themeHelper.js — Temas dinámicos por tipo de negocio

```js
// frontend/src/utils/themeHelper.js
export const BUSINESS_THEMES = {
  SALON_BARBERIA: { gradient: 'from-stone-900 via-stone-800 to-amber-950', button: 'bg-stone-900 hover:bg-stone-800 text-white', ... },
  CONSULTORIO:    { gradient: 'from-slate-900 via-teal-950 to-slate-950', button: 'bg-teal-600 hover:bg-teal-700 text-white', ... },
  RESTAURANTE:    { gradient: 'from-stone-950 via-rose-950 to-stone-900', button: 'bg-rose-600 hover:bg-rose-700 text-white', ... },
  HOTEL:          { gradient: 'from-slate-950 via-indigo-950 to-slate-900', button: 'bg-indigo-900 hover:bg-indigo-950 text-white', ... },
  CANCHA_GIMNASIO: { gradient: 'from-zinc-950 via-emerald-950 to-zinc-900', button: 'bg-zinc-900 hover:bg-zinc-800 text-white', ... },
  GENERICO:       { gradient: 'from-slate-950 via-blue-950 to-slate-900', button: 'bg-slate-900 hover:bg-slate-800 text-white', ... },
};

export function getTheme(type) {
  return BUSINESS_THEMES[type] || BUSINESS_THEMES.GENERICO;
}
```

Usado en `Catalogo.jsx` para el banner, filtros, badges y botones, y en `BusinessPortal.jsx` para el hero banner y los botones de acción.

---

## HU22 — BÚSQUEDA Y FILTROS EN EL PORTAL PÚBLICO (5 pts) ✅ COMPLETADO

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

### Implementación realizada

**Archivo: `frontend/src/pages/cliente/Catalogo.jsx`**

```jsx
const [search, setSearch] = useState('');
const [priceRange, setPriceRange] = useState('all');
const [durationFilter, setDurationFilter] = useState('all');

const filteredServices = useMemo(() => {
  return services.filter((service) => {
    const haystack = `${service.name} ${service.description || ''}`.toLowerCase();
    const searchMatch = !search || haystack.includes(search.toLowerCase());

    const priceMatch = priceRange === 'all'
      ? true
      : priceRange === '0-20' ? service.price <= 20
      : priceRange === '20-50' ? service.price > 20 && service.price <= 50
      : service.price > 50;

    const durationMatch = durationFilter === 'all'
      ? true
      : durationFilter === 'short' ? service.duration <= 30
      : durationFilter === 'medium' ? service.duration > 30 && service.duration <= 60
      : service.duration > 60;

    return searchMatch && priceMatch && durationMatch;
  });
}, [services, search, priceRange, durationFilter]);

const clearFilters = () => {
  setSearch('');
  setPriceRange('all');
  setDurationFilter('all');
};
```

Features adicionales implementadas:
- Skeleton loader con shimmer animation
- Temas dinámicos por tipo de negocio (`getTheme` helper)
- Estado vacío con diseño premium y CTA
- Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Casos de prueba

| ID | Caso | Prioridad | Estado |
|---|---|---|---|
| C86 | Búsqueda filtra por nombre en tiempo real | High | ✅ |
| C87 | Búsqueda filtra por descripción | Medium | ✅ |
| C88 | Filtro de precio muestra solo servicios en rango | High | ✅ |
| C89 | Filtro de duración muestra servicios correctos | High | ✅ |
| C90 | Estado vacío con mensaje y botón limpiar | Medium | ✅ |
| C91 | Limpiar filtros restaura el catálogo completo | Medium | ✅ |

---

## HU31 — PORTAL VISUAL DE MESAS PARA RESTAURANTES (6 pts) ✅ COMPLETADO

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

### Implementación realizada

**HU31-T1: Modelos en `schema.prisma`**

```prisma
model RestaurantTable {
  id         String   @id @default(uuid())
  businessId String
  number     Int
  capacity   Int
  posX       Float    @default(0)
  posY       Float    @default(0)
  shape      String   @default("round")
  active     Boolean  @default(true)

  business          Business           @relation(fields: [businessId], references: [id])
  tableReservations TableReservation[]

  @@unique([businessId, number])
}

model TableReservation {
  id         String            @id @default(uuid())
  tableId    String
  businessId String
  date       String
  time       String
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

**HU31-T2: Controller `table.controller.js`**

```js
// GET /api/tables/:businessId?date=&time=
const getTables = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, time } = req.query;

    const tables = await prisma.restaurantTable.findMany({
      where: { businessId, active: true },
      orderBy: { number: 'asc' }
    });

    // Si no hay fecha/hora, devolver todas como disponibles
    if (!date || !time) {
      return res.json(tables.map(t => ({ ...t, status: 'available', reservation: null })));
    }

    // Buscar reservas confirmadas para esa fecha
    const reservations = await prisma.tableReservation.findMany({
      where: { businessId, date, status: { not: 'CANCELADA' } }
    });

    const [queryHour, queryMinute] = time.split(':').map(Number);
    const currentMinutes = queryHour * 60 + queryMinute;

    // Calcular estado de cada mesa: available, soon (libre en 30min), busy
    const payload = tables.map((table) => {
      const reservation = reservations.find((item) => item.tableId === table.id);
      let status = 'available';
      if (reservation) {
        const [resH, resM] = reservation.time.split(':').map(Number);
        const diff = (resH * 60 + resM) - currentMinutes;
        status = diff > 0 && diff <= 30 ? 'soon' : 'busy';
      }
      return { ...table, status, reservation: reservation || null };
    });

    res.json(payload);
  } catch (error) {
    console.error('Error getTables:', error);
    res.status(500).json({ message: 'Error al obtener mesas' });
  }
};

// POST /api/tables/reserve — público
const reserveTable = async (req, res) => {
  try {
    const { tableId, businessId, date, time, guests, occasion,
            clientId, guestName, guestEmail, guestPhone } = req.body;

    // Validación de campos requeridos
    if (!tableId || !businessId || !date || !time || !guests) {
      return res.status(400).json({ message: 'Mesa, negocio, fecha, hora y número de personas son requeridos' });
    }

    // Verificar conflicto de horario
    const conflict = await prisma.tableReservation.findFirst({
      where: { tableId, date, time, status: { not: 'CANCELADA' } }
    });
    if (conflict) {
      return res.status(409).json({ message: 'Esta mesa ya está reservada para esa fecha y hora' });
    }

    // Validar datos del cliente o invitado
    if (!clientId && (!guestName || !guestEmail || !guestPhone)) {
      return res.status(400).json({ message: 'Completa los datos del invitado o inicia sesión' });
    }

    // Verificar que la mesa existe
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    // Generar código de acceso para reservas sin cuenta
    const accessCode = clientId ? null : crypto.randomInt(100000, 999999).toString();

    const reservation = await prisma.tableReservation.create({
      data: { tableId, businessId, date, time, guests, occasion,
              clientId, guestName, guestEmail, guestPhone, accessCode },
      include: { table: true }
    });

    // Obtener nombre del negocio para el correo
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    });

    // Enviar correo de confirmación
    const email = clientId
      ? (await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } }))?.email
      : guestEmail;
    if (email) {
      await sendTableConfirmationEmail(email, { ...reservation, business }, accessCode);
    }

    res.status(201).json({ message: 'Reserva de mesa confirmada', reservation, accessCode });
  } catch (error) {
    console.error('Error reserveTable:', error);
    res.status(500).json({ message: 'Error al reservar mesa' });
  }
};

// POST /api/tables/:businessId  — admin: crear mesa
// PUT  /api/tables/:tableId     — admin: actualizar (posición, capacidad, forma)
// DELETE /api/tables/:tableId   — admin: soft delete (active: false)
```

**HU31-T3: Rutas `table.routes.js`**

```js
const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/table.controller');

const adminOnly = [authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN')];

router.get('/:businessId',              ctrl.getTables);        // público
router.post('/reserve',                 ctrl.reserveTable);     // público
router.post('/:businessId',             ...adminOnly, ctrl.createTable);
router.put('/:tableId',                 ...adminOnly, ctrl.updateTable);
router.delete('/:tableId',              ...adminOnly, ctrl.deleteTable);

module.exports = router;
```

**HU31-T4: Fotos de negocio y servicio de upload**

**Backend — `upload.service.js`:**
```js
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9.\-]/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

module.exports = { upload };
```

En `business.controller.js`:
```js
// GET /api/business/:id/photos — público
const getBusinessPhotos = async (req, res) => {
  const photos = await prisma.businessPhoto.findMany({
    where: { businessId: req.params.id },
    orderBy: { order: 'asc' }
  });
  res.json(photos);
};

// POST /api/business/:id/photos — admin (usa multer local storage)
const uploadBusinessPhotos = async (req, res) => {
  const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const created = await Promise.all(req.files.map((file, index) =>
    prisma.businessPhoto.create({
      data: { businessId: req.params.id, url: `${backendUrl}/uploads/${file.filename}`, order: index }
    })
  ));
  res.status(201).json(created);
};
```

**HU31-T5: Componente `RestaurantFloorPlan.jsx`**

Archivo: `frontend/src/components/RestaurantFloorPlan.jsx`

Features implementadas:
- Selector de fecha y hora con hora predeterminada 20:00
- Plano con disposición visual premium estilo blueprint (zona entrada, barra/cocina, terraza)
- Sillas renderizadas dinámicamente alrededor de las mesas según capacidad y forma
- Estados: `available` (verde esmeralda), `busy` (rojo, cursor-not-allowed), `soon` (amarillo), `selected` (azul con ring)
- Cálculo de estado "soon" cuando la reserva está a 30 minutos o menos
- Modal de reserva con: número de comensales, ocasión especial, campos de invitado
- Si el usuario tiene rol CLIENTE, usa clientId automáticamente
- Toast notification flotante para feedback de éxito/error
- Reconexión automática al cambiar fecha/hora usando useEffect

```jsx
const STATUS_CONFIG = {
  available: { bg: 'bg-emerald-50 hover:bg-emerald-100/80', border: 'border-emerald-500',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.12)]', text: 'text-emerald-700' },
  busy:      { bg: 'bg-rose-50/60 cursor-not-allowed', border: 'border-rose-300 opacity-60', text: 'text-rose-500' },
  soon:      { bg: 'bg-amber-50 hover:bg-amber-100/80', border: 'border-amber-400',
    shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.08)]', text: 'text-amber-700' },
  selected:  { bg: 'bg-blue-50/90 hover:bg-blue-100', border: 'border-blue-600',
    shadow: 'shadow-[0_0_12px_rgba(37,99,235,0.25)] ring-2 ring-blue-600/20', text: 'text-blue-700' },
};
```

Decoración del plano:
- Entrada (zona izquierda con indicador vertical)
- Barra/Cocina (zona inferior derecha)
- Terraza (zona superior derecha)
- Fondo con grid punteado estilo plano arquitectónico

**HU31-T6: Editor admin `PlanoRestaurante.jsx`**

Archivo: `frontend/src/pages/admin/PlanoRestaurante.jsx`

Features implementadas:
- Agregar mesas con número, capacidad y forma (round/square/rectangle)
- Posición inicial de nuevas mesas: 10% desde esquina superior izquierda
- Drag-and-drop para reposicionar mesas usando eventos drag en div
- Eliminar mesas (soft delete: PATCH active: false)
- Subir múltiples fotos del restaurante con FormData y multipart/form-data
- Galería de fotos con grid responsive
- Soporta `businessId` por parámetro URL (`/admin/plano/:businessId?`) o del usuario logueado
- Carga en paralelo de mesas y fotos usando `Promise.all`

```jsx
// Drag-and-drop handler
const handleDropTable = async (tableId, event) => {
  if (!planRef.current) return;
  const rect = planRef.current.getBoundingClientRect();
  const posX = ((event.clientX - rect.left) / rect.width) * 100;
  const posY = ((event.clientY - rect.top) / rect.height) * 100;
  await api.put(`/tables/${tableId}`, { posX, posY });
  setTables(current => current.map(t => t.id === tableId ? { ...t, posX, posY } : t));
};
```

```jsx
// Subida de fotos
const handlePhotoUpload = async (event) => {
  const formData = new FormData();
  Array.from(event.target.files || []).forEach(file => formData.append('photos', file));
  const { data } = await api.post(`/business/${businessId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  setPhotos(current => [...current, ...data]);
};
```

### Casos de prueba

| ID | Caso | Prioridad | Estado |
|---|---|---|---|
| C92 | Mesas coloreadas correctamente por estado | High | ✅ |
| C93 | Clic en mesa disponible abre modal de reserva | High | ✅ |
| C94 | Clic en mesa ocupada muestra mensaje error | High | ✅ |
| C95 | Reserva de mesa crea registro en BD | High | ✅ |
| C96 | Galería de fotos carga imágenes del restaurante | Medium | ✅ |
| C97 | Admin puede agregar mesa nueva al plano | High | ✅ |
| C98 | Admin puede mover mesa con drag-and-drop | Medium | ✅ |
| C99 | Admin puede subir fotos al portal | Medium | ✅ |

---

## PLAN DÍA A DÍA — SPRINT 3 ✅ COMPLETADO

```
SEMANA 1 (16–20 junio)
──────────────────────────────────────────────────────────────────────
Lun 16  Setup Azure DevOps + ramas Git + commit inicial Sprint 3
        Modelo Prisma: RestaurantTable, TableReservation, BusinessPhoto
        Auditoría Login + Register responsive

Mar 17  HU21 backend: check-slug endpoint
        HU21 frontend: preview slug en Dashboard.jsx
        table.controller.js y table.routes.js

Mié 18  HU31: RestaurantFloorPlan.jsx componente visual
        Endpoint GET /api/tables con disponibilidad

Jue 19  HU31: PlanoRestaurante.jsx editor admin
        Integración RestaurantFloorPlan en portal
        business.controller.js: getBusinessPhotos, uploadBusinessPhotos

Vie 20  PR review cruzado → merge features a develop
        Correcciones UI/UX, fix de rutas duplicadas en App.jsx

SEMANA 2 (23–27 junio)
──────────────────────────────────────────────────────────────────────
Lun 23  HU19: responsive AdminNav con menú hamburguesa
        HU19: responsive ReservasAdmin + Metricas

Mar 24  HU22: búsqueda y filtros en Catalogo.jsx
        Skeleton loader y temas dinámicos

Mié 25  Testing end-to-end de todas las HUs
        Fix de bugs encontrados

Jue 26  Merge develop → main
        git tag v3.0.0
        Verificar deploy en Railway y Vercel

Vie 27  Buffer: fix de issues post-deploy
        Preparar informe Sprint 3 para revisión del 3 julio
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

## SCRIPT DE SEED — DATOS DE PRUEBA

Para facilitar las pruebas del equipo evaluador, existe un script de seed que crea:

- 1 negocio de cada tipo (6 negocios)
- Admin con credenciales temporales para cada negocio
- 2 empleados por negocio (con servicios asignados)
- 5 servicios por negocio (excepto restaurante: 4 servicios + 8 mesas)
- Horarios para los 7 días de la semana
- 1 Super Admin global

### Archivo
```
backend/prisma/seed.js
```

### Uso

```bash
cd backend
npm run seed
```

O resetear base de datos y hacer seed:
```bash
npm run db:reset
```

### Credenciales generadas

Todas usan la contraseña: `Test1234`

| Rol | Email |
|---|---|
| Super Admin | superadmin@reserflex.com |
| Admin Barbería | admin.barberia@test.com |
| Admin Consultorio | admin.consultorio@test.com |
| Admin Restaurante | admin.restaurante@test.com |
| Admin Hotel | admin.hotel@test.com |
| Admin Deportes | admin.deportes@test.com |
| Admin Eventos | admin.eventos@test.com |

Empleados: `empleado1.{slug}@test.com`, `empleado2.{slug}@test.com`

### Notas
- Si un negocio ya existe (por slug), el seed lo salta
- Las contraseñas son `Test1234` para todos (debe cambiarse en producción)
- El restaurante incluye 8 mesas pre-posicionadas en el plano

---

---

# CHECKLIST ENTREGA SPRINT 3 ✅ COMPLETADO

Para el grupo revisor (revisión: 3 julio 2026):

## Técnico
- [x] `git tag v3.0.0` creado en GitHub
- [x] Deploy en Railway funcionando (health check verde)
- [x] Deploy en Vercel funcionando (sin errores en consola)
- [x] Migración `sprint3_restaurant_tables` aplicada en Railway
- [x] Variables de entorno configuradas en Railway

## HU19 — Responsive ✅
- [x] Login sin desbordamiento en 375px (iPhone SE)
- [x] Register sin scroll horizontal en móvil
- [x] BusinessPortal táctil en móvil
- [x] Panel admin legible en 768px
- [x] AdminNav con menú hamburguesa en móvil

## HU21 — Preview URL ✅
- [x] Preview se muestra al salir del campo nombre
- [x] Slug normaliza acentos y espacios
- [x] Indicador verde/rojo según disponibilidad

## HU22 — Filtros ✅
- [x] Búsqueda en tiempo real por nombre y descripción
- [x] Filtro por rango de precio
- [x] Filtro por duración
- [x] Estado vacío con botón limpiar

## HU31 — Mesas restaurante ✅
- [x] Plano visible en portal de negocio tipo RESTAURANTE
- [x] Mesas con colores por estado
- [x] Modal de reserva funcional
- [x] Mesa ocupada muestra error al hacer clic
- [x] Admin puede agregar mesas
- [x] Admin puede mover mesas en el plano
- [x] Admin puede subir fotos
- [x] Fotos visibles en el portal público

## Documentación ✅
- [x] Informe Sprint 3 en PDF
- [x] Casos de prueba C77–C99 ejecutados
- [x] User Stories marcadas como Done en Azure DevOps
- [x] Commits etiquetados por HU en Git

---

*Fin del documento — ReserFlex Sprint 3, 4 y 5*
*Generado: junio 2026 | Nuvix Inc — Grupo 4 | GR2SW EPN*
