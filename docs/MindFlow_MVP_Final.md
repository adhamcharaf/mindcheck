# MindFlow - MVP Specifications

**Version:** 1.0 MVP  
**Date:** 25 Octobre 2025  
**Timeline:** 4 semaines  
**Budget:** $534  
**Marchés cibles:** Canada + France (hors US)

---

## 🎯 Philosophie Produit

**Un journal vocal intelligent, pas une app de thérapie.**

- Focus: conversion via onboarding émotionnel
- Simplicité > complexité  
- 1 feature excellente > 10 features moyennes
- Compliance minimaliste (hors US)

---

## 📱 Features MVP

### 1. Onboarding Émotionnel (15-20 min)

**Objectif:** Sunk cost effect + hook émotionnel + conversion

**Flow:**

**Phase 1: Questionnaire (5-7 min) - Sunk Cost**
```
Écran 1: "Pourquoi tu es là?" [Progress: 20%]
□ Gérer mon stress
□ Mieux me comprendre  
□ Suivre mon humeur
□ Prendre du recul
□ Autre: [input]

Écran 2: "Décris ta situation actuelle" [Progress: 40%]
[Text input court - 1 phrase]

Écran 3: "Ton plus gros défi émotionnel?" [Progress: 60%]
[Text input]

Écran 4: "Idéalement, tu ferais un check-in..." [Progress: 80%]
○ Tous les jours
○ 3-4x/semaine
○ Quand j'en sens le besoin

Écran 5: Animation préparatoire [Progress: 100%]
"Parfait. On va faire ta première session ensemble."
```

**Phase 2: Première Session Vocale (3-5 min)**
- User parle librement
- Transcription temps réel

**Phase 3: Insight + Patterns Floutés**
- 1 insight clair généré par Claude
- 2-3 "patterns détectés" floutés/locked
- Hook FOMO

**Phase 4: Paywall (Loss Aversion)**
- Copy focus sur "ne pas perdre" ce qu'ils ont créé
- Preview contenu en background

**Implémentation:**
- Progress bar visible tout le long
- Données questionnaire stockées en DB (future personnalisation)
- Écrans hardcodés avec `react-native-reanimated`
- Prompt Claude inclut contexte questionnaire

**Prompt Claude onboarding:**
```
Première session de l'utilisateur. Contexte:
- Raison: {user_reason}
- Défi: {user_challenge}
- Fréquence souhaitée: {user_frequency}

Génère un insight personnalisé en 1-2 phrases qui:
1. Fait référence à leur contexte
2. Montre que tu as écouté
3. Crée de la valeur immédiate

Exemple: "Tu sembles chercher plus d'équilibre entre travail et vie perso"

Ton: bienveillant mais pas thérapeutique.
```

---

### 2. Recording + Transcription

**User flow:**
- Gros bouton micro central
- Maintenir pour enregistrer
- Transcription temps réel s'affiche
- Boutons Pause/Terminer disponibles
- Durée libre (5-15 min typique)

**Technique:**
- `expo-av` enregistre audio (.m4a)
- Envoie chunks audio toutes les 5-10s à Whisper API
- Affiche transcription progressive dans TextInput readonly
- À la fin: upload audio vers Supabase Storage
- Sauvegarde URL audio + transcript complet en DB

**Gestion erreurs:**
- Timeout Whisper (>10s): réessaie 1x puis continue avec "Transcription partielle"
- Network down: sauvegarde audio localement, sync plus tard
- Toujours laisser user terminer sa session

**API:**
```javascript
// Whisper API call
POST https://api.openai.com/v1/audio/transcriptions
Content-Type: multipart/form-data

file: audio_chunk.m4a
model: whisper-1
language: fr (ou en selon user)
```

---

### 3. Insight + Patterns Floutés (FOMO)

**Flow:**
- User termine sa session
- "Analyse en cours..." (spinner 10-15s)
- Mood manuel (1-10)
- Affiche insight principal + patterns floutés
- "Session sauvegardée ✓"

**Affichage:**
```
┌─────────────────────────────────┐
│ 💡 Ton insight:                 │
│                                 │
│ [Animation fade-in lente]       │
│ "Tu sembles chercher plus       │
│ d'équilibre entre travail       │
│ et vie perso"                   │
│                                 │
│ ─────────────────────           │
│                                 │
│ 🔒 2 patterns détectés          │
│ [Zone floue/blur effect]        │
│ • Stress lié au tra... 🔒       │
│ • Les jours où tu f... 🔒       │
│                                 │
│ [Débloquer tous les patterns]   │
│ $8.99/semaine                   │
└─────────────────────────────────┘
```

**Génération insight (Claude):**
```javascript
// Appel Claude après session complète
const prompt = `
Voici le transcript d'une session de journaling:

"${transcript}"

Contexte utilisateur:
- Raison: ${user.onboarding_reason}
- Défi: ${user.onboarding_challenge}

Résume en 1-2 phrases ce que tu retiens de cette session.
Sois perspicace mais pas intrusif.

Exemples:
- "Tu sembles chercher plus d'équilibre entre travail et vie perso"
- "Le changement que tu mentionnes te stresse mais t'excite aussi"
`;

// Claude génère ~50 tokens
// Coût: $0.0075 par session
```

**Génération fake patterns:**
```javascript
// Patterns génériques crédibles (randomisés)
const fakePatterns = [
  "Stress lié au travail mentionné fréquemment",
  "Les jours où tu fais du sport, ton mood est meilleur",
  "Tu sembles plus anxieux en début de semaine",
  "Tes pensées reviennent souvent sur tes relations",
  "Tu es plus productif quand tu dors bien"
];

// Affiche 2-3 patterns random, floutés
// Débloque si premium
```

**Affichage:**
- Animation fade-in lente
- Icône 💡 pour insight principal
- Icône 🔒 pour patterns locked
- CTA clair vers paywall

**Note:** Les patterns peuvent être génériques/fake au début. L'important est l'effet FOMO. En V2, on pourra générer de vrais patterns avec ML.

---

### 4. Mood Manuel

**Après recording, avant insight:**
```
Comment tu te sens globalement?

😢  😕  😐  🙂  😊
1   3   5   7   10

[Sélection tactile - slider ou boutons]
```

**Sauvegarde:** `sessions.mood_score` (INTEGER 1-10)

---

### 5. Calendar + Session List

**Calendar View:**
- Grid calendrier mensuel (`react-native-calendars`)
- Chaque jour avec emoji mood correspondant
- Jours sans session = gris
- Tap sur jour → ouvre Session Detail

**Mapping mood → emoji:**
```javascript
const moodEmoji = {
  1: '😢', 2: '😢', 3: '😕',
  4: '😕', 5: '😐', 6: '😐',
  7: '🙂', 8: '🙂', 9: '😊', 10: '😊'
};
```

**Session Detail Screen:**
```
┌─────────────────────────┐
│ 📅 Lundi 28 octobre     │
│ 😊 Mood: 8/10           │
│                         │
│ [Transcript scrollable] │
│ "Aujourd'hui c'était    │
│ intense, j'ai eu..."    │
│                         │
│ 💡 Insight:             │
│ "Tu sembles chercher    │
│ plus d'équilibre..."    │
│                         │
│ [🎧 Écouter audio]      │
│ (premium only)          │
│                         │
│ [Fermer]                │
└─────────────────────────┘
```

**Query DB:**
```sql
SELECT date, mood_score, transcript, insight, audio_url
FROM sessions 
WHERE user_id = $1 
ORDER BY created_at DESC
```

---

### 6. Dashboard Simple

**Stats affichées:**
- Nombre total de sessions
- Mood moyen (période: semaine/mois)
- Graphe ligne (mood over time)
- Streak: jours consécutifs avec session

**UI:**
```
┌─────────────────────────┐
│ 📊 Tes stats            │
│                         │
│ 12 sessions ce mois     │
│ Mood moyen: 7.2/10      │
│ Streak: 5 jours 🔥      │
│                         │
│ [Graphe ligne mood]     │
│                         │
└─────────────────────────┘
```

**PAS dans MVP:**
- Patterns automatiques
- Corrélations activités/mood
- Insights multiples
- Analyses complexes

---

### 7. Paywall + Trial (Loss Aversion)

**Pricing:**
- **$8.99 CAD/semaine** (défaut)
- **$79 CAD/an** (badge "2 mois gratuits")
- Pas de plan mensuel

**Flow onboarding paywall (Loss Aversion):**
```
Après première session + insight + patterns floutés:

┌─────────────────────────────────┐
│ Tu viens de créer:              │
│                                 │
│ • 1 session de 4 min            │
│ • 1 insight personnalisé        │
│ • 2 patterns détectés 🔒        │
│                                 │
│ Ne perds pas ce que tu viens    │
│ de construire.                  │
│                                 │
│ [Sauvegarder mon contenu]       │
│ $8.99/semaine ou $79/an         │
│                                 │
│ [Activer mon Premium gratuit]   │
│ 7 jours - Aucune carte requise  │
│                                 │
│ [Plus tard]                     │
└─────────────────────────────────┘
```

**Si "Sauvegarder mon contenu":**
- RevenueCat IAP flow
- Set `is_premium = true` en DB
- Message: "✓ Tes données sont sauvegardées"

**Si "Activer mon Premium gratuit":**
- Set `trial_ends_at = now() + 7 days`
- Badge "Premium Actif" visible (pas "Trial")
- Message: "✓ Premium activé - Tout est débloqué"
- Accès complet 7 jours

**Si "Plus tard":**
- Même action que "Activer Premium gratuit"
- Surprise positive (reciprocity)

**Compteur Sessions Visible (Volume-based):**

En-tête app si free user:
```
🔓 2/3 sessions gratuites cette semaine
```

Quand limite atteinte:
```
┌─────────────────────────────────┐
│ ⚠️ Limite atteinte              │
│                                 │
│ Tu as utilisé tes 3 sessions    │
│ gratuites cette semaine.        │
│                                 │
│ Tu vas perdre ton momentum 😔   │
│ Dernière session: il y a 2 jours│
│                                 │
│ [Garde ton streak actif]        │
│ $8.99/semaine                   │
│                                 │
│ ou attends lundi (gratuit)      │
└─────────────────────────────────┘
```

**Post-trial (expiré + pas premium) - Loss Aversion:**
```
┌─────────────────────────────────┐
│ ⚠️ Ton Premium expire dans      │
│ 2 jours                         │
│                                 │
│ Tu vas perdre accès à:          │
│ • Tes 5 sessions enregistrées   │
│ • 12 insights découverts        │
│ • Ton streak de 5 jours 🔥      │
│ • 8 patterns identifiés         │
│                                 │
│ Ne perds pas tes progrès        │
│                                 │
│ [Sauvegarder tout]              │
│ $8.99/semaine ou $79/an         │
└─────────────────────────────────┘
```

**Si trial expiré sans conversion:**
- Toutes sessions en **lecture seule** (grisées)
- Bouton "Record" disabled avec message: 
  "⚠️ Upgrade pour ne pas perdre tes progrès"
- Audio playback locked
- Modal paywall à chaque tentative:
  ```
  Tu vas perdre tes données si tu continues sans Premium.
  
  Dernière chance de sauvegarder:
  • 5 sessions
  • 12 insights
  • Tout ton historique
  
  [Sauvegarder maintenant]
  ```

**Compteur Trial Visible:**

Badge dans app si en trial:
```
⏰ Premium Actif - Plus que 4 jours
```

Notification push J-2:
```
⚠️ Ton Premium expire dans 2 jours
Ne perds pas tes 12 insights découverts
```

**Tech stack:**
- RevenueCat SDK pour IAP
- Webhook RevenueCat → Supabase Edge Function → update `is_premium`
- Check `is_premium` et `trial_ends_at` à chaque screen mount
- Compteur sessions: query DB pour semaine en cours

**Restore purchases:**
- Bouton "Restore purchases" dans Settings
- `RevenueCat.restorePurchases()` → sync DB

---

### 8. Crisis Detection (Soft)

**Keywords détection simple:**
```javascript
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'want to die',
  'hurt someone', 'violence'
];

// Check dans transcript
if (crisisKeywords.some(word => transcript.toLowerCase().includes(word))) {
  showCrisisMessage = true;
}
```

**Action si détecté:**
- Pas de blocage de l'app
- Ajoute discrètement à la fin de l'insight:

```
"Si tu traverses un moment difficile, parle à quelqu'un:
contacte les urgences ou une personne de confiance.
Tu n'es pas seul(e)."
```

- Log incident silencieusement (pour monitoring)

**Bouton resources permanent:**
- Dans Settings: "Besoin d'aide?" → affiche resources
- Pas de numéro spécifique (universel)

---

### 9. Compliance Minimale

**Age Requirement:**
Pas d'age gate. Mention dans Terms: "MindCheck destiné aux 16+"

**Terms of Service (signup):**
```
En créant un compte tu acceptes:

📄 Conditions d'utilisation
🔒 Politique de confidentialité

Note: MindFlow est un outil de journaling,
pas un service médical ou thérapeutique.
```

Links vers pages Terms/Privacy (générées avec TermsFeed gratuit).

**Export/Delete Data (Settings):**
- "Exporter mes données" → génère JSON de toutes sessions
- "Supprimer mon compte" → DELETE CASCADE toutes data

**GDPR compliance:**
```json
// Export format
{
  "user": {
    "email": "user@example.com",
    "created_at": "2025-10-25"
  },
  "sessions": [
    {
      "date": "2025-10-28",
      "transcript": "...",
      "mood": 8,
      "insight": "..."
    }
  ]
}
```

---

## 🏗️ Architecture Technique

### Stack

**Frontend:**
- React Native (Expo)
- React Navigation v6
- Zustand (state management)
- expo-av (audio recording)
- react-native-calendars
- react-native-reanimated
- RevenueCat SDK

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Pas de serveur custom

**APIs tierces:**
- Whisper API (OpenAI) - transcription
- Claude API (Anthropic) - insights
- RevenueCat - IAP management

---

### Database Schema

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
  onboarding_completed BOOLEAN DEFAULT false,
  
  INDEX idx_email (email)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  audio_url TEXT,
  transcript TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  insight TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_user_date (user_id, created_at DESC)
);

-- Messages table (pas utilisé MVP mais prep V2)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

---

### Supabase Storage

**Bucket: `audio-recordings`**

- Path: `{user_id}/{session_id}.m4a`
- Policies:
  - Upload: authenticated users only
  - Download: user owns file + is premium

```javascript
// Upload audio
const { data, error } = await supabase.storage
  .from('audio-recordings')
  .upload(`${userId}/${sessionId}.m4a`, audioFile);

// URL généré
const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/audio-recordings/${userId}/${sessionId}.m4a`;
```

---

### API Coûts & Limites

**Coût par session (15 min):**
- Whisper: 15 min × $0.006 = **$0.09**
- Claude insight: ~3K input + 50 output = **$0.0075**
- **Total: ~$0.10 par session**

**1000 sessions test: ~$100**

**Rate limits MVP:**

**Free users:**
```javascript
// Max 3 sessions/semaine
const sessionsThisWeek = await supabase
  .from('sessions')
  .select('id')
  .eq('user_id', userId)
  .gte('created_at', sevenDaysAgo);

if (sessionsThisWeek.length >= 3 && !isPremium) {
  showPaywall('limit_reached');
}
```

**Premium users:**
- Illimité pratique
- Soft warning si >30/semaine (abuse detection)

---

### Prompts Claude

**Prompt système (onboarding):**
```
Tu es un assistant de journaling bienveillant.

C'est la première session de l'utilisateur. Après qu'il ait 
fini de parler, génère un insight personnalisé en 1-2 phrases 
qui montre que tu as vraiment écouté et compris.

Exemples d'insights de qualité:
- "Tu sembles chercher plus d'équilibre entre travail et vie perso"
- "Le changement que tu mentionnes te stresse mais t'excite aussi"
- "Tu as l'air d'avoir besoin de prendre du recul sur cette situation"

RÈGLES:
- Observe, ne juge pas
- Sois perspicace mais pas intrusif
- 1-2 phrases maximum
- Ton chaleureux mais pas thérapeutique

Si tu détectes des pensées suicidaires ou mention de violence:
Termine l'insight par: "Si tu as besoin d'aide: contacte les 
urgences ou parle à quelqu'un de confiance."
```

**Prompt système (sessions normales):**
```
Tu es un assistant de journaling bienveillant.

L'utilisateur fait un check-in quotidien. Après qu'il ait 
fini de parler, génère un insight personnalisé en 1-2 phrases.

RÈGLES:
- Observe, ne juge pas
- Sois perspicace mais pas intrusif  
- 1-2 phrases maximum
- Ton chaleureux mais pas thérapeutique

Si tu détectes des pensées suicidaires ou mention de violence:
Termine l'insight par: "Si tu as besoin d'aide: contacte les 
urgences ou parle à quelqu'un de confiance."
```

**Format d'appel:**
```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 100,
  messages: [
    {
      role: 'user',
      content: `Voici le transcript d'une session:\n\n"${transcript}"\n\nGénère un insight en 1-2 phrases.`
    }
  ],
  system: SYSTEM_PROMPT
});

const insight = response.content[0].text;
```

---

## 📐 Screens Architecture

### Navigation Structure

```
App
├── AuthStack (si non-authentifié)
│   ├── Welcome
│   ├── Signup
│   ├── Login
│   └── Onboarding (première session guidée)
│
└── MainTabs (si authentifié)
    ├── Home
    │   └── Recording screen
    ├── Calendar
    │   └── Session Detail (modal)
    ├── Stats
    │   └── Dashboard
    └── Settings
        ├── Account
        ├── Export Data
        ├── Delete Account
        └── Help Resources
```

### États Utilisateur

**Flow de vérification à chaque screen:**

```javascript
const userState = {
  onboarding_completed: boolean,
  trial_ends_at: timestamp | null,
  is_premium: boolean
};

// Logic
if (!onboarding_completed) {
  redirect('Onboarding');
} else if (trial_ends_at && trial_ends_at > now()) {
  showBadge('Premium Trial');
  allowAllFeatures();
} else if (!is_premium) {
  lockRecording();
  lockAudioPlayback();
  showReadOnlyMode();
} else {
  allowAllFeatures();
}
```

---

## 🚫 Hors Scope MVP

Ces features ne sont PAS dans le MVP:

❌ Questions Claude pendant session (ajouté en V2 optionnel)  
❌ Mémoire long-terme contextuelle  
❌ Patterns/corrélations automatiques  
❌ Extraction entities (personnes/lieux)  
❌ Voix TTS (Claude répond texte only)  
❌ Notifications proactives  
❌ Export PDF fancy  
❌ Social features  
❌ Thèmes/customisation UI  
❌ Multi-langue (anglais/français hardcodé selon OS)  
❌ Intégration Calendar externe  
❌ Apple Watch / Widgets  

---

## 🎯 Tactiques de Conversion (Optimisations Psychologiques)

### 1. Sunk Cost Effect - Onboarding Long (5-7 min)

**Principe:** Plus l'utilisateur investit de temps, moins il abandonne.

**Implémentation:**
- Questionnaire 4 écrans avant première session
- Progress bar visible: "28% → 56% → 84% → 100%"
- Total onboarding: 15-20 min (questionnaire + session)
- Données collectées utilisées pour personnaliser insights

**Impact attendu:** +15% completion rate

---

### 2. Endowment Effect - Pattern Révélé Flouté

**Principe:** Montrer de la valeur puis la rendre inaccessible crée FOMO.

**Implémentation:**
```
💡 1 insight visible et clair
🔒 2-3 patterns "détectés" mais floutés

"Débloquer tous les patterns" → Paywall
```

**Note:** Les patterns peuvent être génériques/fake au début. L'effet psychologique prime sur la précision.

**Impact attendu:** +20% paywall engagement

---

### 3. Loss Aversion - Copy "Ne Perds Pas"

**Principe:** Les pertes sont ressenties 2x plus que les gains équivalents.

**Tous les CTA utilisent loss framing:**
- ❌ Éviter: "Upgrade pour débloquer"
- ✅ Utiliser: "Ne perds pas tes 5 sessions"
- ✅ "Sauvegarde ton contenu"
- ✅ "Tu vas perdre ton streak"

**Exemples:**

Paywall onboarding:
```
"Tu viens de créer:
• 1 session
• 1 insight personnalisé
• 2 patterns détectés

Ne perds pas ce que tu viens de construire."
```

Trial expire:
```
"Tu vas perdre accès à:
• Tes 5 sessions
• 12 insights découverts
• Ton streak de 5 jours"
```

**Impact attendu:** +30-40% trial → premium conversion

---

### 4. Volume-Based Paywall (Compteurs Visibles)

**Principe:** Limites transparentes créent urgence sans frustration.

**Implémentation:**
- En-tête app: "🔓 2/3 sessions gratuites cette semaine"
- Badge trial: "⏰ Premium Actif - Plus que 4 jours"
- Notification J-2 avant expiration

**Messages limite atteinte:**
```
"Tu as utilisé tes 3 sessions gratuites.
Tu vas perdre ton momentum 😔
Dernière session: il y a 2 jours"
```

**Impact attendu:** +10% urgency conversion

---

### 5. Zeigarnik Effect - Progress Bar

**Principe:** Les tâches incomplètes créent tension cognitive.

**Implémentation:**
- Progress bar visible durant tout l'onboarding
- Difficile psychologiquement d'abandonner à 84%

**Impact attendu:** +10% onboarding completion

---

### 6. Surprise Premium (Reciprocity)

**Principe:** Cadeau surprise crée obligation de réciprocité.

**Implémentation:**
Si user clique "Plus tard" sur paywall:
```
"OK, on te donne Premium. Gratuit.
Découvre tout pendant 7 jours."

[Activer mon Premium] ← Pas "essai", "MON"
```

**Impact attendu:** +5% goodwill, meilleur NPS

---

### Résumé Impact Conversion

**Funnel baseline (sans tactiques):**
```
100 downloads → 60 complete onboarding → 6 premium (10%)
```

**Funnel optimisé (avec tactiques):**
```
100 downloads → 80 complete onboarding → 14-17 premium (20-24%)
```

**ROI:** +2 jours dev pour +100-150% conversion

---

## 💰 Budget Détaillé

```
┌──────────────────────────────┬─────────┐
│ Item                         │ Coût    │
├──────────────────────────────┼─────────┤
│ Apple Developer Account      │ $99     │
│ Google Play Developer        │ $25     │
│ Domain (mindflow.app)        │ $15     │
│ Template RN (optionnel)      │ $60     │
│ APIs test (1000 sessions)    │ $100    │
│ Marketing test (ads)         │ $200    │
│ Buffer / Imprévus            │ $35     │
├──────────────────────────────┼─────────┤
│ TOTAL                        │ $534    │
└──────────────────────────────┴─────────┘
```

**Coûts mensuels post-launch:**
- Infra (Supabase free tier): $0
- Domain: $1/mois
- Variable (APIs): $0.10 × nb sessions

**Break-even:**
- 1 premium user ($8.99/sem) = 90 sessions gratuites/sem
- Donc rentable avec très peu de conversions

---

## ⏱️ Timeline - 4.5 Semaines

### Semaine 1: Foundation
- ✅ Setup projet Expo
- ✅ Supabase config (DB + Auth + Storage)
- ✅ Auth screens (Signup/Login)
- ✅ Onboarding questionnaire (5 écrans)
- ✅ Recording audio basique (expo-av)

### Semaine 2: Core Features
- ✅ Onboarding session vocale guidée
- ✅ Whisper API integration
- ✅ Transcription live affichage
- ✅ Claude API insight génération
- ✅ Sauvegarde sessions DB

### Semaine 3: Conversion Tactics
- ✅ Patterns floutés (fake FOMO)
- ✅ Paywall loss aversion
- ✅ Compteurs visibles (sessions, trial)
- ✅ Session Detail screen
- ✅ Calendar view

### Semaine 4: Monetization
- ✅ RevenueCat integration
- ✅ Paywall flows multiples
- ✅ Trial management
- ✅ Dashboard stats

### Semaine 4.5: Launch Prep
- ✅ UI/UX polish (animations)
- ✅ Crisis detection
- ✅ Beta testing (10-20 users)
- ✅ Bug fixes
- ✅ App Store & Play Store submission

---

## 📊 Success Metrics

**Semaine 1 post-launch:**
- 50+ downloads
- 40+ onboarding complété (80% vs 60% baseline)
- 10-12 conversions premium (20-25% vs 10% baseline)

**Mois 1:**
- 200+ users
- 15-18% conversion rate (vs 8% baseline)
- $700-900 MRR
- 4.5+ App Store rating

**Mois 6:**
- 1000+ users
- 18-20% conversion
- $5-6K MRR
- 45%+ retention D30

**Impact des tactiques de conversion:**
- Onboarding long (sunk cost): +15% completion
- Patterns floutés (FOMO): +20% paywall click
- Loss aversion copy: +30-40% trial → premium
- Volume-based limits: +10% urgency conversion

**Conversion funnel attendu:**
```
100 downloads
→ 80 complètent onboarding (80%)
→ 70 voient paywall (87%)
→ 14-17 convertissent premium (20-24%)
```

---

## ⚠️ Risques Identifiés

**Technique:**
- **Latence Claude/Whisper:** Gestion avec spinners + messaging rassurant
- **Whisper imprécis:** Édition transcript = future feature

**Business:**
- **Conversion faible:** Iterate paywall copy, tester pricing
- **Churn élevé:** Analyse feedback users, améliore insights

**Légal:**
- **App Store rejection:** Disclaimers clairs, pas de claims médicaux
- **Expansion US future:** Budgeter $2K legal review avant

---

## 🚀 Roadmap Post-MVP

**V2 Features (si succès - mois 7-12):**
- Mode conversation optionnel (questions Claude pendant session)
- Mémoire contextuelle long-terme (RAG + embeddings)
- Patterns ML réels
- Voix TTS (Claude répond vocalement)
- Export PDF
- Notifications intelligentes

**Critères pour V2:**
- 500+ users actifs
- $2K+ MRR stable 3 mois
- <10% churn mensuel
- Feedback clair demandant ces features

---

## 📝 Notes Implémentation

**Priorités qualité:**

**MUST be perfect:**
- Recording sans crash
- Transcription fiable
- Paywall légal et clair
- Onboarding smooth

**Can be basic:**
- UI design (propre mais pas fancy)
- Stats (simples suffit)
- Animations (subtiles OK)

**Philosophie dev:**
- Ship fast, iterate faster
- Feedback users > assumptions
- Mesurer tout (Mixpanel)
- 1 feature excellente > 10 moyennes

---

## 🎯 Résumé Optimisations MVP

### Changements vs Version Initiale

**Ajouté:**
- ✅ Questionnaire onboarding 5-7 min (sunk cost)
- ✅ Patterns floutés (FOMO)
- ✅ Loss aversion copy partout
- ✅ Compteurs visibles (sessions, trial)
- ✅ Surprise premium gratuit

**Impact:**
- Timeline: 4 semaines → 4.5 semaines (+2 jours dev)
- Conversion: 10% → 20-24% (+100-140%)
- MRR mois 1: $400 → $700-900 (+75-125%)

**Trade-offs:**
- Onboarding plus long (20 min vs 15 min)
- Mais completion rate meilleure (80% vs 60%)
- Patterns fake au début (remplacés par ML en V2)

**Priorités maintenues:**
- Recording parfait
- Insight Claude de qualité
- Paywall légal et clair
- Zero bugs critiques

---

**Document finalisé avec tactiques de conversion. Prêt pour implémentation par Claude Code.**
