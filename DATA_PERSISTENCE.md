# Persistencia de Datos de Personalización

Este documento explica dónde y cómo se almacenan los datos de personalización de la aplicación Gestiva.

## 📍 Ubicación de Persistencia

Todos los datos de personalización se almacenan en el **`localStorage` del navegador** del usuario. Esto significa que:

- ✅ Los datos persisten entre sesiones (no se pierden al cerrar el navegador)
- ✅ Los datos son específicos por dominio y navegador
- ✅ Los datos se almacenan localmente en el dispositivo del usuario
- ⚠️ Si el usuario limpia el `localStorage` o usa modo incógnito, se perderán los datos
- ⚠️ Los datos no se sincronizan entre dispositivos o navegadores

---

## 🎨 Temas de Color

### Clave de Almacenamiento
```
gestiva-theme
```

### Ubicación del Código
- **Hook:** `src/hooks/useTheme.ts`
- **Constante:** `THEME_STORAGE_KEY = 'gestiva-theme'`

### Formato de Datos
**Tipo:** `string` (clave del tema)

**Ejemplo:**
```javascript
localStorage.getItem('gestiva-theme') // "blue" | "green" | "purple" | etc.
```

### Valores Posibles
Los temas disponibles están definidos en `src/config/themes.ts`:
- `blue` (por defecto)
- `green`
- `purple`
- `orange`
- `pink`
- `teal`
- `rose` (Rosa Suave)

### Cómo se Guarda
```typescript
// En useTheme.ts línea 42
localStorage.setItem(THEME_STORAGE_KEY, themeKey);
```

### Cómo se Carga
```typescript
// En useTheme.ts línea 8
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
```

---

## 🏪 Datos del Negocio

### Clave de Almacenamiento
```
gestiva-business-info
```

### Ubicación del Código
- **Hook:** `src/hooks/useBusinessInfo.ts`
- **Constante:** `BUSINESS_INFO_STORAGE_KEY = 'gestiva-business-info'`

### Formato de Datos
**Tipo:** `JSON string` (objeto serializado)

**Estructura:**
```typescript
interface BusinessInfo {
  name: string;        // Nombre del negocio
  nit: string;         // NIT / Identificación
  address: string;     // Dirección
  phone: string;      // Teléfono
  email?: string;      // Email (opcional)
  website?: string;    // Sitio web (opcional)
  logo?: string;      // Logo (opcional, futuro)
}
```

### Ejemplo de Datos Almacenados
```json
{
  "name": "TIENDA FEMENINA",
  "nit": "123456789-0",
  "address": "Calle Principal #123",
  "phone": "(57) 300 123 4567",
  "email": "contacto@tienda.com",
  "website": "www.tienda.com",
  "logo": ""
}
```

### Valores por Defecto
Si no hay datos guardados, se usan estos valores:
```typescript
{
  name: 'TIENDA FEMENINA',
  nit: '123456789-0',
  address: 'Calle Principal #123',
  phone: '(57) 300 123 4567',
  email: '',
  website: '',
  logo: ''
}
```

### Cómo se Guarda
```typescript
// En useBusinessInfo.ts línea 41
localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(updated));
```

### Cómo se Carga
```typescript
// En useBusinessInfo.ts líneas 27-35
const saved = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
if (saved) {
  try {
    return JSON.parse(saved);
  } catch {
    return defaultBusinessInfo;
  }
}
return defaultBusinessInfo;
```

---

## 🔍 Cómo Verificar los Datos en el Navegador

### Chrome / Edge / Brave
1. Abre las **Herramientas de Desarrollador** (F12)
2. Ve a la pestaña **Application** (Aplicación)
3. En el menú lateral, expande **Local Storage**
4. Selecciona tu dominio (ej: `http://localhost:5173`)
5. Verás las claves:
   - `gestiva-theme`
   - `gestiva-business-info`

### Firefox
1. Abre las **Herramientas de Desarrollador** (F12)
2. Ve a la pestaña **Almacenamiento**
3. Expande **Almacenamiento local**
4. Selecciona tu dominio
5. Verás las claves almacenadas

### Safari
1. Abre las **Herramientas de Desarrollador** (⌘⌥I)
2. Ve a la pestaña **Almacenamiento**
3. Expande **Almacenamiento local**
4. Selecciona tu dominio

---

## 🧪 Ejemplo de Consulta Manual

### Ver el Tema Actual
```javascript
// En la consola del navegador
localStorage.getItem('gestiva-theme')
// Resultado: "blue" (o el tema seleccionado)
```

### Ver los Datos del Negocio
```javascript
// En la consola del navegador
JSON.parse(localStorage.getItem('gestiva-business-info'))
// Resultado: { name: "TIENDA FEMENINA", nit: "123456789-0", ... }
```

### Cambiar el Tema Manualmente
```javascript
// En la consola del navegador
localStorage.setItem('gestiva-theme', 'green')
// Luego recarga la página
```

### Cambiar los Datos del Negocio Manualmente
```javascript
// En la consola del navegador
const newData = {
  name: "Mi Nueva Tienda",
  nit: "987654321-0",
  address: "Nueva Dirección #456",
  phone: "(57) 300 987 6543"
};
localStorage.setItem('gestiva-business-info', JSON.stringify(newData))
// Luego recarga la página
```

---

## ⚠️ Consideraciones Importantes

### Limitaciones de localStorage
- **Tamaño máximo:** ~5-10 MB (depende del navegador)
- **Solo strings:** Los objetos deben serializarse con `JSON.stringify()`
- **Específico del dominio:** No se comparte entre diferentes dominios
- **No es seguro:** No debe usarse para datos sensibles

### Limpieza de Datos
Los datos se perderán si:
- El usuario limpia el `localStorage` manualmente
- El usuario usa modo incógnito/privado
- El usuario desactiva el almacenamiento local
- Se ejecuta `localStorage.clear()` en el código

### Migración Futura
Si en el futuro se necesita migrar a una base de datos o backend:
1. Los datos actuales están en `localStorage`
2. Se puede crear un script de migración
3. Se puede mantener `localStorage` como caché local
4. Se puede sincronizar con el backend

---

## 📝 Resumen

| Dato | Clave localStorage | Tipo | Ubicación Código |
|------|-------------------|------|------------------|
| **Tema** | `gestiva-theme` | `string` | `src/hooks/useTheme.ts` |
| **Datos Negocio** | `gestiva-business-info` | `JSON` | `src/hooks/useBusinessInfo.ts` |

---

## 🔄 Flujo de Persistencia

### Temas
```
Usuario selecciona tema → applyTheme() → localStorage.setItem() → CSS variables actualizadas
```

### Datos del Negocio
```
Usuario edita formulario → handleSaveBusinessInfo() → updateBusinessInfo() → localStorage.setItem() → Modal de impresión actualizado
```

---

**Última actualización:** Noviembre 2025

