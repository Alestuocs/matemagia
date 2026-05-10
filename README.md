# MateMagia ✨

Aplicación educativa de matemáticas para estudiantes de 1ro a 6to básico en Chile.

## Características

- Login con Google via Supabase Auth
- Evaluación inicial para determinar el nivel del estudiante
- Currículo alineado al programa chileno de 1ro a 6to básico (23 temas)
- Explicaciones paso a paso para cada ejercicio
- Retroalimentación empática cuando hay errores
- Seguimiento de XP, rachas y metas diarias
- 20+ logros y celebraciones con confetti
- 3 mini-juegos de práctica
- Diseño mobile-first y colorido
- Funciona offline con localStorage como respaldo

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/matemagia.git
cd matemagia
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y agrega tu clave anónima de Supabase:

```
VITE_SUPABASE_URL=https://abdvoipoewiuneabxyqb.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 3. Instalar dependencias y ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173/matemagia/ en tu navegador.

## Configuración de Supabase

### 1. Ejecutar el esquema SQL

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase/schema.sql`
4. Haz clic en **Run**

### 2. Habilitar autenticación con Google

1. En Supabase, ve a **Authentication → Providers**
2. Habilita **Google**
3. Crea credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com):
   - Tipo de aplicación: **Aplicación web**
   - Origen autorizado: `https://abdvoipoewiuneabxyqb.supabase.co`
   - URI de redirección: `https://abdvoipoewiuneabxyqb.supabase.co/auth/v1/callback`
4. Copia el Client ID y Client Secret a Supabase

### 3. Configurar Redirect URLs

En Supabase → Authentication → URL Configuration, agrega:
```
https://TU_USUARIO.github.io/matemagia/
http://localhost:5173/matemagia/
```

## Despliegue en GitHub Pages

### 1. Configurar GitHub Secrets

En tu repositorio de GitHub → Settings → Secrets and variables → Actions:

- `VITE_SUPABASE_URL` = `https://abdvoipoewiuneabxyqb.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = tu clave anónima

### 2. Habilitar GitHub Pages

- Settings → Pages
- Source: **Deploy from a branch**
- Branch: `gh-pages`

### 3. Hacer push a main

```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

GitHub Actions se encargará del build y deploy automáticamente.

### Despliegue manual

```bash
npm run build
npm run deploy
```

## Empaquetar como APK con Capacitor (opcional)

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Inicializar
npx cap init MateMagia com.matemagia.app --web-dir=dist

# Build web
npm run build

# Agregar Android
npx cap add android

# Sincronizar
npx cap sync

# Abrir Android Studio
npx cap open android
```

En Android Studio: Build → Generate Signed Bundle / APK

## Estructura del proyecto

```
src/
├── lib/
│   ├── supabase.js       # Cliente Supabase
│   └── curriculum.js     # 23 temas con generadores de ejercicios
├── contexts/
│   ├── AuthContext.jsx   # Autenticación
│   └── ProgressContext.jsx # Progreso del estudiante
├── pages/
│   ├── LoginPage.jsx
│   ├── AssessmentPage.jsx
│   ├── Dashboard.jsx
│   ├── CurriculumMap.jsx
│   ├── LessonPage.jsx
│   ├── GamesHub.jsx
│   ├── AchievementsPage.jsx
│   └── ProfilePage.jsx
└── components/
    ├── lessons/
    │   ├── ExerciseEngine.jsx
    │   ├── LessonSlide.jsx
    │   ├── StepByStep.jsx
    │   └── FeedbackPanel.jsx
    ├── ui/
    │   ├── Celebration.jsx
    │   ├── XPBar.jsx
    │   └── StreakBadge.jsx
    └── layout/
        ├── BottomNav.jsx
        └── TopBar.jsx
```

## Currículo cubierto

| Grado | Temas |
|-------|-------|
| 1ro Básico | Números 0-10, 11-20, 0-100, Comparación, Suma simple, Resta simple |
| 2do Básico | Suma hasta 100, Resta hasta 100, Suma con llevada, Resta con préstamo |
| 3ro Básico | Números hasta 1.000, Tablas 1-5, Tablas 6-10, División exacta |
| 4to Básico | Números hasta 10.000, Multiplicación 2 dígitos, División con resto |
| 5to Básico | Fracciones básicas, Fracciones equivalentes, Decimales, Operaciones decimales |
| 6to Básico | Porcentajes, Resolución de problemas |
