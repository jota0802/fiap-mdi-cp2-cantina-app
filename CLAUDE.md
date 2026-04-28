# App Cantina FIAP — Instruções para o Claude

## O que é
**CP2 (Checkpoint 2)** da matéria Mobile Development & IoT da FIAP — aplicativo Expo + TypeScript de pedidos da cantina, evolução do CP1, com auth + persistência + Context API + validação inline + diferenciais técnicos.

📖 **Antes de qualquer coisa, leia os 2 docs de handoff:**
- [`docs/HANDOFF.md`](./docs/HANDOFF.md) — estrutura completa, comandos, decisões técnicas, integrantes git
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — top 8 + 30 melhorias priorizadas

## Comandos críticos

```bash
npx tsc --noEmit          # TypeScript strict (deve sair com exit 0)
npm test                  # 26 testes Node (validation + hash + cart)
npx expo-doctor           # Config Expo (deve dar 18/18)
npx expo start            # Dev server
npx expo install <pkg>    # Adicionar dep (NUNCA usar npm install direto pra pacotes Expo)
```

**Roda os 3 primeiros antes de cada commit.** Se algum quebrar, conserta antes de seguir.

## Convenções inegociáveis

1. **TypeScript strict + `noUncheckedIndexedAccess`** — `array[i]` retorna `T | undefined`, sempre tratar com `?? default` ou guard.
2. **Path alias `@/`** — `import X from '@/components/X'`, nunca `'../../components/X'`.
3. **Cores via tema** — `const { colors } = useTheme()`. Zero cor hardcoded em telas. Cores ficam em [`constants/theme.ts`](./constants/theme.ts).
4. **Styles dinâmicos** — padrão `const styles = useMemo(() => createStyles(colors), [colors])` + `function createStyles(c: ThemeColors) { return StyleSheet.create({ ... }) }`.
5. **Storage keys** — sempre via [`constants/storage-keys.ts`](./constants/storage-keys.ts), nunca strings literais.
6. **Cart e Orders são isolados por usuário** (sufixo `:{userId}` na chave).
7. **Validação centralizada** em [`lib/validation.ts`](./lib/validation.ts). Quando criar regra nova, **adicionar teste correspondente em `test/`**.
8. **Sem `Alert` em formulários** — erros sempre inline, vermelho, abaixo do campo.
9. **`useSafeAreaInsets()`** nos headers (suporte a notch/Dynamic Island).
10. **`Pressable` em vez de `TouchableOpacity`** quando precisar de feedback visual avançado (ripple Android, etc.).

## Commits

- **Mensagens em PT, conventional commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **Distribuir entre os 4 integrantes** trocando `git config user.name/email` antes de cada commit. Lista no [`docs/HANDOFF.md`](./docs/HANDOFF.md).
- **Distribuição atual:** lucksza=11 · jota0802=12 · DevRuanVieira=11 · roji-menez=9 → **priorizar `roji-menez`** se tiver chance (ele tá com menos commits).
- **Nunca** `update`, `fix`, `asdfsdf` como mensagem — penaliza nota Git.

## Pegadinhas

- **`cd` não persiste entre comandos Bash.** O cwd default é `/Users/johnny/Downloads/cp-mobile`, **não** `app-cantina`. Sempre prefixar `cd /Users/johnny/Downloads/cp-mobile/app-cantina && ...` em comandos.
- **Path com parêntese** (`(auth)`, `(tabs)`) precisa de aspas: `"app/(tabs)/x.tsx"` ou escape `app/\(tabs\)/x.tsx`.
- **SecureStore não funciona no web** — fallback automático para AsyncStorage com prefix `__secure__:` (ver [`lib/secure-store.ts`](./lib/secure-store.ts)).
- **Notifications no Expo Go iOS** pedem permissão (vai pedir na hora). Simulador iOS pode não disparar agendadas — testar em device real.
- **Background `expo start` não imprime QR code** (sem TTY). Pra ver, `--tunnel` + `curl http://localhost:4040/api/tunnels`.

## Stack & dependências chave

Expo SDK 55 · TypeScript 5 strict · React 19 · React Native 0.83.6 · Expo Router 55 · @react-native-async-storage/async-storage · expo-secure-store · expo-crypto · expo-notifications · expo-image-picker · expo-haptics · @expo-google-fonts/manrope · react-native-svg · react-native-safe-area-context · @expo/vector-icons (Ionicons).

## Próximos passos

Implementar o **top 8** do [`docs/ROADMAP.md`](./docs/ROADMAP.md). Sequência sugerida: 1 (Carrinho) → 6 (filtro chips) → 5 (imagens reais) → 2 (Home renovada) → 3 (Pedir de novo) → 7 (Editar perfil) → 8 (QR Code) → 4 (Onboarding).
