# Políticas RLS y modelo de datos

Diagrama y reglas actuales después de la migración `2026_05_beta_and_linking.sql`.

## Tablas

```
auth.users  ─┐
             │
             ▼   (trigger handle_new_user)
        ┌────────────────────┐
        │ profiles            │  RLS: solo el dueño lee/edita
        │  id (PK = auth uid) │
        │  email, full_name   │
        │  avatar_url, role   │
        └─────┬───────────────┘
              │ 1:1
              ▼
        ┌────────────────────────────┐
        │ user_progress              │  RLS: dueño + padres vinculados (vía RPC)
        │  user_id (FK auth.users)   │
        │  xp, streak, completed_…   │
        │  invite_code  ◄── único    │
        │  role: 'student'|'parent'  │
        └─────┬──────────────────────┘
              │
              │       ┌──────────────────────────┐
              └──────►│ parent_student_links     │  unique(parent_id, student_id)
                      │  parent_id  (FK)         │
                      │  student_id (FK)         │
                      │  status: 'accepted'      │
                      │  child_email, child_name │
                      └──────────────────────────┘

        ┌────────────────────────────┐
        │ exercise_attempts          │  RLS: dueño
        │ exercise_history           │  RLS: dueño
        │ math_chat                  │  RLS: dueño
        └────────────────────────────┘

        ┌────────────────────────────┐
        │ beta_allowlist             │  RLS: bloqueada (acceso solo vía RPC SD)
        │  email (PK)                │
        └────────────────────────────┘
```

## Políticas RLS por tabla

### `profiles`
| Operación | Política                               | USING                  |
|-----------|----------------------------------------|------------------------|
| SELECT    | Profiles are viewable by owner         | `auth.uid() = id`      |
| INSERT    | Users can insert own profile           | check: `auth.uid()=id` |
| UPDATE    | Users can update own profile           | `auth.uid() = id`      |
| SELECT    | Users can view own profile             | `auth.uid() = id`      |

**Eliminada:** `Profiles searchable by authenticated` (era un leak).

### `user_progress`
| Operación | Política                                | Condición |
|-----------|-----------------------------------------|-----------|
| ALL       | Users can manage own progress           | `auth.uid() = user_id` |
| SELECT    | Parents view children progress          | `auth.uid() = user_id` OR (existe link aceptado donde uid = parent_id y user_id = student_id) |
| SELECT    | Parents can read student progress for linking | mismo predicado |

### `parent_student_links`
| Operación | Política                  | Condición |
|-----------|---------------------------|-----------|
| ALL       | Parents manage own links  | `auth.uid() = parent_id` |
| UPDATE    | Students accept invite    | `auth.uid() = student_id` |
| SELECT    | Students view own links   | uid = student_id OR uid = parent_id |

### `exercise_attempts`, `exercise_history`, `math_chat`
Solo el dueño (`auth.uid() = user_id`) puede leer o escribir.

### `beta_allowlist`
RLS bloqueada con `USING (false)`. Solo `SECURITY DEFINER` puede tocarla.

## Funciones `SECURITY DEFINER`

| Nombre                              | Quién la llama | Qué hace |
|-------------------------------------|----------------|----------|
| `is_email_allowed(email)`           | anon, auth     | Preflight beta: `true/false` |
| `handle_new_user()`                 | trigger        | Bloquea signup si no está en allowlist; crea profile + user_progress |
| `generate_invite_code()`            | trigger        | Genera código XXX-XXX |
| `link_by_invite_code(target_code)`  | auth           | Vincula al usuario actual con el dueño del código |
| `unlink_partner(partner_uuid)`      | auth           | Elimina el `parent_student_links` correspondiente |
| `my_linked_partners()`              | auth           | Lista parents vinculados al usuario actual |
| `my_children_progress()`            | auth           | Devuelve `user_progress` de los hijos del padre actual |

## Validaciones en `link_by_invite_code`

1. `auth.uid()` no es null → `NOT_AUTHENTICATED`
2. Código tiene al menos 6 chars válidos (`A-Z0-9-`) → `INVALID_CODE_FORMAT`
3. Existe un `user_progress.invite_code` igual → si no, `CODE_NOT_FOUND`
4. `partner_id != auth.uid()` → `CANNOT_LINK_SELF`
5. Los roles del usuario y del partner no pueden ser iguales → `SAME_ROLE_CANNOT_LINK`
6. Si pasa todo: `INSERT … ON CONFLICT (parent_id, student_id) DO UPDATE`.

## Cómo invitar a un nuevo usuario al beta

```sql
INSERT INTO public.beta_allowlist (email, note)
VALUES ('nuevo@correo.com', 'invitación manual');
```

Después de eso, esa persona puede crear su cuenta normalmente.
