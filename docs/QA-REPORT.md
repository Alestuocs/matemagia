# QA Report — MateMagia · iteración 2026-05-11

Recorrido completo del producto con foco en lo que ya cumple "calidad
suscripción" vs lo que todavía hace falta para llegar ahí.

## ✅ Lo que ya está sólido

### Persistencia
- Toda escritura a `user_progress` usa `{ onConflict: 'user_id' }` y la
  tabla tiene un UNIQUE en `user_id`. Imposible crear filas duplicadas.
- `loadFromSupabase` no escribe a la DB en caso de error de red/RLS:
  conserva el estado en memoria.
- Si no existe la fila, hace bootstrap (upsert vacío) + re-read en vez
  de dejar la UI en defaults vacíos (lo que antes mandaba al usuario de
  vuelta al onboarding).
- El reset diario de streak/contadores ahora corre **después** del sync
  y persiste a la DB.
- Trigger `handle_new_user` crea profile + user_progress + invite_code
  automáticamente al registrarse.
- Los datos viven en Supabase; localStorage es solo cache para el
  primer paint y se rehidrata desde la DB inmediatamente al iniciar.

### Seguridad
- Beta cerrada con `beta_allowlist`. Doble enforcement (RPC preflight +
  trigger BD).
- RLS sobre todas las tablas. Las RPC `SECURITY DEFINER` controlan el
  cross-user (linking, lectura del progreso del hijo).
- Eliminado el leak "Profiles searchable by authenticated".
- gitleaks + CodeQL + npm audit corren en cada push.

### Pedagogía (versión actual)
- Sistema de niveles 1-5 por tema con persistencia en `user_progress.topic_levels`.
- "Practicar más" sube de nivel si la precisión fue ≥70%, cap en 5.
- Modo Repaso para grados anteriores: 5 ejercicios rápidos sin intro.
- Modo Currículo: 10 ejercicios, intro + slides + tips antes de practicar.
- Reconocimiento de la pregunta con TTS (Web Speech, voz es-CL).
- Pizarra (canvas) para que el niño calcule a mano.
- Explicación paso a paso (componente `StepByStep`) tras respuesta incorrecta.
- Generador de ejercicios procedural por tema (infinitos ejercicios
  distintos por tema).

### Vinculación familiar
- Código único `XXX-XXX` por usuario. Vinculación bidireccional vía RPC
  `link_by_invite_code`.
- Padres ven el progreso de sus hijos vía RPC `my_children_progress`
  (no necesitan email del menor).
- Prompt "¿tienes un apoderado?" recurrente para estudiantes sin uno
  vinculado (re-prompt semanal).
- Prompt anual de cambio de grado en diciembre-febrero que desbloquea
  los nuevos temas automáticamente.

### Infraestructura
- Despliegue web en GitHub Pages (CI automático en `main`).
- APK Android via Capacitor + workflow GH Actions con artifact (run
  manual o por tag).
- Backup semanal de la DB (cifrado GPG, rama `backups`).
- SPA-fallback 404 para deep-links que sobreviven al refresh.

## 🟡 Lo que falta para "calidad suscripción"

### Pedagogía
- **Niveles 1-5 implementados solo para 4 temas** (suma simple, resta
  simple, multiplicación 1-5, suma carry). Los otros 69 temas aún
  reciben el parámetro `level` pero lo ignoran. Trabajo restante:
  generar plantillas de progresión para los 69 temas restantes (~6h).
- **Solver del tutor** (mathTutor.js) podría usar el nivel actual del
  estudiante para ajustar el lenguaje y la profundidad de la
  explicación.
- **Tutorial interactivo paso a paso** al iniciar un tema nuevo: hoy
  son `lessonSlides` estáticos. Un Duolingo-style "tap to reveal" daría
  mejor enganche. (~8h)
- **Ejercicios contextuales por unidad**: el tema "perímetros" podría
  generar problemas con dibujos SVG en vez de solo texto. (~12h)

### Gamificación
- **Logros** se evalúan client-side. Mover a trigger PL/pgSQL daría
  consistencia y permitiría desafíos temporales (logro del mes).
- **Liga / ranking semanal** entre amigos vinculados (estilo Duolingo
  Leagues).
- **Cofres / recompensas semanales** que destrabamen avatares o
  fondos del mapa.
- **Racha de fuego visible y notificaciones** para no perderla
  (web-push, requiere infra adicional).

### UX
- **GeoGebra embebido** para 5°-8° (geometría dinámica). Es la
  diferenciación clara contra Khan Academy Kids.
- **Animaciones Lottie** en aciertos y subidas de nivel.
- **Modo daltónico** + **Modo oscuro**.
- **Avatar personalizable** del estudiante.

### Suscripción
- **Tier gratis** (e.g. 5 temas, 10 ejercicios/día) vs **Premium**
  (todo + pizarra + tutor IA + estadísticas avanzadas para padres).
- **Stripe Checkout** + tabla `subscriptions` en Supabase.
- **Webhook de Stripe → Edge Function** para activar/desactivar el
  plan. (Supabase Edge Functions son gratis hasta 500K invocaciones).
- **Reportes semanales por email** al apoderado (Supabase + Resend).

### Operaciones
- **Telemetría privada**: solo eventos agregados (tema iniciado,
  ejercicio resuelto, nivel subido). Sin PII de menores. Posthog
  self-hosted o un endpoint propio.
- **A/B testing framework** para iterar plantillas de ejercicios.
- **Modo offline real**: PWA con Service Worker que cachee el bundle
  y los ejercicios generados localmente.

## 📈 Roadmap sugerido para llegar a suscripción

| Sprint | Foco | Entregable |
|--------|------|------------|
| 1 (1 sem) | Niveles | Plantillas L1-L5 para los 30 temas más usados (1°-4°) |
| 2 (1 sem) | Tutor | Re-trabajar `mathTutor.js` con nivel + GeoGebra para geometría |
| 3 (1 sem) | Premium gating | Stripe Checkout + tier gating + paywall en pizarra y niveles 4-5 |
| 4 (1 sem) | Engagement | Liga semanal + cofre + notifs locales en APK |
| 5 (1 sem) | Reportes padres | Email semanal + dashboard avanzado en `/parent/insights` |
| 6 (1 sem) | Polish | Lottie, dark mode, daltónico, avatar |

Con eso ya es un producto **vendible**. Cada sprint es ~25-30 h de
trabajo de dev y ~5-10 h de contenido pedagógico.
