/**
 * Configuración de Branding de la Aplicación
 * 
 * Esta configuración lee valores de variables de entorno para personalización
 * según el cliente al que se le venda el software.
 * 
 * Las variables de entorno se configuran en el archivo .env.local o .env
 * 
 * IMPORTANTE: En Vite, las variables de entorno deben comenzar con VITE_
 * para estar disponibles en el cliente.
 */

export const brandingConfig = {
  // Nombre de la empresa (se muestra como texto debajo del logo)
  // Variable de entorno: VITE_COMPANY_NAME
  // Valor por defecto: 'Tu Empresa' (si no se define la variable)
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Tu Empresa',
  
  // Nombre de la aplicación (se muestra como título principal)
  // Variable de entorno: VITE_APP_NAME
  // Valor por defecto: 'Gestiva'
  appName: import.meta.env.VITE_APP_NAME || 'Gestiva',
  
  // Subtítulo de la aplicación
  // Variable de entorno: VITE_APP_SUBTITLE
  // Valor por defecto: 'Gestiva'
  appSubtitle: import.meta.env.VITE_APP_SUBTITLE || 'Gestiva',
  
  // Ruta del logo de la empresa (ubicado en /public)
  // Variable de entorno: VITE_COMPANY_LOGO_PATH
  // Valor por defecto: '/logo-empresa.svg'
  // Formato recomendado: SVG, PNG o JPG
  // Tamaño recomendado: 64x64px o mayor (se escalará automáticamente)
  logoPath: import.meta.env.VITE_COMPANY_LOGO_PATH || '/logo-empresa.svg',
  
  // Texto alternativo para accesibilidad del logo
  // Variable de entorno: VITE_COMPANY_LOGO_ALT
  // Valor por defecto: 'Logo de la empresa'
  logoAlt: import.meta.env.VITE_COMPANY_LOGO_ALT || 'Logo de la empresa',
};

/**
 * Para cambiar el logo:
 * 1. Coloca tu archivo de logo en la carpeta /public
 * 2. Actualiza 'logoPath' arriba con el nombre de tu archivo
 *    Ejemplo: '/mi-logo.svg' o '/logo-empresa.png'
 * 
 * Formatos soportados:
 * - SVG (recomendado - escalable y de alta calidad)
 * - PNG (con fondo transparente)
 * - JPG (si no necesitas transparencia)
 * 
 * Si no proporcionas un logo, se mostrará un placeholder elegante
 * con un ícono de tienda Material Design.
 */

