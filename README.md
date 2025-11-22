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

Copia `.env.example` a `.env.local` y configura:

```env
# Configuración de API
VITE_API_URL=http://localhost:3000/api
VITE_USER_EMAIL=admin@gestiva.com

# Configuración de Branding (Personalización por cliente)
VITE_COMPANY_NAME=Tu Empresa
VITE_APP_NAME=Gestiva
VITE_APP_SUBTITLE=Sistema ERP
VITE_COMPANY_LOGO_PATH=/logo-empresa.svg
VITE_COMPANY_LOGO_ALT=Logo de la empresa
```

⚠️ **Importante**: 
- Las variables de entorno deben comenzar con `VITE_` para estar disponibles en el cliente
- Después de cambiar variables de entorno, reinicia el servidor de desarrollo
- El archivo `.env.local` está en `.gitignore` y no se sube al repositorio

📖 **Más información**: Ver [BRANDING.md](./BRANDING.md) para detalles sobre personalización de branding.

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
