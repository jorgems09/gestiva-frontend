# Gestiva Frontend

Frontend en React + TypeScript para el sistema de gestión de movimientos administrativos Gestiva.

## Requisitos

- Node.js >= 18
- npm o yarn

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y configura:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USER_EMAIL=admin@gestiva.com
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

## Backend

Este frontend requiere que el backend esté corriendo en `http://localhost:3000/api`

Ver: [gestiva-backend](https://github.com/jorgems09/gestiva-backend)

## Estructura del Proyecto

```
src/
├── api/              # Cliente API y endpoints
├── types/            # Tipos TypeScript
├── constants/        # Constantes y enums
├── components/       # Componentes reutilizables
├── pages/            # Páginas principales
├── hooks/            # Custom hooks
└── utils/            # Utilidades
```

## Funcionalidades

- ✅ Dashboard con resumen diario y rentabilidad
- ✅ Catálogo de Clientes (CRUD)
- ✅ Catálogo de Productos (CRUD)
- ✅ Listado de Movimientos
- ✅ Reportes (Diario, Rentabilidad)

## Próximas Funcionalidades

- [ ] Formularios de movimientos (Ventas, Compras, Recibos, Egresos)
- [ ] Validaciones de negocio en frontend
- [ ] Autenticación y autorización
- [ ] Formatos imprimibles
- [ ] Extractos de cartera
- [ ] Estados de cuenta

## Tecnologías

- React 19
- TypeScript
- Vite
- React Query (@tanstack/react-query)
- React Router
- Axios
- React Hook Form
