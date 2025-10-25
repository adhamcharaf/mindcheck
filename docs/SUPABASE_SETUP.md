# Supabase Setup - Instructions

Ce document explique comment créer les tables nécessaires dans votre projet Supabase.

---

## Credentials configurés

**URL:** https://jtwiuzqliphuonmktwqi.supabase.co
**Status:** ✅ Configuré dans `.env.local`

---

## Tables à créer

### 1. Table `users`

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  trial_ends_at TIMESTAMP NULL,
  is_premium BOOLEAN DEFAULT false,
  birthdate DATE NULL,

  -- Données onboarding (pour personnalisation)
  onboarding_reason TEXT,
  onboarding_challenge TEXT,
  onboarding_frequency VARCHAR(50),
  onboarding_completed BOOLEAN DEFAULT false
);

-- Index pour performance
CREATE INDEX idx_users_email ON users(email);
```

### 2. Table `sessions`

```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  audio_url TEXT,
  transcript TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  insight TEXT,

  created_at TIMESTAMP DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_sessions_user_date ON sessions(user_id, created_at DESC);
```

### 3. Table `messages` (optionnel - prep V2)

```sql
-- Messages table (pas utilisé MVP mais prep V2)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_messages_session ON messages(session_id, created_at);
```

---

## Storage Bucket

### Créer le bucket `audio-recordings`

**Dans Supabase Dashboard:**
1. Aller dans Storage
2. Créer nouveau bucket: `audio-recordings`
3. Public: **Non** (privé)

**Policies RLS:**

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

---

## Row Level Security (RLS)

### Activer RLS sur toutes les tables

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### Policies pour `users`

```sql
-- Users can read own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Users can insert own data (signup)
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

### Policies pour `sessions`

```sql
-- Users can read own sessions
CREATE POLICY "Users can read own sessions"
ON sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create own sessions
CREATE POLICY "Users can create own sessions"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own sessions
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete own sessions
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### Policies pour `messages`

```sql
-- Users can read messages from own sessions
CREATE POLICY "Users can read own messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = messages.session_id
    AND sessions.user_id = auth.uid()
  )
);

-- Users can create messages in own sessions
CREATE POLICY "Users can create own messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = messages.session_id
    AND sessions.user_id = auth.uid()
  )
);
```

---

## Authentication Setup

### Email/Password Auth

**Dans Supabase Dashboard:**
1. Aller dans Authentication > Settings
2. Activer "Email" provider
3. Configurer:
   - Confirmation email: **Enabled** (ou Disabled pour dev)
   - Auto confirm: **Disabled** (ou Enabled pour dev rapide)

### Redirect URLs

Pour développement local:
```
http://localhost:19000
http://localhost:19006
```

Pour production (à ajouter plus tard):
```
https://mindcheck.app
mindcheck://
```

---

## Test de connexion

L'app actuelle (App.tsx) teste déjà la connexion avec:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('count')
  .limit(0)
  .single();
```

**Status attendu:**
- ✅ `connected` si les tables existent et RLS configuré
- ❌ `error` si tables manquantes ou problème auth

---

## Script SQL complet

Exécuter dans **Supabase SQL Editor:**

```sql
-- ========================================
-- MindCheck MVP - Database Setup
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLES
-- ========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  trial_ends_at TIMESTAMP NULL,
  is_premium BOOLEAN DEFAULT false,
  birthdate DATE NULL,
  onboarding_reason TEXT,
  onboarding_challenge TEXT,
  onboarding_frequency VARCHAR(50),
  onboarding_completed BOOLEAN DEFAULT false
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  insight TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Messages table (V2)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ========================================
-- DONE!
-- ========================================

SELECT 'MindCheck database setup complete!' as status;
```

---

## Vérification

Après exécution du script, vérifier:

1. **Tables créées:**
   - users ✓
   - sessions ✓
   - messages ✓

2. **RLS activé:**
   - Check dans Table Editor > users > Settings
   - "Row Level Security" = Enabled

3. **Storage bucket:**
   - Bucket `audio-recordings` créé
   - Policies configurées

4. **Auth provider:**
   - Email/Password activé

---

## Commandes utiles

### Voir toutes les tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Voir les policies RLS
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Compter les users
```sql
SELECT COUNT(*) FROM users;
```

### Compter les sessions
```sql
SELECT COUNT(*) FROM sessions;
```

---

**Status:** 📋 Instructions complètes pour setup Supabase
**À faire:** Exécuter le script SQL dans Supabase Dashboard
