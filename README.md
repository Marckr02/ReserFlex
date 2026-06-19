# ReserFlex

Sistema de gestión de reservas para múltiples tipos de negocios.

## Stack
- **Backend:** Node.js 24 + Express 4 + Prisma 7 + PostgreSQL
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Deploy:** Railway (Backend) + Veroel (Frontend)

## Estructura
```
reservflex/
├── backend/      # API REST con Express
└── frontend/     # App React
```

## Getting Started

### Backend
```bash
cd backend
npm install
# Configurar .env con DATABASE_URL
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```