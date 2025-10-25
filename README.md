# MindCheck MVP

Un journal vocal intelligent avec insights AI pour le bien-être mental.

## Phase 1 - Setup Initial ✓

### Structure du projet

```
mindcheck/
├── src/
│   ├── screens/          # Écrans de l'app
│   │   ├── auth/         # Welcome, Signup, Login
│   │   ├── onboarding/   # Questionnaire + First Session
│   │   ├── home/         # Recording screen
│   │   ├── calendar/     # Calendar + Session Detail
│   │   ├── stats/        # Dashboard
│   │   └── settings/     # Settings
│   ├── components/       # Composants réutilisables
│   ├── navigation/       # React Navigation setup
│   ├── services/         # API clients (Supabase, Whisper, Claude)
│   ├── store/           # Zustand state management
│   ├── utils/           # Helpers, constants
│   └── types/           # TypeScript types
├── assets/              # Images, fonts
└── docs/               # Documentation & specs
```

### Dépendances installées

**Navigation:**
- `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`

**Audio & File:**
- `expo-av`, `expo-file-system`

**UI:**
- `react-native-calendars`, `react-native-reanimated`

**Backend:**
- `@supabase/supabase-js`, `@anthropic-ai/sdk`, `openai`

**State & Storage:**
- `zustand`, `@react-native-async-storage/async-storage`, `expo-secure-store`

**Monetization:**
- `react-native-purchases` (RevenueCat)

### Configuration

**Variables d'environnement (.env.local):**
```
EXPO_PUBLIC_SUPABASE_URL=https://jtwiuzqliphuonmktwqi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

**Supabase Database:** ✅ Configuré
- Tables: `users`, `sessions`, `messages` (avec RLS + policies)
- Migrations: 4 migrations appliquées
- Extensions: UUID enabled
- Voir `docs/SUPABASE_COMPLETE.md` pour détails

**Configuration manuelle requise:**
- ⚠️ Storage bucket "audio-recordings" (voir docs/SUPABASE_COMPLETE.md)
- ⚠️ Email/Password auth provider (voir docs/SUPABASE_COMPLETE.md)

### Lancer le projet

```bash
# Installer les dépendances (déjà fait)
npm install

# Lancer en développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android

# Lancer sur Web
npm run web
```

### Prochaines étapes (Phase 2)

- [ ] Créer les écrans d'authentification (Welcome, Signup, Login)
- [ ] Implémenter le flow d'onboarding (questionnaire 5 écrans)
- [ ] Développer l'écran de recording avec transcription
- [ ] Intégrer Whisper API pour transcription
- [ ] Intégrer Claude API pour insights
- [ ] Créer le calendar view avec mood emojis
- [ ] Implémenter le dashboard de stats
- [ ] Ajouter le paywall avec tactiques de conversion

### Architecture technique

**Stack:**
- React Native (Expo SDK 54)
- TypeScript
- Supabase (Auth + Database + Storage)
- OpenAI Whisper (transcription)
- Anthropic Claude (insights)
- RevenueCat (IAP)

**Design patterns:**
- Component-based architecture
- Zustand pour state management global
- Service layer pour les API calls
- TypeScript strict mode

---

**Version:** 1.0.0-alpha
**Timeline:** 4.5 semaines
**Status:** Phase 1 Complete ✓
