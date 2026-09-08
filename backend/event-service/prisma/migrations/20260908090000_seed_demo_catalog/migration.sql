-- Requested starter catalog. These are explicitly fictional demo activities.
-- Prisma records this one-time data migration; restarts do not recreate deleted
-- events. Stable IDs and DO NOTHING also preserve edits/capacity on replay.
INSERT INTO "events" (
  "id", "name", "description", "starts_at", "location", "max_capacity",
  "available_slots", "category", "image_url", "updated_at"
)
SELECT
  'f4c83068-7a34-4c87-9cd6-' || lpad(n::text, 12, '0'),
  'Demo · ' || title,
  'Evento de demostración de Event Hub; no corresponde a una actividad real. ' || detail,
  date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + days * INTERVAL '1 day' + INTERVAL '23 hours',
  'Virtual · sala de demostración (sin enlace real)',
  capacity, capacity, category::"EventCategory", NULL,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
FROM (VALUES
  (1, 'Jazz al atardecer', 'Una sesión para descubrir ritmos, instrumentos e improvisación.', 14, 80, 'MUSIC'),
  (2, 'Acuarela para empezar', 'Explora mezclas de color y crea tu primera composición en papel.', 21, 24, 'ART'),
  (3, 'Sabores de Colombia', 'Un recorrido participativo por ingredientes y tradiciones de cocina.', 28, 40, 'FOOD'),
  (4, 'Café de la comunidad', 'Un espacio para compartir ideas y conocer proyectos de otras personas.', 35, 60, 'COMMUNITY'),
  (5, 'Tu primera aplicación web', 'Taller introductorio de interfaces, componentes y experiencias accesibles.', 42, 30, 'WORKSHOP'),
  (6, 'Club de lectura abierto', 'Conversación sobre historias, personajes y nuevas recomendaciones.', 49, 35, 'OTHER'),
  (7, 'Ritmos acústicos', 'Explora el sonido de la guitarra y la creación colectiva de canciones.', 56, 70, 'MUSIC'),
  (8, 'Fotografía con tu móvil', 'Aprende composición, luz y narrativa con recursos cotidianos.', 63, 25, 'ART'),
  (9, 'Pan artesanal en casa', 'Introducción a ingredientes, fermentación y técnicas de amasado.', 70, 32, 'FOOD'),
  (10, 'Ideas para un barrio sostenible', 'Intercambia propuestas sobre reciclaje, espacios verdes y colaboración.', 77, 50, 'COMMUNITY'),
  (11, 'Diseño accesible desde cero', 'Practica jerarquía visual, contraste y navegación por teclado.', 84, 28, 'WORKSHOP'),
  (12, 'Encuentro de juegos de mesa', 'Descubre dinámicas colaborativas y comparte estrategias en grupo.', 91, 48, 'OTHER')
) AS catalog(n, title, detail, days, capacity, category)
ON CONFLICT ("id") DO NOTHING;
