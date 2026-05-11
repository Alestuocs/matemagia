# Paso a paso — lo que falta de tu mano

Todo el código y la infraestructura está desplegado. Esto es lo único
que necesita acción tuya (no puedo hacerlo por ti porque requiere tus
credenciales o tu decisión).

## 1. Invitar a alguien al beta (2 minutos)

Cuando quieras dar acceso a una persona nueva:

1. Abre el SQL Editor de Supabase: <https://supabase.com/dashboard/project/abdvoipoewiuneabxyqb/sql/new>
2. Pega y ejecuta:

```sql
INSERT INTO public.beta_allowlist (email, note)
VALUES ('correo@ejemplo.com', 'invitado por Manuel');
```

3. Listo. Esa persona ya puede crear cuenta en <https://alestuocs.github.io/matemagia/>.

Para ver quién está invitado:

```sql
SELECT email, note, added_at FROM public.beta_allowlist ORDER BY added_at DESC;
```

Para sacar a alguien (no borra su cuenta existente, solo evita re-registro):

```sql
DELETE FROM public.beta_allowlist WHERE email = 'correo@ejemplo.com';
```

## 2. Descargar el APK (5 minutos)

Ya disparé el build del APK por ti. Cuando termine:

1. Ve a <https://github.com/Alestuocs/matemagia/actions/workflows/android-apk.yml>
2. Entra al último run (debería estar verde)
3. Al final de la página verás **Artifacts → matemagia-debug-apk**
4. Descárgalo. Es un `.zip` con `app-debug.apk` adentro.
5. Instálalo en tu Android: abre el .apk desde el celular, autoriza "instalar de fuentes desconocidas".

> Para builds futuros, en la misma página haz clic en **Run workflow → Run workflow**.
> Para releases firmados, haz `git tag v0.x.y && git push --tags`.

## 3. Activar el backup semanal de la base de datos (10 minutos)

El workflow `db-backup.yml` ya está listo, pero necesita 7 secrets en
GitHub para arrancar. Sin esto, el backup no corre (no rompe nada, solo
no respalda).

### 3a. Generar tu par de claves GPG (una vez)

En tu terminal:

```bash
brew install gnupg 2>/dev/null   # si no lo tienes
gpg --full-generate-key
# Elige:
#   1) RSA and RSA
#   4096 bits
#   sin expiración (0)
#   Nombre: Manuel MateMagia
#   Email: el tuyo
#   Passphrase: una larga y segura, anótala
```

Exporta la clave pública (esta sí se sube a GitHub):

```bash
gpg --armor --export tu@correo.com > matemagia-backup-pub.asc
cat matemagia-backup-pub.asc
```

Guarda la clave privada en un lugar seguro (un gestor de contraseñas):

```bash
gpg --armor --export-secret-keys tu@correo.com > matemagia-backup-priv.asc
# Guarda este archivo en 1Password / Bitwarden / similar. NO en el repo.
```

### 3b. Obtener la contraseña de la DB de Supabase

1. Ve a <https://supabase.com/dashboard/project/abdvoipoewiuneabxyqb/settings/database>
2. En la sección **Connection string** elige **Session pooler** (modo Postgres)
3. Anota los valores; típicamente:
   - host: `aws-0-us-east-1.pooler.supabase.com`
   - port: `5432`
   - user: `postgres.abdvoipoewiuneabxyqb`
   - database: `postgres`
   - password: la "Database password" del proyecto (la generaste cuando lo creaste; si la perdiste, usa el botón **Reset database password**)

### 3c. Agregar los secrets a GitHub

Ve a <https://github.com/Alestuocs/matemagia/settings/secrets/actions>

Haz clic en **New repository secret** y crea uno por uno:

| Nombre                  | Valor                                                |
|-------------------------|------------------------------------------------------|
| `SUPABASE_DB_HOST`      | `aws-0-us-east-1.pooler.supabase.com` (lo que viste) |
| `SUPABASE_DB_PORT`      | `5432`                                               |
| `SUPABASE_DB_USER`      | `postgres.abdvoipoewiuneabxyqb`                      |
| `SUPABASE_DB_PASSWORD`  | tu password de la DB                                 |
| `SUPABASE_DB_NAME`      | `postgres`                                           |
| `BACKUP_GPG_RECIPIENT`  | el email con el que generaste la GPG                 |
| `BACKUP_GPG_PUBLIC_KEY` | contenido completo de `matemagia-backup-pub.asc`     |

### 3d. Probar el backup manualmente

1. Ve a <https://github.com/Alestuocs/matemagia/actions/workflows/db-backup.yml>
2. Click **Run workflow → Run workflow**
3. Espera ~2 minutos
4. Si sale verde, en la rama `backups` aparecerá `snapshots/matemagia-YYYY-MM-DDT…sql.gpg`

A partir de ahí, cada domingo se respalda solo.

### 3e. Cómo restaurar (si algún día lo necesitas)

```bash
# Clona la rama backups:
git clone -b backups https://github.com/Alestuocs/matemagia.git matemagia-backups
cd matemagia-backups/snapshots

# Descifrar el último:
ls -t *.gpg | head -1 | xargs gpg --decrypt > restore.sql

# Aplicar contra una DB de staging primero:
psql "postgres://user:pass@host:5432/staging_db" -f restore.sql
```

## 4. (Opcional) Compilar el APK localmente

Si prefieres no usar GitHub Actions:

```bash
# Requisitos: Node 20+, JDK 17, Android Studio
cd /ruta/al/repo
npm ci
npm run android:init   # solo la primera vez — crea android/
npm run android:apk    # produce el APK
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Para abrir Android Studio en lugar de compilar por CLI:

```bash
npm run android:open
```

## 5. Para subir el APK a Google Play (cuando estés listo)

Esto sí o sí lo tienes que hacer tú (necesita tu cuenta de Google Play
y tu keystore). Guía oficial:

<https://capacitorjs.com/docs/v6/android/deploying-to-google-play>

Resumen:

```bash
# Generar keystore (una sola vez):
keytool -genkey -v -keystore matemagia.keystore \
  -alias matemagia -keyalg RSA -keysize 2048 -validity 10000
# Guarda matemagia.keystore y el password en un lugar seguro.

# Firmar:
cd android
./gradlew bundleRelease   # produce app-release.aab para Google Play
```

---

## Cosas que ya hice por ti y NO requieren tu acción

- Base de datos migrada (beta_allowlist, RPCs de linking, RLS endurecidas)
- 4 usuarios actuales "grandfathered" en el allowlist
- Capa cliente desplegada (commit `9797d5d` en `main`)
- Workflows configurados (`security.yml`, `db-backup.yml`, `android-apk.yml`)
- Documentación completa en `docs/`
