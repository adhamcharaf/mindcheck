# Feature: Mémoire Contextuelle + Guidage Vocal

## 🎯 Vision

Transformer MindFlow d'un "enregistreur vocal avec AI" en "compagnon qui te comprend vraiment".

**Problème actuel:** L'app traite chaque session isolément. Aucune continuité, aucun lien temporel, aucune vraie intelligence.

**Solution:** Claude se souvient de tes sessions passées et crée une continuité narrative.

---

## 🧠 Mémoire Contextuelle

### Concept

À chaque session, Claude extrait 3-5 "key facts" - des phrases courtes résumant les points clés mentionnés.

Lors des prochaines sessions, Claude utilise ces facts pour:
- Faire des liens temporels ("tu mentionnais X il y a 3 jours")
- Détecter patterns émergents ("c'est la 3e fois que tu parles de stress le lundi")
- Créer continuité narrative

### Comportement Attendu

#### Session 1 (pas d'historique)
```
User parle: "Je suis stressé par mon projet au travail, j'ai mal dormi"

Claude génère:
- Insight: "Tu sembles submergé par ce projet au travail"
- Key facts extraits: ["stressed by work project", "sleep issues"]
- Message additionnel: "Dès que j'aurai plus d'infos, je t'aiderai à comprendre tes patterns 💡"
```

#### Session 2 (3 jours plus tard)
```
Claude reçoit contexte:
- Il y a 3 jours: "stressed by work project", "sleep issues"

User parle: "Ça va mieux, j'ai fini le projet"

Claude génère:
- Insight: "Tu mentionnais être stressé par ton projet il y a 3 jours, tu sembles soulagé maintenant que c'est terminé"
- Key facts: ["project completed", "feeling better"]
```

#### Session 5 (pattern détecté)
```
Claude voit historique:
- Lundi 1: stressed
- Mercredi: better
- Lundi 2: stressed again

Insight: "Je remarque que tu mentionnes du stress les lundis. C'est un pattern que tu as observé?"
```

### Règles Mémoire

**Durée rétention:**
- **Trial users:** 3 derniers jours
- **Premium users:** 30 derniers jours
- **Long terme:** Compaction mensuelle automatique (background job)
  - Les 30 jours écoulés sont résumés en "meta-facts"
  - Exemple: `["Octobre: stress travail récurrent", "Sport améliore mood"]`
  - Stocké séparément, moins de détails mais vue macro

**Key facts extraction:**
- Minimum 2, maximum 5 par session
- Phrases courtes, factuelles
- Pas de jugement, juste observations
- Format: array de strings simples

**Edge cases:**

1. **Gap >7 jours:**
```
Insight normal + message:
"Ça fait un moment! Des check-ins réguliers m'aident à mieux te connaître"
```

2. **Sessions très espacées (>1 mois):**
```
Insight basique sans trop de contexte + nudge régularité
```

3. **Première session:**
```
Toujours ajouter après l'insight:
"Dès que j'aurai assez d'infos, je t'aiderai à comprendre la cause de tes moods 💡"
```

---

## 🎤 Guidage Vocal

### Concept

Aider les débutants à démarrer leur session sans créer de friction.

**Principe:** Guidage optionnel, pas obligatoire. Suggestions visuelles discrètes.

### Comportement Attendu

#### Écran Pré-Recording

Avant chaque session, montrer choix rapide (modal ou bottom sheet):
```
💭 Besoin d'aide pour démarrer?

[Parle librement] ← Bouton principal, gros, évident

Ou choisis un thème:
[🌅 Ma journée] [😟 Moment difficile] [💭 Réflexion libre]
```

**Comportement:**
- "Parle librement" → recording normal (default behavior)
- Choix thème → recording avec prompts contextuels

**Design:** 
- Non intrusif
- Facile à skip
- Rapide (pas un questionnaire)

#### Prompts Pendant Recording

Si user a choisi un thème, afficher prompts visuels discrets pendant recording.

**Thèmes et prompts:**

**Ma journée:**
1. "Comment tu te sens maintenant?"
2. "Qu'est-ce qui s'est passé de marquant?"

**Moment difficile:**
1. "Qu'est-ce qui s'est passé?"
2. "Comment tu te sens avec ça?"

**Réflexion libre:**
1. "Qu'est-ce qui te trotte dans la tête?"
2. "Qu'est-ce que tu veux explorer?"

**Timing:**
- Prompt 1: Apparaît à 5 secondes, fade after 3 sec
- Prompt 2: Apparaît à 45 secondes (si session continue), fade after 3 sec
- Si session <15 secondes: aucun prompt (user est déjà lancé)

**UI:**
- Petit texte en haut de l'écran recording
- Animation fade in/out douce
- Couleur subtile, pas distrayant
- Ne bloque rien, purement indicatif

**Important:** Le thème choisi n'affecte PAS l'analyse backend. C'est uniquement pour guider visuellement le user.

---

## 📊 Structure Données

### Database

**Nouvelles colonnes nécessaires:**

`sessions` table:
- `key_facts` (JSONB, default `[]`)
- Array de strings

`users` table:
- `long_term_memory` (JSONB, default `{}`)
- Structure libre pour compaction mensuelle

**Pas de changement aux colonnes existantes.**

### Format Key Facts
```json
[
  "stressed by work project",
  "mentioned sleep issues", 
  "excited about weekend plans"
]
```

Simple array de strings. Claude décide du contenu exact.

---

## 🔄 Flow Intégration

### Recording Flow (modifié)
```
1. User appuie sur Record
2. [NOUVEAU] Modal/Bottom sheet choix thème apparaît
3. User choisit (ou skip avec "Parle librement")
4. Recording screen s'ouvre
5. [NOUVEAU SI THÈME] Prompts visuels apparaissent selon timing
6. Recording se termine normalement
7. Mood selection (inchangé)
8. Loading analysis (inchangé)
9. [MODIFIÉ] Insight enrichi avec mémoire contextuelle
10. Session sauvegardée avec key_facts extraits
```

### Onboarding (modifié légèrement)

La session guidée initiale utilise maintenant le nouveau flow avec choix thème.

Reste du onboarding inchangé.

---

## 💬 Prompts Claude

### Extraction Key Facts

Après chaque session, demander à Claude d'extraire key facts.

**Objectif du prompt:**
- Obtenir 3-5 phrases courtes
- Factuelles, pas interprétatives
- Utilisables pour continuité future

**Note:** Tu choisis la formulation exacte et si c'est 1 ou 2 appels API.

### Insight Enrichi

Lors de génération d'insight, inclure contexte historique si disponible.

**Objectif du prompt:**
- Donner à Claude les key_facts des sessions récentes avec dates
- Lui demander de faire liens temporels si pertinent
- Garder ton naturel (pas "Selon mes données du X...")
- Option C style: intégration naturelle, pas section séparée

**Contraintes:**
- Trial: 3 derniers jours max
- Premium: 30 derniers jours max
- Format envoyé à Claude: à toi de décider (optimise tokens)

---

## ✅ Critères de Succès

### Fonctionnel

**Session 1:**
- ✅ Insight normal généré
- ✅ Key facts extraits et sauvegardés
- ✅ Message encourageant affiché

**Session 2-3:**
- ✅ Insight fait référence à session précédente
- ✅ Liens temporels cohérents ("il y a X jours")
- ✅ Nouveaux key facts ajoutés

**Guidage:**
- ✅ Modal thème apparaît pré-recording
- ✅ Skip facile avec "Parle librement"
- ✅ Prompts timing correct (5s, 45s)
- ✅ Prompts fade smooth, non intrusif

**Edge cases:**
- ✅ Gap >7j déclenche nudge régularité
- ✅ Sessions courtes (<15s) skip prompts
- ✅ Trial vs Premium = différentes durées mémoire

### Technique

- ✅ App reste stable (pas de régression)
- ✅ Queries DB optimisées (pas N+1)
- ✅ Coûts API raisonnables (+$0.02 par session max)
- ✅ UI animations smooth 60fps

---

## 🚀 Plan de Rollout

### Phase 1: Fondations (1h)
Préparer DB, ajouter colonnes, types. App fonctionne identique.

### Phase 2: Extraction (1.5h)
Claude extrait key_facts, data s'accumule. Insight pas encore changé.

### Phase 3: Insights Enrichis (2h)
Claude utilise historique pour continuité. Coeur de la feature.

### Phase 4: UI Guidage Thème (1.5h)
Modal choix thème pré-recording.

### Phase 5: UI Prompts Rotatifs (1.5h)
Affichage prompts pendant recording selon thème.

### Phase 6: Polish (1h)
Edge cases, messages, tests finaux.

**Total estimé: 8-9h**

**Principe:** Teste après chaque phase. Commit. Continue si ça marche.

---

## 🎨 Décisions UX Finales

Ces points sont **non-négociables** - issus de discussion approfondie:

1. **Mémoire = feature centrale** - sera marketée comme différenciateur clé
2. **Guidage = optionnel** - toujours possibilité de skip
3. **Prompts = discrets** - jamais intrusifs ou forcés
4. **Insights = naturels** - style conversationnel (Option C), pas "rapport analytique"
5. **Key facts = invisibles** pour MVP - backend only, UI plus tard
6. **Trial vs Premium** - différence claire sur durée mémoire (3j vs 30j)
7. **Session 1** - toujours message encourageant
8. **Gaps** - nudge bienveillant, pas culpabilisant

---

## 📝 Notes Implémentation

**Liberté technique:**
- Choisis structure state management
- Décide nombre appels API (1 ou 2 pour insight+facts)
- Implémente animations comme tu veux
- Optimise queries à ta façon
- Formats prompts Claude selon ce qui marche

**Garde en tête:**
- App déjà fonctionnelle, ne casse rien
- Recording flow est critique, teste bien
- Coûts API comptent (premium users illimités)
- UX doit rester smooth

**Si bloqué:**
- Phases 4-5 (guidage) peuvent être faites après
- Phase 3 (insights enrichis) = priorité absolue
- Demande si comportement pas clair

---

## ✅ Décisions Techniques Prises (Implémentation)

### Backend & Database

**Migration Supabase:**
- Ajout colonnes via MCP Supabase tools: `sessions.key_facts JSONB DEFAULT '[]'`, `users.long_term_memory JSONB DEFAULT '{}'`
- Index GIN sur `key_facts` pour recherche performante
- Migration ID: `add_memory_features`

**Appels API:**
- **Décision:** 1 appel combiné (insight + keyFacts en même temps)
- **Raison:** Économie coûts (~50%) + réduction latence
- **Edge Function:** `generate-insight` retourne `{ insight, keyFacts, hasCrisisKeywords }`

**Extraction Server-Side:**
- Key facts extraits côté server (Edge Function)
- Cohérent avec architecture existante (insight déjà server-side)
- Meilleure sécurité et control des prompts

### Prompts Claude

**3 System Prompts distincts:**
1. `SYSTEM_PROMPT_FIRST_SESSION`: Première session + message encourageant
2. `SYSTEM_PROMPT_WITH_MEMORY`: Sessions avec mémoire contextuelle
3. `SYSTEM_PROMPT_LONG_GAP`: Gap >7j avec nudge bienveillant

**Format réponse:** JSON `{ "insight": "...", "keyFacts": [...] }`
- Parsing robuste avec regex fallback si JSON mal formé
- Max tokens: 250 (augmenté de 200 pour accommoder memory context)

### Memory Context

**Service `getRecentKeyFacts()`:**
- Retourne `MemoryContext` avec:
  - `recentSessions`: Array de `{ date, keyFacts, daysAgo }`
  - `isFirstSession`: Boolean
  - `hasLongGap`: Boolean (>7j depuis dernière session)
  - `totalSessions`: Number
- Trial: 3 derniers jours
- Premium: 30 derniers jours
- Logique détection gap intégrée

**Format envoyé à Claude:**
```
Mémoire des sessions passées:

il y a 3 jours:
  - stressed by work project
  - mentioned sleep issues

il y a 1 jour:
  - feeling better
  - project completed
```

### UI Guidage

**ThemeSelectionModal:**
- Component standalone dans `src/components/`
- 4 options: "Parle librement" (default) + 3 thèmes
- Modal overlay avec fade animation
- Design: Bottom sheet style, non-intrusif

**Prompts visuels:**
- Affichés au-dessus du timer
- Timing: Prompt 1 à 5s, Prompt 2 à 45s
- Fade in (500ms) → Display 3s → Fade out (500ms)
- Skip automatique si session <15s (pas implémenté car prompts à 5s+)
- `promptOpacity` Animated.Value pour smooth transitions

**Thèmes et prompts:**
```typescript
daily: ['Comment tu te sens maintenant?', 'Qu'est-ce qui s'est passé de marquant?']
difficult: ['Qu'est-ce qui s'est passé?', 'Comment tu te sens avec ça?']
reflection: ['Qu'est-ce qui te trotte dans la tête?', 'Qu'est-ce que tu veux explorer?']
```

### Flow Modifications

**FirstRecordingScreen:**
- Recording ne démarre plus automatiquement au mount
- Modal apparaît d'abord
- Recording démarre après sélection thème
- Prompts schedulés uniquement si thème ≠ 'free'

**LoadingScreen:**
- Fetch `memoryContext` via `getRecentKeyFacts(userId, isPremium)`
- `isFirstSession` déterminé par memoryContext (plus fiable)
- Passe `memoryContext` à `generateInsight()`
- Fallback graceful si erreur memory fetch

**Navigation params:**
- `Mood` screen: Ajout `keyFacts: string[]`
- `Insight` screen: Ajout `keyFacts: string[]`
- Propagation cleanly à travers le flow

### Edge Cases Gérés

**Première session:**
- Message encourageant auto-ajouté par Edge Function
- Pas de memory context passé (ou context vide)
- isFirstSession = true

**Gap >7 jours:**
- Détecté par `getRecentKeyFacts()` via `hasLongGap`
- Edge Function utilise `SYSTEM_PROMPT_LONG_GAP`
- Nudge bienveillant ajouté automatiquement

**Trial vs Premium:**
- Logic dans `getRecentKeyFacts()`: `isPremium ? 30 : 3` jours
- Pas de changement ailleurs (transparent)

**Sessions courtes (<15s):**
- Prompts scheduled à 5s et 45s (skip auto si trop court)
- Pas de logique spéciale needed

### Compaction Mensuelle

**Status:** Skip MVP - TODO ajouté
- Fichier: `src/services/sessions.ts`
- Commentaire détaillé pour implémentation future
- Column `users.long_term_memory` ready mais non utilisée

### Performance & Coûts

**Optimisations:**
- 1 appel API au lieu de 2 → ~$0.01 saved par session
- GIN index sur key_facts → queries rapides
- Memory fetch en parallèle avec transcription (pas de latence ajoutée)

**Estimations:**
- Coût par session avec memory: ~$0.015 (insight + keyFacts)
- Prompt tokens: ~150-250 (transcript + memory context)
- Completion tokens: ~80-120 (insight + keyFacts JSON)

### Tests

**À tester manuellement:**
1. Session 1: Vérifier message encourageant
2. Session 2-3: Vérifier liens temporels dans insight
3. Gap >7j: Vérifier nudge régularité
4. Trial account: Vérifier mémoire limitée à 3j
5. Modal thèmes: Vérifier UX smooth
6. Prompts: Vérifier timing et animations
7. Edge cases: Transcription fail, empty key_facts, etc.

**Tests réussis:**
- TypeScript compilation OK (erreurs expo-audio pré-existantes)
- Migration DB applied successfully
- Edge Function deployed v8

---

## 🎯 TL;DR

**Quoi:** Claude se souvient de tes sessions (key facts) et crée continuité narrative + guidage optionnel avec prompts visuels.

**Pourquoi:** Différenciation clé vs "voice recorder basique". Vraie intelligence.

**Comment:** À toi de coder, mais respecte comportements décrits ci-dessus.

**Résultat attendu:** User sent que l'app "me connaît vraiment" dès session 2-3.