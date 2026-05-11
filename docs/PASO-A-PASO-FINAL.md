# Paso a paso final — qué falta de tu mano

Estado al cierre de esta sesión:

✅ Bug crítico de pérdida de datos: **arreglado**
✅ Layout responsive (desktop ancho, móvil/tablet en columna): **arreglado**
✅ Modo "Repaso" para grados menores al actual: **arreglado**
✅ Asistente de cambio de grado (diciembre) que desbloquea nuevos temas: **arreglado**
✅ Vinculación bidireccional padre↔hijo por código: **funciona**
✅ Beta cerrada (allowlist): **activa**
✅ Web Speech API en lecciones (1°-3°): **activo**
✅ APK Android: **construido** (4.65 MB, en Actions)
✅ CI seguridad (gitleaks + CodeQL + npm audit): **corre en cada push**

---

## Solo te quedan estos pasos

### Paso 1 — Mergear la PR (30 segundos)

Hay una PR con los arreglos críticos: <https://github.com/Alestuocs/matemagia/pull/2>

1. Abre el enlace
2. Espera que el check de **CodeQL** termine (1-2 min, queda verde)
3. Botón verde **Merge pull request** → **Confirm merge**
4. GitHub Actions desplegará la nueva versión automáticamente (~30 segundos)

### Paso 2 — Forzar refresh del cliente (10 segundos)

Importante: los usuarios que ya usaron la app tienen `localStorage` con
estado viejo. Para que tomen los arreglos sin que pierdas datos:

1. Avísales que abran la app y toquen el botón 🔄 (arriba a la derecha
   del Dashboard) para forzar lectura desde la DB.

O si quieres hacerlo tú mismo en tu navegador:

1. Abre <https://alestuocs.github.io/matemagia/>
2. DevTools (F12) → pestaña **Application** → **Local Storage** →
   selecciona `https://alestuocs.github.io` → click derecho → **Clear**
3. Recarga la página. Tu sesión sigue (es otra storage key) pero el
   `mm_progress` se rehidrata desde la DB.

### Paso 3 — Invitar gente al beta (2 min cada uno)

Ya tienes 4 usuarios "grandfathered":
- alestuocsandroid@gmail.com (Manuel, padre)
- greciaalexandramartino@gmail.com (Grecia, 6° básico)
- mmartino@lemontech.com (Manuel, estudiante)
- malaveperezm@gmail.com (Moisés)

Para invitar más personas:

1. <https://supabase.com/dashboard/project/abdvoipoewiuneabxyqb/sql/new>
2. Pega y ejecuta:

```sql
INSERT INTO public.beta_allowlist (email, note)
VALUES ('correo@nuevo.com', 'invitado el 2026-05-10');
```

3. Esa persona ya puede registrarse en <https://alestuocs.github.io/matemagia/>.

Para ver quién está invitado:

```sql
SELECT email, note, added_at FROM public.beta_allowlist ORDER BY added_at DESC;
```

### Paso 4 — Descargar el APK

1. <https://github.com/Alestuocs/matemagia/actions/workflows/android-apk.yml>
2. Entra al run más reciente (verde)
3. Scroll al final → **Artifacts → matemagia-debug-apk** → descargar
4. Descomprime, instala el `.apk` en tu Android (necesitarás permitir
   "instalar de fuentes desconocidas")

Para regenerarlo en cualquier momento: en esa misma página, botón
**Run workflow → Run workflow**.

### Paso 5 (opcional) — Activar backup semanal

Sin esto el backup no corre, pero tampoco rompe nada. Para activarlo:

1. **Genera tu par GPG** (en tu terminal, una sola vez):

```bash
brew install gnupg 2>/dev/null
gpg --full-generate-key
# 1) RSA and RSA · 4096 bits · sin expiración · tu nombre · tu email · passphrase
gpg --armor --export tu@correo.com > matemagia-backup-pub.asc
gpg --armor --export-secret-keys tu@correo.com > matemagia-backup-priv.asc
# Guarda matemagia-backup-priv.asc en 1Password/Bitwarden. NO en el repo.
cat matemagia-backup-pub.asc   # esto se sube como secret en GitHub
```

2. **Saca los datos de conexión de la DB**:

   <https://supabase.com/dashboard/project/abdvoipoewiuneabxyqb/settings/database>

   Sección **Connection string** → modo **Session pooler**. Anota host,
   port, user, db, password.

3. **Agrega los secrets** en <https://github.com/Alestuocs/matemagia/settings/secrets/actions>

   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_PORT`
   - `SUPABASE_DB_USER`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_DB_NAME`
   - `BACKUP_GPG_RECIPIENT` (tu correo)
   - `BACKUP_GPG_PUBLIC_KEY` (contenido completo de `matemagia-backup-pub.asc`)

4. **Probar**: <https://github.com/Alestuocs/matemagia/actions/workflows/db-backup.yml>
   → **Run workflow → Run workflow**. Si sale verde, en la rama
   `backups` aparece el primer snapshot.

A partir de ahí corre solo cada domingo 05:00 UTC.

### Paso 6 (cuando quieras) — Subir el APK a Google Play

```bash
# Una sola vez: genera tu keystore (¡guárdalo bien!)
keytool -genkey -v -keystore matemagia.keystore \
  -alias matemagia -keyalg RSA -keysize 2048 -validity 10000

# En cada release:
cd android && ./gradlew bundleRelease
# El .aab queda en android/app/build/outputs/bundle/release/
# Súbelo desde https://play.google.com/console
```

Guía completa: <https://capacitorjs.com/docs/v6/android/deploying-to-google-play>

---

## Cosas que YO ya hice (no tienes que tocar)

- Migración SQL aplicada en Supabase (beta_allowlist, RPCs de linking, RLS endurecida)
- Trigger `handle_new_user` enforce-a beta
- Función `link_by_invite_code` bidireccional
- Función `my_linked_partners` y `my_children_progress`
- Workflow APK construido y artifact disponible
- Workflow Security Scan corre en cada push
- Workflow DB Backup configurado (esperando secrets)
- SPA fallback 404 → `index.html` para deep-links
- Layout responsivo + utilidad `.page-shell`
- Modo Repaso para grados menores al actual
- Prompt anual de cambio de grado en diciembre con desbloqueo automático
- Prompt "¿tienes un apoderado?" para niños sin vinculación
- TTS español-chileno para 1°-3° básico

---

## Si algo sale mal

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Avances en 0 tras refresh | localStorage viejo + lectura DB falló | Paso 2 (limpiar localStorage) |
| Código no aparece en Perfil | Mismo motivo | Paso 2 |
| "Mis apoderados → Cargando..." sin fin | RPC con auth caducada | Cerrar sesión y volver a entrar |
| "Beta cerrada" al intentar registrarse | El correo no está en allowlist | Paso 3 |
| APK no instala | "Fuentes desconocidas" no autorizado en Android | Settings → Seguridad → permitir |
| Backup queda en "queued" | Faltan secrets | Paso 5 |
