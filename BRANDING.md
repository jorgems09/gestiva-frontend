# 🎨 Guía de Personalización de Branding

Esta guía te explica cómo personalizar el logo y nombre de tu empresa en la aplicación Gestiva **usando variables de entorno**, lo que permite personalizar el software según el cliente al que se le venda.

## 📝 Contenido

1. [Configuración Rápida con Variables de Entorno](#configuración-rápida-con-variables-de-entorno)
2. [Cambiar el Logo de la Empresa](#cambiar-el-logo-de-la-empresa)
3. [Cambiar el Nombre de la Empresa](#cambiar-el-nombre-de-la-empresa)
4. [Personalizar el Nombre de la Aplicación](#personalizar-el-nombre-de-la-aplicación)
5. [Ejemplo para Múltiples Clientes](#ejemplo-para-múltiples-clientes)

---

## ⚙️ Configuración Rápida con Variables de Entorno

### ¿Por qué usar variables de entorno?

Usar variables de entorno permite personalizar el branding **sin modificar código**, facilitando la venta del software a diferentes clientes con sus propios logos y nombres de empresa.

### Paso 1: Crear archivo de configuración

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Edita el archivo `.env.local` con los valores del cliente:
   ```env
   # Nombre de la empresa cliente
   VITE_COMPANY_NAME=Boutique Elegante S.A.
   
   # Nombre de la aplicación
   VITE_APP_NAME=Gestiva
   
   # Subtítulo de la aplicación
   VITE_APP_SUBTITLE=Gestiva
   
   # Ruta del logo
   VITE_COMPANY_LOGO_PATH=/logo-empresa.svg
   
   # Texto alternativo del logo
   VITE_COMPANY_LOGO_ALT=Logo de Boutique Elegante
   ```

3. **IMPORTANTE**: Reinicia el servidor de desarrollo después de cambiar variables de entorno:
   ```bash
   # Detén el servidor (Ctrl+C) y reinícialo
   npm run dev
   ```

### Variables de Entorno Disponibles

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_COMPANY_NAME` | Nombre de la empresa cliente | `'Tu Empresa'` |
| `VITE_APP_NAME` | Nombre de la aplicación | `'Gestiva'` |
| `VITE_APP_SUBTITLE` | Subtítulo de la aplicación | `'Gestiva'` |
| `VITE_COMPANY_LOGO_PATH` | Ruta del logo (en `/public`) | `'/logo-empresa.svg'` |
| `VITE_COMPANY_LOGO_ALT` | Texto alternativo del logo | `'Logo de la empresa'` |

⚠️ **Nota Importante**: En Vite, todas las variables de entorno que se exponen al cliente deben comenzar con el prefijo `VITE_`

---

## 🖼️ Cambiar el Logo de la Empresa

### Paso 1: Preparar tu logo

1. **Formato recomendado**: SVG (escalable y de alta calidad)
   - Alternativas: PNG con fondo transparente, JPG
   
2. **Tamaño sugerido**: 
   - Mínimo: 64x64px
   - Recomendado: 128x128px o mayor
   - El sistema escalará automáticamente el logo

3. **Recomendaciones de diseño**:
   - Fondo transparente (preferible)
   - Colores que contrasten con el fondo rosa del sidebar
   - Diseño simple y reconocible a tamaño pequeño

### Paso 2: Colocar el logo

1. Coloca tu archivo de logo en la carpeta `/public` del proyecto:
   ```
   gestiva-frontend/
   └── public/
       └── logo-empresa.svg  ← Tu logo aquí
   ```

2. Si tu logo tiene otro nombre, actualiza la variable de entorno:

   Edita el archivo `.env.local`:
   ```env
   VITE_COMPANY_LOGO_PATH=/mi-logo-personalizado.svg
   ```
   
   O si prefieres configurarlo en código (menos recomendado para multi-tenant):
   
   Abre el archivo: `src/config/branding.ts`
   
   Cambia la línea `logoPath`:
   ```typescript
   logoPath: import.meta.env.VITE_COMPANY_LOGO_PATH || '/mi-logo-personalizado.svg',
   ```

### Paso 3: Verificar

1. Guarda los cambios
2. La aplicación se recargará automáticamente
3. Verás tu logo en el sidebar (lado izquierdo)

### Nota

Si no proporcionas un logo, se mostrará automáticamente un placeholder elegante con un ícono de tienda Material Design.

---

## 🏢 Cambiar el Nombre de la Empresa

### Método Recomendado: Variables de Entorno

1. Edita el archivo `.env.local`:
   ```env
   VITE_COMPANY_NAME=Boutique Elegante S.A.
   ```

2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Método Alternativo: Código

Si prefieres configurarlo directamente en código:

1. Abre el archivo: `src/config/branding.ts`

2. Cambia la línea `companyName`:
   ```typescript
   companyName: import.meta.env.VITE_COMPANY_NAME || 'Boutique Elegante S.A.',
   ```

### Ubicación visual

El nombre de la empresa aparecerá:
- **Desktop**: Debajo del logo en el sidebar, en texto pequeño y mayúsculas
- **Mobile**: En el drawer, arriba del nombre de la aplicación

---

## 📱 Personalizar el Nombre de la Aplicación

### Método Recomendado: Variables de Entorno

Edita el archivo `.env.local`:
```env
VITE_APP_NAME=Gestiva
VITE_APP_SUBTITLE=Gestiva
```

### Método Alternativo: Código

Abre `src/config/branding.ts` y modifica directamente los valores.

---

## 🏭 Ejemplo para Múltiples Clientes

### Escenario: Vender a 3 clientes diferentes

Para el **Cliente 1 - Boutique Elegante**:
```env
# .env.cliente1 (renombrar a .env.local antes de build)
VITE_COMPANY_NAME=Boutique Elegante S.A.
VITE_COMPANY_LOGO_PATH=/logo-boutique.svg
VITE_COMPANY_LOGO_ALT=Logo de Boutique Elegante
```

Para el **Cliente 2 - Moda Fashion**:
```env
# .env.cliente2
VITE_COMPANY_NAME=Moda Fashion S.A.
VITE_COMPANY_LOGO_PATH=/logo-moda.svg
VITE_COMPANY_LOGO_ALT=Logo de Moda Fashion
```

Para el **Cliente 3 - Tienda Bella**:
```env
# .env.cliente3
VITE_COMPANY_NAME=Tienda Bella
VITE_COMPANY_LOGO_PATH=/logo-tienda.svg
VITE_COMPANY_LOGO_ALT=Logo de Tienda Bella
```

### Workflow de Build por Cliente

```bash
# 1. Copiar variables del cliente
cp .env.cliente1 .env.local

# 2. Copiar logo del cliente a /public
cp logos/cliente1-logo.svg public/logo-empresa.svg

# 3. Build para ese cliente
npm run build

# 4. Los archivos en /dist tendrán el branding del cliente
# 5. Repetir para cada cliente con sus archivos .env y logos
```

---

## 📂 Estructura de Archivos

```
gestiva-frontend/
├── .env.example                   ← Archivo de ejemplo (copiar a .env.local)
├── .env.local                     ← Configuración local (NO se sube a git)
├── public/
│   └── logo-empresa.svg          ← Coloca tu logo aquí
│
└── src/
    └── config/
        └── branding.ts            ← Lee variables de entorno
```

---

## 🎨 Vista Previa

### Desktop Sidebar:
```
┌─────────────────┐
│   [Tu Logo]     │ ← Logo de empresa (64x64px)
│                 │
│  TU EMPRESA     │ ← Nombre de empresa (pequeño)
│    Gestiva      │ ← Nombre de la app (grande)
│  Gestiva    │ ← Subtítulo (pequeño)
└─────────────────┘
```

### Mobile Drawer:
```
┌─────────────────────┐
│ [Logo] TU EMPRESA   │
│       Gestiva       │
│     Gestiva     │
└─────────────────────┘
```

---

## ✅ Checklist de Personalización

### Con Variables de Entorno (Recomendado):
- [ ] Archivo `.env.local` creado desde `.env.example`
- [ ] Variable `VITE_COMPANY_NAME` configurada
- [ ] Variable `VITE_COMPANY_LOGO_PATH` configurada
- [ ] Logo colocado en `/public` con el nombre correcto
- [ ] Servidor de desarrollo reiniciado
- [ ] Cambios verificados en la aplicación

### Sin Variables de Entorno:
- [ ] Logo colocado en `/public/logo-empresa.svg`
- [ ] Archivo `branding.ts` editado
- [ ] Cambios guardados y aplicados

---

## 🆘 Solución de Problemas

### El logo no aparece
- ✅ Verifica que el archivo esté en `/public`
- ✅ Verifica que el nombre del archivo coincida con `logoPath`
- ✅ Verifica el formato (SVG, PNG, JPG)
- ✅ Revisa la consola del navegador para errores

### El logo se ve borroso
- ✅ Usa formato SVG para mejor calidad
- ✅ Asegúrate de tener suficiente resolución (mínimo 64x64px)

### El nombre no cambia
- ✅ Verifica que guardaste el archivo `.env.local`
- ✅ **IMPORTANTE**: Reinicia el servidor de desarrollo después de cambiar variables de entorno
- ✅ Verifica que las variables comiencen con `VITE_`
- ✅ Recarga la página (F5)
- ✅ Si usas código, verifica que guardaste `branding.ts`

---

## 📞 Soporte

Si tienes problemas con la personalización, revisa:
1. La consola del navegador (F12)
2. Los logs del servidor de desarrollo
3. El archivo `src/config/branding.ts` para errores de sintaxis

---

¡Listo! Tu aplicación ahora tiene el branding de tu empresa. 🎉

