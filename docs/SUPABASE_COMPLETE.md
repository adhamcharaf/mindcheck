# Supabase Setup - ✅ COMPLETE

**Date:** 25 octobre 2025
**Projet:** Mindcheck (jtwiuzqliphuonmktwqi)
**Status:** Database configurée avec succès via MCP Supabase

---

## ✅ Ce qui a été configuré automatiquement

### 1. Extension UUID ✓
```sql
Migration: enable_uuid_extension
- Extension "uuid-ossp" activée pour génération automatique d'UUIDs
```

### 2. Table `users` ✓
```sql
Migration: create_users_table

Colonnes créées:
- id (UUID, primary key, auto-generated)
- email (VARCHAR, unique, not null)
- created_at (TIMESTAMP, default now())
- trial_ends_at (TIMESTAMP, nullable)
- is_premium (BOOLEAN, default false)
- birthdate (DATE, nullable)
- onboarding_reason (TEXT)
- onboarding_challenge (TEXT)
- onboarding_frequency (VARCHAR)
- onboarding_completed (BOOLEAN, default false)

Index:
- idx_users_email sur email

RLS: ✅ Activé
Policies créées:
- "Users can read own data" (SELECT)
- "Users can update own data" (UPDATE)
- "Users can insert own data" (INSERT)
```

### 3. Table `sessions` ✓
```sql
Migration: create_sessions_table

Colonnes créées:
- id (UUID, primary key, auto-generated)
- user_id (UUID, foreign key → users.id, CASCADE DELETE)
- audio_url (TEXT, nullable)
- transcript (TEXT, not null)
- mood_score (INTEGER, CHECK between 1-10)
- insight (TEXT, nullable)
- created_at (TIMESTAMP, default now())

Index:
- idx_sessions_user_date sur (user_id, created_at DESC)

RLS: ✅ Activé
Policies créées:
- "Users can read own sessions" (SELECT)
- "Users can create own sessions" (INSERT)
- "Users can update own sessions" (UPDATE)
- "Users can delete own sessions" (DELETE)
```

### 4. Table `messages` ✓
```sql
Migration: create_messages_table

Colonnes créées:
- id (UUID, primary key, auto-generated)
- session_id (UUID, foreign key → sessions.id, CASCADE DELETE)
- role (VARCHAR, not null)
- content (TEXT, not null)
- created_at (TIMESTAMP, default now())

Index:
- idx_messages_session sur (session_id, created_at)

RLS: ✅ Activé
Policies créées:
- "Users can read own messages" (SELECT - via sessions ownership)
- "Users can create own messages" (INSERT - via sessions ownership)
```

---

## ⚠️ Configuration manuelle requise

### 1. Storage Bucket "audio-recordings"

**MCP ne supporte pas la création de storage buckets.**

**Étapes manuelles:**

1. Aller dans Supabase Dashboard: https://supabase.com/dashboard/project/jtwiuzqliphuonmktwqi/storage/buckets

2. Créer nouveau bucket:
   - Nom: `audio-recordings`
   - Public: **Non** (privé)
   - File size limit: 50MB (ou selon besoin)
   - Allowed MIME types: `audio/*` (ou vide pour tout autoriser)

3. Configurer les policies RLS dans SQL Editor:

```sql
-- Policy: Upload - authenticated users only
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Download - user owns file + is premium
CREATE POLICY "Premium users can download own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_premium = true
  )
);

-- Policy: Delete - user owns file
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Structure fichiers attendue:**
```
audio-recordings/
└── {user_id}/
    └── {session_id}.m4a
```

---

### 2. Authentication Email/Password

**MCP ne supporte pas la configuration des auth providers.**

**Étapes manuelles:**

1. Aller dans Supabase Dashboard: https://supabase.com/dashboard/project/jtwiuzqliphuonmktwqi/auth/providers

2. Activer "Email" provider:
   - Enable Email Provider: **ON**
   - Confirm email: **Enabled** (ou Disabled pour dev)
   - Secure email change: **Enabled**
   - Secure password change: **Enabled**

3. Configuration optionnelle pour développement:
   - Auto confirm: **Enabled** (pour éviter de confirmer les emails en dev)
   - Sign-up enabled: **Enabled**

4. Redirect URLs (Authentication > URL Configuration):
   - Site URL: `http://localhost:19006` (pour dev web)
   - Redirect URLs:
     ```
     http://localhost:19000
     http://localhost:19006
     mindcheck://
     ```

---

## 📊 Vérification

### Tables créées:
```bash
✅ users       (10 colonnes, RLS enabled, 3 policies)
✅ sessions    (7 colonnes, RLS enabled, 4 policies)
✅ messages    (5 colonnes, RLS enabled, 2 policies)
```

### Migrations appliquées:
```bash
1. 20251025160604 - enable_uuid_extension
2. 20251025160620 - create_users_table
3. 20251025160634 - create_sessions_table
4. 20251025160650 - create_messages_table
```

### Relations:
```
users (id)
  ↓ (one-to-many)
sessions (user_id) → users(id) ON DELETE CASCADE
  ↓ (one-to-many)
messages (session_id) → sessions(id) ON DELETE CASCADE
```

---

## 🧪 Test de connexion

Maintenant vous pouvez tester la connexion depuis votre app:

```bash
npm start
# puis choisir w (web), a (android), ou i (ios)
```

**Status attendu:**
- ✅ "Connecting to Supabase..."
- ✅ "✓ Supabase Connected Successfully!"

Si erreur, vérifier:
1. `.env.local` contient les bonnes credentials
2. Les tables existent (fait ✓)
3. RLS est activé (fait ✓)

---

## 📝 Prochaines étapes

### Phase 2 - Authentification (Semaine 1)

Maintenant que la DB est prête, vous pouvez développer:

1. **Écrans Auth:**
   - Welcome screen
   - Signup (email/password)
   - Login

2. **Flow utilisateur:**
   - Nouveau user → Signup → Onboarding
   - User existant → Login → Main app

3. **Intégration Supabase Auth:**
   ```typescript
   // Signup
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123'
   });

   // Login
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password123'
   });

   // Check session
   const { data: { user } } = await supabase.auth.getUser();
   ```

4. **Créer user dans table users:**
   ```typescript
   // Après signup
   await supabase.from('users').insert({
     id: user.id, // même ID que auth.users
     email: user.email
   });
   ```

---

## 🎯 Checklist finale

- [x] Extension UUID activée
- [x] Table users créée avec RLS + policies
- [x] Table sessions créée avec RLS + policies
- [x] Table messages créée avec RLS + policies
- [x] Indexes de performance créés
- [x] Foreign keys configurées avec CASCADE DELETE
- [ ] Storage bucket "audio-recordings" créé (manuel)
- [ ] Storage policies RLS configurées (manuel)
- [ ] Email/Password auth activé (manuel)
- [ ] Redirect URLs configurées (manuel)

---

**Status Database:** 🚀 Prêt pour développement Phase 2
**Status Storage:** ⚠️ Configuration manuelle requise
**Status Auth:** ⚠️ Configuration manuelle requise

**Temps total:** ~5 minutes pour DB setup via MCP ✅
