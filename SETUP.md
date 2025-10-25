# MindCheck Setup Instructions

## Phase 3.5 - Recording Flow Complete ✅

### Required API Keys Configuration

The recording flow requires two Edge Function secrets to be configured in Supabase:

#### 1. OpenAI API Key (for Whisper transcription)

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Go to Supabase Dashboard → Your Project → Project Settings → Edge Functions
3. Add secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (your OpenAI API key)

#### 2. Anthropic API Key (for Claude insights)

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Go to Supabase Dashboard → Your Project → Project Settings → Edge Functions
3. Add secret:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-...` (your Anthropic API key)

### Verifying Setup

Once you've added the API keys:

1. Restart your Expo dev server (`npm start`)
2. Complete the onboarding flow through Screen 5
3. The recording screen should:
   - Start recording automatically
   - Show animated soundwave bars
   - Display timer
4. After clicking "Terminer":
   - Transcription should work (check logs for "Whisper service error")
   - Insight generation should work (check logs for "Claude service error")
   - Session should save successfully

### Troubleshooting

**Error: "Edge Function returned a non-2xx status code"**
- API keys are not set or incorrect in Supabase Edge Function secrets
- Check Supabase Dashboard → Edge Functions → Logs for details

**Error: "Property 'crypto' doesn't exist"**
- Fixed ✅ (now using `uuid` package)

**Error: "The action 'RESET' with payload was not handled"**
- Fixed ✅ (PaywallScreen now uses state update instead of navigation reset)

**Error: "Session activation failed" (iOS audio)**
- Fixed ✅ (Audio mode configuration updated)

### Current Flow

1. **Onboarding Screens 1-4**: Questionnaire
2. **Onboarding Screen 5**: "Tu es prêt!" → mic button
3. **FirstRecordingScreen**: Auto-records, shows timer + soundwave
4. **LoadingScreen**: Calls Claude API (uses onboarding context)
5. **MoodScreen**: Slider 1-10
6. **InsightScreen**: Shows insight + blurred fake patterns, saves session to DB
7. **PaywallScreen**:
   - "Sauvegarder mon contenu" → Placeholder (RevenueCat IAP coming)
   - "Plus tard" → **7-day trial activated** → MainTabs

### Storage Bucket Configuration

The audio recordings are stored in Supabase Storage bucket `audio-recordings`.

**Path format**: `{user_id}/{session_id}.m4a`

**Note**: Row Level Security policies may need manual configuration in Supabase Dashboard if you encounter upload errors.

### Next Steps

- [ ] Set OPENAI_API_KEY in Supabase Edge Functions
- [ ] Set ANTHROPIC_API_KEY in Supabase Edge Functions
- [ ] Test full onboarding flow
- [ ] Verify transcription works
- [ ] Verify insight generation works
- [ ] Verify session saves to database

Once these are complete, Phase 3.5 will be fully functional!
