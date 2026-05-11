# Reporte de seguridad — MateMagia

Última actualización: 2026-05-10 · Auditoría inicial + remediación.

Este documento lista las brechas detectadas en la auditoría, su severidad y
qué se hizo para cerrarlas. Está pensado como historial verificable, no como
documentación de uso (ver `docs/RLS-POLICIES.md` y `docs/ANDROID-BUILD.md`).

## Resumen

| # | Hallazgo                                                              | Severidad | Estado     |
|---|-----------------------------------------------------------------------|-----------|------------|
| 1 | Registro abierto sin allowlist (beta)                                 | Alta      | Cerrado    |
| 2 | Lectura de perfiles de otros usuarios por correo                      | Alta      | Cerrado    |
| 3 | Vinculación padre↔hijo dependía de conocer el correo del menor        | Media     | Cerrado    |
| 4 | Código de vinculación del apoderado generado en cliente y descartado  | Media     | Cerrado    |
| 5 | Sin escaneo de secretos ni SAST en el repositorio                     | Media     | Cerrado    |
| 6 | Deep-links de la SPA caían en 404 en GitHub Pages                     | Baja      | Cerrado    |
| 7 | Sin respaldo automático de la base de datos                           | Media     | Skeleton (1) |
| 8 | Web View Android permitía contenido mixto                             | Baja      | Cerrado    |

(1) El workflow `db-backup.yml` está listo; faltan los secrets `SUPABASE_DB_*`
y `BACKUP_GPG_PUBLIC_KEY` en GitHub para activarlo.

---

## Detalle por hallazgo

### 1. Registro abierto sin allowlist (beta cerrada)

**Antes.** Cualquiera podía crear una cuenta vía `supabase.auth.signUp`.
Para una app dirigida a menores en fase beta, eso es inaceptable.

**Remediación.**
- Nueva tabla `public.beta_allowlist` con RLS bloqueando lectura/escritura
  directa.
- RPC `is_email_allowed(email)` en modo `SECURITY DEFINER` para preflight
  del cliente.
- El trigger `handle_new_user` ahora valida la allowlist y lanza
  `BETA_NOT_ALLOWED` si el correo no está autorizado.
- Defensa en profundidad: si el cliente se saltara la preflight, el trigger
  igual revierte la creación del usuario.
- Los usuarios ya registrados se "grandfatheraron" automáticamente en la
  migración.

Para invitar a alguien:

```sql
INSERT INTO public.beta_allowlist (email, note)
VALUES ('correo@ejemplo.com', 'invitado por X');
```

### 2. Lectura de perfiles ajenos

**Antes.** La política RLS `Profiles searchable by authenticated` permitía
a cualquier usuario autenticado leer **toda** la tabla `profiles`. Eso
exponía nombre completo, avatar y correo de todos los menores a cualquier
otra cuenta.

**Remediación.**
- Política eliminada en la migración.
- Todas las lecturas cross-usuario pasan ahora por funciones
  `SECURITY DEFINER`: `my_linked_partners()`, `my_children_progress()`,
  `link_by_invite_code()`, `unlink_partner()`.
- Estas RPCs solo devuelven datos de partners ya vinculados.

### 3. Vinculación dependía del correo del estudiante

**Antes.** Para vincularse, el apoderado debía conocer el correo exacto
registrado del estudiante. Eso forzaba al menor a compartir su correo
con personas externas y permitía probing de cuentas (`SELECT id FROM
profiles WHERE email = ?`).

**Remediación.**
- RPC `link_by_invite_code(code)` bidireccional: detecta el rol del usuario
  autenticado y el del dueño del código, valida que no sean del mismo rol,
  y crea el `parent_student_links` con `status='accepted'`.
- Tanto el padre como el hijo pueden tener iniciativa: cada uno tiene un
  código `XXX-XXX` único; el otro lo ingresa y queda vinculado.
- El correo del menor nunca circula.

### 4. Código de invitación falso en la pantalla de onboarding del padre

**Antes.** `AssessmentPage` mostraba al apoderado un código generado con
`Math.random().toString(36)…` que **no se persistía**. El estudiante no
tenía dónde ingresarlo. Era un placebo.

**Remediación.**
- El paso "parent_setup" ya no genera código; redirige al panel donde sí se
  ve el código real.
- El código real proviene de `user_progress.invite_code`, generado por la
  función `generate_invite_code()` en el trigger `handle_new_user`.

### 5. Sin escaneo de secretos ni SAST

**Antes.** El repositorio no tenía gitleaks, CodeQL ni `npm audit`
automatizados.

**Remediación.** `.github/workflows/security.yml`:
- `gitleaks-action@v2` corre en cada push y PR (allowlist en
  `.gitleaks.toml` para el anon key público).
- `github/codeql-action` con la query suite `security-and-quality` para
  JS/TS.
- `npm audit --audit-level=high --production` semanal.
- Permisos mínimos: `contents: read`, `security-events: write`,
  `pull-requests: read`.

### 6. SPA 404 en GitHub Pages

**Antes.** Cualquier deep-link (`/profile`, `/lesson/...`) tras un refresh
o compartido por enlace caía en la página 404 de GH Pages.

**Remediación.** `public/404.html` rebota a `index.html` con la ruta
codificada en query string. `index.html` reescribe el history antes de
montar React.

### 7. Sin respaldos

**Antes.** Toda la base de datos vivía solo en Supabase. Una eliminación
accidental o un compromiso de cuenta no tenía vía de recuperación
independiente.

**Remediación parcial.** `.github/workflows/db-backup.yml` corre `pg_dump`
semanal, lo cifra con GPG (clave pública del propietario) y empuja a la
rama `backups` del repo. Solo el propietario con la clave privada puede
descifrar.

**Pendiente.** Configurar en GitHub estos secrets:
`SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_USER`,
`SUPABASE_DB_PASSWORD`, `SUPABASE_DB_NAME`, `BACKUP_GPG_RECIPIENT`,
`BACKUP_GPG_PUBLIC_KEY`.

### 8. Configuración Capacitor laxa

**Antes.** Sin sección `android` en `capacitor.config.json`. Por defecto,
`allowMixedContent` queda en `true` y `webContentsDebuggingEnabled` activo
en debug.

**Remediación.** Configuración explícita en `capacitor.config.json`:
- `allowMixedContent: false`
- `captureInput: true`
- `webContentsDebuggingEnabled: false`
- `androidScheme: "https"` (ya estaba)

---

## Próximos pasos sugeridos

- **Anonimización**: actualmente `student_name` se almacena en claro. Para
  cumplir mejor con Ley 21.628 (datos personales) considerar guardar solo
  el primer nombre o un alias elegido por el menor.
- **Cifrado a nivel de aplicación** para `student_name` y `parent_email`
  usando `pgsodium` (si Supabase lo soporta en el plan actual).
- **Reauth para acciones críticas**: borrar cuenta, cambiar correo, romper
  vinculación, requerir reingreso de contraseña.
- **Pruebas de auth**: tests automatizados que verifiquen que un usuario
  no puede leer datos de otro (regresión sobre el hallazgo #2).
- **Email enumeration**: la RPC `is_email_allowed` permite saber si un
  correo está invitado. Mitigación: agregar rate limiting via
  `pg_throttle` o un proxy edge function.
- **Política de retención**: definir cuánto tiempo se guardan los
  `exercise_attempts` y `math_chat`.
