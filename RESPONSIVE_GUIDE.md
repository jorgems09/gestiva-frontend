# Guía de Desarrollo Responsive - Gestiva

## 📱 **REGLA DE ORO**

**TODO cambio de UI DEBE soportar tanto Desktop como Móvil**

---

## ✅ **Checklist Obligatorio para Cualquier Cambio de UI**

Antes de considerar completado cualquier cambio de UI, verifica:

- [ ] **Desktop funciona** (1920px, 1366px, 1024px)
- [ ] **Tablet funciona** (768px)
- [ ] **Móvil funciona** (480px, 375px)
- [ ] **Usa variables CSS** (NO colores hardcodeados)
- [ ] **Media queries implementadas** (`@media (max-width: 768px)`)
- [ ] **Touch targets >44px** en móvil
- [ ] **Texto legible** (min 14px en móvil)
- [ ] **Bottom navigation accesible** (no obstruida)

---

## 🎨 **Variables CSS - Uso Correcto**

### ✅ **SIEMPRE Usar:**

```css
/* Colores sólidos */
color: var(--color-primary);
background: var(--color-primary);
border-color: var(--color-primary);

/* Colores con transparencia */
background: var(--color-primary-alpha-10);
border-color: var(--color-primary-alpha-50);
box-shadow: 0 0 0 3px var(--color-primary-alpha-10);
```

### ❌ **NUNCA Usar:**

```css
/* ❌ Colores fijos */
color: #2b6cee;
background: #2b6cee;

/* ❌ RGBA hardcodeado */
background: rgba(43, 108, 238, 0.1);
border-color: rgba(43, 108, 238, 0.5);
```

---

## 📐 **Media Queries Estándar**

### **Breakpoints Oficiales:**

```css
/* Mobile First - Mínimo */
/* Estilos base para móvil */

/* Tablet y Desktop */
@media (min-width: 769px) {
  /* Estilos para pantallas medianas y grandes */
}

/* Desktop only */
@media (min-width: 1024px) {
  /* Estilos solo para desktop */
}

/* Mobile only (menos usado) */
@media (max-width: 768px) {
  /* Ajustes específicos para móvil */
}

/* Móvil pequeño */
@media (max-width: 480px) {
  /* Ajustes para móviles pequeños */
}
```

### **Ejemplo Completo:**

```css
/* Base: Móvil (375px+) */
.button {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
}

/* Tablet (768px+) */
@media (min-width: 769px) {
  .button {
    width: auto;
    padding: 10px 20px;
    font-size: 14px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .button {
    padding: 12px 24px;
    font-size: 16px;
  }
}
```

---

## 🎯 **Patrones Responsive Comunes**

### 1. **Botones**

```css
/* Móvil: Ancho completo */
.button {
  width: 100%;
  height: 48px; /* Touch target mínimo */
}

/* Desktop: Ancho automático */
@media (min-width: 769px) {
  .button {
    width: auto;
    min-width: 120px;
  }
}
```

### 2. **Formularios**

```css
/* Móvil: Stack vertical */
.form-row {
  flex-direction: column;
  gap: 12px;
}

/* Desktop: Horizontal */
@media (min-width: 769px) {
  .form-row {
    flex-direction: row;
    gap: 16px;
  }
}
```

### 3. **Grids**

```css
/* Móvil: 1 columna */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet: 2 columnas */
@media (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3-4 columnas */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
```

### 4. **Tablas**

```css
/* Móvil: Scroll horizontal */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  min-width: 600px; /* Fuerza scroll en móvil */
}

/* Desktop: Sin scroll */
@media (min-width: 769px) {
  .table-container {
    overflow-x: visible;
  }
  
  .table {
    min-width: auto;
  }
}
```

---

## 📏 **Tamaños Mínimos**

### **Touch Targets (Móvil)**
```css
/* Botones, links, inputs */
min-height: 44px; /* iOS */
min-width: 44px;  /* Recomendado Apple */
```

### **Tipografía**
```css
/* Móvil */
font-size: 14px; /* Mínimo para legibilidad */
line-height: 1.5;

/* Desktop */
font-size: 16px; /* Base */
```

### **Espaciado**
```css
/* Móvil: Espacios reducidos */
padding: var(--spacing-md); /* 16px */
gap: var(--spacing-sm); /* 8px */

/* Desktop: Espacios amplios */
@media (min-width: 769px) {
  padding: var(--spacing-xl); /* 32px */
  gap: var(--spacing-md); /* 16px */
}
```

---

## 🚫 **Errores Comunes a Evitar**

### ❌ **1. Colores Hardcodeados**
```css
/* MAL */
background: #2b6cee;
border: 1px solid rgba(43, 108, 238, 0.5);

/* BIEN */
background: var(--color-primary);
border: 1px solid var(--color-primary-alpha-50);
```

### ❌ **2. Botones Pequeños en Móvil**
```css
/* MAL - Difícil de tocar */
.button {
  height: 32px;
  padding: 4px 8px;
}

/* BIEN - Fácil de tocar */
.button {
  height: 48px;
  padding: 12px 16px;
}
```

### ❌ **3. Texto Ilegible en Móvil**
```css
/* MAL */
font-size: 12px;
line-height: 1.2;

/* BIEN */
font-size: 14px;
line-height: 1.5;
```

### ❌ **4. Contenido Oculto por Bottom Nav**
```css
/* MAL - Se oculta detrás de la navegación */
.content {
  padding-bottom: 16px;
}

/* BIEN - Espacio para bottom nav */
.content {
  padding-bottom: calc(80px + 16px); /* altura nav + padding */
}
```

### ❌ **5. Sin Media Queries**
```css
/* MAL - Solo desktop */
.container {
  width: 1200px;
  margin: 0 auto;
}

/* BIEN - Responsive */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
```

---

## 🎨 **Variables CSS Disponibles**

### **Colores Sólidos**
```css
--color-primary
--color-primary-dark
--color-primary-light
--color-primary-lighter
--color-bg
--color-surface
--color-text
--color-text-secondary
--color-border
```

### **Colores con Transparencia**
```css
--color-primary-alpha-10  /* rgba(primary, 0.1) */
--color-primary-alpha-20  /* rgba(primary, 0.2) */
--color-primary-alpha-30  /* rgba(primary, 0.3) */
--color-primary-alpha-50  /* rgba(primary, 0.5) */
--color-primary-alpha-90  /* rgba(primary, 0.9) */
```

### **Espaciado**
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

### **Border Radius**
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

---

## 🔍 **Testing Checklist**

Antes de aprobar cualquier cambio de UI:

### **1. Visual Testing**
- [ ] Chrome DevTools Responsive Mode
- [ ] iPhone SE (375px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

### **2. Interacción Testing**
- [ ] Botones fáciles de tocar
- [ ] Formularios usables
- [ ] Scroll suave
- [ ] No content oculto

### **3. Temas Testing**
- [ ] Azul Profesional ✓
- [ ] Verde Fresco ✓
- [ ] Morado Elegante ✓
- [ ] Naranja Energía ✓
- [ ] Modo Oscuro ✓
- [ ] Rosa Suave ✓

### **4. Build Testing**
```bash
npm run build
# Debe compilar sin errores
```

---

## 📚 **Recursos**

### **Herramientas DevTools**
1. Chrome DevTools → Device Mode (Cmd/Ctrl + Shift + M)
2. Responsive Design Mode (375px, 768px, 1920px)
3. Emular iPhone, iPad

### **Extensiones Útiles**
- Mobile Simulator
- Responsive Viewer
- PerfectPixel

---

## ✅ **Resumen**

**REGLAS DE ORO:**

1. 🎨 **SIEMPRE usar variables CSS** (`var(--color-primary)`)
2. 📱 **SIEMPRE incluir media queries** (`@media (max-width: 768px)`)
3. 👆 **Touch targets mínimo 44px** en móvil
4. 📝 **Texto legible mínimo 14px** en móvil
5. 🧪 **Probar en móvil Y desktop** antes de commit
6. 🎭 **Probar en TODOS los temas** disponibles

**Si no cumple estos 6 puntos, NO está listo para producción.**

---

*Última actualización: Noviembre 2025*
*Versión: 1.0.0*

