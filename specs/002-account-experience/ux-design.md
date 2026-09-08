# Diseño del dashboard

Conservar Fraunces/Inter, bg-canvas crema, superficies arena, texto marrón oscuro y acentos terracota/oliva de tailwind.config.ts. Verificar contraste: acentos no se usan en texto pequeño si no alcanzan4,5:1; usar variante oscura existente. Lucide, sin fuentes remotas o gráficas sin datos.

## Composición

Máximo1152px. Encabezado “Tu espacio”, saludo y texto breve. Desktop: navegación de cuenta208px y contenido flexible; móvil: enlaces textuales con wrap arriba, sin barra inferior nueva. Mantener AppHeader/Footer.

Dos métricas activas/canceladas; tarjeta destacada próxima participación con bloque fecha/título/ubicación y “Ver inscripción”; hasta3 próximas y enlace a lista completa. Accesos Perfil/Catálogo y Administración solo ADMIN. Una CTA primaria: en vacío “Explorar eventos”.

360px una columna/margen16px; 768px dos columnas donde haya espacio; 1024px navegación lateral. Espaciado8/16/24/32, radio16, sombras existentes discretas y texto base16. Nombres largos ajustan línea, sin truncar acción.

## Estados

Carga con skeleton y espacio reservado; enlaces/perfil independientes siguen operativos. Vacío confirmado muestra0 y orientación. Error muestra “No disponible” y Reintentar, no0. Parcial usa etiquetas para metadata faltante, sin fecha/acción inventada. Boundary hijo conserva shell; raíz independiente ofrece navegación segura sin traza.

Foco3px, targets44px, separación8px, h1 único y h2 por sección, listas semánticas y labels visibles. Estados no solo por color. Transiciones150–200ms de color/opacity, reduced-motion, sin animar layout.

## Revisión

Capturas vacío/contenido/error a360/768/1440, teclado de encabezado a detalle/regreso, zoom200%, reduced-motion, nombre largo/fecha nula/21 registros. ui-ux-pro-max orientó accesibilidad y jerarquía; su landing/paleta/stack móvil genéricos no sustituyen requisitos del dashboard web.
