# Compilar MateMagia como APK (Android)

## Opción A — Build local

Requisitos: Node 20, JDK 17, Android Studio (o SDK + tools).

```bash
# Solo la primera vez en el proyecto:
npm ci
npm run android:init      # crea android/ con Capacitor

# Siempre:
npm run build:android     # build con base path './' y cap sync
npm run android:open      # abre Android Studio para firmar/correr
# O directamente:
npm run android:apk       # genera el APK debug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Opción B — GitHub Actions

El workflow `.github/workflows/android-apk.yml`:

- Se dispara manualmente desde la pestaña **Actions → Build Android APK → Run workflow**
- También corre automáticamente cuando empujas un tag `v*` (ej: `git tag v0.2.0 && git push --tags`)
- Sube el APK como artifact (retención 14 días)

Secrets opcionales pero recomendados:
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (si quieres apuntar a otro
  proyecto de Supabase para el build móvil).

## Configurar el WebView

Editado en `capacitor.config.json`:

- `allowMixedContent: false` — no permitir mezclar `http://` en una page `https://`
- `captureInput: true` — el teclado nativo se comporta mejor en inputs
- `webContentsDebuggingEnabled: false` — apagar Chrome DevTools remoto en release
- `androidScheme: "https"` — el WebView usa `https://localhost/` como origen para que las cookies y storage de Supabase no se rompan

## Notas para producción

- Para subir a Google Play debes firmar un APK **release** (no debug). Sigue
  la guía de Capacitor: <https://capacitorjs.com/docs/v6/android/deploying-to-google-play>
- El package id está definido en `capacitor.config.json` (`cl.matemagia.app`).
- El icono y splash screen usan los assets default de Capacitor; reemplázalos
  en `android/app/src/main/res/` antes del release.
