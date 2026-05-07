# Mobile Deploy — App Cantina

Guia de distribuição do app mobile (Android via Expo). O projeto é **mobile-only** desde 2026-05-06 — não há mais bundle web. Pra deploy do backend (Render + Neon), ver [DEPLOY.md](./DEPLOY.md).

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Build APK local](#build-apk-local)
3. [Instalar APK no celular](#instalar-apk-no-celular)
4. [Dev no emulador](#dev-no-emulador-fluxo-diário)
5. [Pegadinhas](#pegadinhas)
6. [Checklist antes de distribuir](#checklist-antes-de-distribuir)
7. [📌 Quando ativar EAS Update + Expo Go](#-quando-ativar-eas-update--expo-go)
8. [📌 Quando migrar pra Internal Testing no Google Play](#-quando-migrar-pra-internal-testing-no-google-play)

---

## Pré-requisitos

Você roda **uma vez por máquina**.

### 1. Conta Expo

- Cria em [expo.dev/signup](https://expo.dev/signup) (gratuito)
- Anota usuário/email/senha

### 2. Android Studio

- Baixa em [developer.android.com/studio](https://developer.android.com/studio)
- Abre uma vez → **SDK Manager** → instala:
  - **Android SDK Platform** (API 34+)
  - **Android SDK Build-Tools**
  - **Android SDK Command-line Tools**
- Cria um AVD em **Device Manager** (ex: Pixel 7, API 34)
- **Pode fechar o Android Studio depois** — emulador roda via CLI (ver [Pegadinhas](#pegadinhas))

### 3. JDK 17

Android Gradle Plugin atual exige Java 17:

```bash
brew install --cask zulu@17
```

### 4. Variáveis de ambiente

Adiciona em `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

Depois `source ~/.zshrc`.

### 5. EAS CLI

```bash
pnpm add -g eas-cli
eas login          # com sua conta Expo
```

### 6. Validação rápida

```bash
adb --version          # deve listar Android Debug Bridge
emulator -list-avds    # deve listar seu AVD
java -version          # deve dizer "17.x.x"
eas whoami             # deve mostrar seu usuário Expo
```

---

## Build APK local

A partir da raiz do monorepo:

```bash
pnpm mobile:build:apk
```

Esse script roda `cd apps/mobile && eas build --local --profile preview --platform android`. O profile `preview` está configurado em [apps/mobile/eas.json](../apps/mobile/eas.json) com:

- `buildType: "apk"` — gera `.apk` instalável direto (não AAB)
- `EXPO_PUBLIC_API_URL=https://cantina-api.onrender.com` — APK fala com o backend de produção em qualquer rede

**Tempo:** ~10-15min na primeira vez (baixa Gradle, dependências). ~3-5min nas seguintes (cache).

**Output:** `apps/mobile/build-XXXXXXXXXX.apk` no terminal aparece o caminho.

### Variantes

```bash
pnpm mobile:build:aab    # gera .aab (Android App Bundle) pra Play Store
```

---

## Instalar APK no celular

Duas opções:

### Opção A — Via USB

1. Liga o celular Android no Mac via USB
2. No celular: **Configurações → Sobre → toca em "Build Number" 7 vezes** pra ativar modo desenvolvedor
3. **Configurações → Sistema → Opções do desenvolvedor → ativa "Depuração USB"**
4. Confirma o diálogo de autorização que aparece no celular
5. No Mac:

```bash
adb install apps/mobile/build-XXXXXXXXXX.apk
```

Se já tiver versão anterior instalada e der erro de assinatura:
```bash
adb install -r apps/mobile/build-XXXXXXXXXX.apk   # -r = reinstall
```

### Opção B — Sem cabo

1. Manda o `.apk` por Telegram/WhatsApp/Drive pra você mesmo
2. No celular, abre o arquivo
3. Android pede pra **permitir instalação de fontes desconhecidas** (aviso amarelão é normal)
4. Confirma e instala

---

## Dev no emulador (fluxo diário)

Não use `eas build` pra iterar — é lento. Use o fluxo Expo direto:

```bash
# Terminal 1 — emulador headless
emulator -avd <nome_avd>

# Terminal 2 — API + Metro
pnpm dev

# Terminal 3 (uma vez ou após mudança nativa)
pnpm mobile:android
```

Edições em arquivos `.tsx`/`.ts` do mobile fazem **hot reload** automático no emulador (~1-2s).

### Atalhos no terminal Metro

Quando `pnpm dev` está rodando, no terminal você pode apertar:
- `r` — reload manual no emulador
- `j` — abre React Native DevTools (Inspector + Network + console)
- `m` — toggle menu do dev no emulador

---

## Pegadinhas

### Mac com pouca RAM

Android Studio pesa ~5GB de RAM aberto. **Depois de criar o AVD, fecha o IDE** — emulador roda independente via CLI:

```bash
emulator -avd <nome_avd> -no-snapshot-save -no-boot-anim
```

Consumo cai pra ~2GB. Mac com 8GB aguenta isso + Metro + API + VS Code.

Se ainda travar:
- Fecha Slack, Spotify, Chrome com muitas tabs
- Cria um AVD menor (Pixel 4a com API 34, sem Google Play Services)
- Ajusta cold boot vs quick boot no Device Manager

### Build EAS local quebra em macOS

Erros comuns:

| Erro | Causa | Fix |
|---|---|---|
| `JAVA_HOME is not set` | Variável de ambiente faltando | Reabre terminal após editar `~/.zshrc` |
| `SDK location not found` | `ANDROID_HOME` não setado | Mesmo motivo |
| `Could not find tools.jar` | JDK errado (8 ou 11) | Garante Zulu 17: `java -version` |
| Build trava em "Configure project" | Gradle daemon corrompido | `cd apps/mobile/android && ./gradlew --stop && cd ../../..` (se tiver pasta android, senão limpa cache `~/.gradle`) |

### Render hibernando (free tier)

Render free hiberna após 15min sem tráfego. **Primeira request depois de hibernar demora ~30s** — APK aparece com loading prolongado.

Mitigações:
- Aceitar (é portfolio, não produção)
- Cron-ping a cada 10min via [cron-job.org](https://cron-job.org) batendo em `https://cantina-api.onrender.com/api/v1/health`
- Migrar pra plano pago do Render ($7/mês) que não hiberna

### `ALLOWED_ORIGINS` em prod com placeholder

Mobile native **não usa CORS** (não é um navegador). Mas o validator em [apps/api/src/env.ts](../apps/api/src/env.ts) faz fail-fast se `ALLOWED_ORIGINS` estiver vazio em prod.

Solução no painel Render: setar um placeholder seguro tipo:
```
ALLOWED_ORIGINS=https://cantina-mobile-only.local
```

Não afeta o app (mobile não envia `Origin` header), só satisfaz o validator.

---

## Checklist antes de distribuir

- [ ] Backend Render está respondendo (`curl https://cantina-api.onrender.com/api/v1/health`)
- [ ] `pnpm -r typecheck` passa
- [ ] `pnpm -r test` passa
- [ ] Versão atualizada em `apps/mobile/app.json` (`"version": "X.Y.Z"`)
- [ ] Testou o APK no emulador antes de instalar no celular
- [ ] Login + criar pedido + ver histórico funcionam fim-a-fim
- [ ] Commit das mudanças (autor `jota0802`, conventional PT)

---

## 📌 Quando ativar EAS Update + Expo Go

Quando quiser publicar updates "ao vivo" sem precisar gerar APK novo (perfeito pra demos):

```bash
# Uma vez, configura o projeto pra EAS Update
cd apps/mobile
eas update:configure

# Cada vez que quer publicar update
eas update --branch preview --message "ajusta X"
```

Quem tem o app instalado (via APK gerado com runtime EAS Update integrado, ou abrindo via Expo Go) recebe a atualização na próxima abertura. Sem reinstalação.

**Free tier EAS Update:** 1000 MAUs (Monthly Active Users), suficiente pra portfolio e demo.

**Trade-off:** updates só substituem JS bundle. Mudanças nativas (adicionar pacote nativo, mudar permissões, etc) ainda exigem rebuild do APK.

---

## 📌 Quando migrar pra Internal Testing no Google Play

Custa **$25 one-time** (Google Play Console) e dá:

- App instala via Play Store ("parece app de verdade", sem aviso de "fonte desconhecida")
- Distribuição por link/email a testadores convidados (até 100)
- Crash reports e stats automáticos
- Pode promover pra Closed Testing → Open Testing → Production

Passos resumidos:
1. Cria conta em [play.google.com/console](https://play.google.com/console) ($25)
2. Cria a app no console
3. Gera AAB: `pnpm mobile:build:aab`
4. Sobe AAB → Internal Testing
5. Adiciona email dos testadores na lista
6. Copia o link de opt-in e compartilha

Pra publicação pública (loja aberta), revisão manual leva 1-7 dias. Política da Play Store é mais rígida — vai precisar:
- Privacy policy (URL pública, ex: GitHub Pages)
- Descrição em PT/EN
- Screenshots de cada tela
- Categoria + classificação etária

iOS (Apple) é processo separado: $99/ano + Apple Developer Program. Fora de escopo do portfolio atual.
