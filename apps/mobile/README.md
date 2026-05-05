# @cantina/mobile

App Expo + TypeScript pro cantina FIAP. Consome a API (`@cantina/api`) via React Query.

## Stack

- **Expo SDK 55** + **expo-router 55** (file-based routing)
- **React 19** · **React Native 0.83**
- **TypeScript 5 strict** + `noUncheckedIndexedAccess`
- **TanStack Query v5** + **AsyncStorage persister** (cache 24h)
- **Hono client** via `apiFetch<T>` (lib/api/client.ts)
- **JWT em SecureStore** (`auth_token` key, fallback AsyncStorage no web)
- **Manrope** fonts via `@expo-google-fonts/manrope`
- **react-native-qrcode-svg** · **expo-image** · **expo-haptics** · **expo-blur** · **expo-image-picker** · **expo-notifications**

## Stacks que NAO usa (intencional)

- Redux/Zustand — Context API + RQ e suficiente
- Tailwind/Nativewind — StyleSheet + theme tokens (`useTheme()`)
- Reanimated — Animated API nativa cobre o que precisa hoje

## Dev

```powershell
# Subir API local primeiro (em outro terminal)
pnpm --filter @cantina/api dev

# Mobile
pnpm start
```

Abrir Expo Go (iOS/Android) e escanear QR. No Android emulator, ajustar `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787` em `.env.development` (em vez de localhost).

## Tests

```powershell
pnpm test           # testes (cart + recomendacao via Node --experimental-strip-types)
```

`validation` e `auth` schemas vivem em `@cantina/shared` e sao testados la (Vitest).

## Build prod

```powershell
# Web (testar bundle):
pnpm exec expo export --platform web --output-dir /tmp/test-export

# iOS/Android (EAS build):
pnpm exec eas build --platform all --profile production
```

(EAS profile nao esta configurado neste repo ainda — adicionar em sub-projeto seguinte.)

## Env vars

- `EXPO_PUBLIC_API_URL` — base URL do backend. Default `http://localhost:8787`. Em prod, apontar pro Render. **Baked-in no bundle no build time** — trocar exige rebuild.

## Estrutura principal

- `app/` — telas (Expo Router file-based)
- `components/` — UI reutilizavel
- `context/` — providers (Theme, Locale, Auth, Cart, Orders, Favorites)
- `lib/api/` — cliente HTTP + hooks RQ
- `lib/` — helpers (haptics, image-picker, secure-store, item-emoji)
- `constants/` — theme tokens + storage keys
- `types/` — re-exports de `@cantina/shared` + tipos so-mobile

## Deploy

Mobile e distribuido via Expo Go (dev) ou EAS Build (prod, futuro).
A API que consome esta em `../../docs/DEPLOY.md`.
