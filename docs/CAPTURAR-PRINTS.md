# 📸 Guia de Captura de Prints e Vídeo (Demonstração Visual)

Este guia explica como gerar a documentação visual obrigatória do CP2.

> ⚠️ **Importante:** README sem prints e sem vídeo/GIF = **−50%** na nota de Documentação. Não pule esta etapa.

---

## 1. Prints de TODAS as telas (mínimo 1 por tela)

Lista de prints obrigatórios:

- [ ] `screenshots/01-login.png` — tela de login
- [ ] `screenshots/02-cadastro.png` — tela de cadastro (mostrar com erros inline)
- [ ] `screenshots/03-home.png` — tela Início (Home)
- [ ] `screenshots/04-cardapio.png` — Cardápio com itens visíveis
- [ ] `screenshots/05-cardapio-busca.png` — Cardápio com busca filtrando
- [ ] `screenshots/06-cardapio-carrinho.png` — Cardápio com itens no carrinho (barra inferior)
- [ ] `screenshots/07-confirmacao.png` — Confirmação com a senha gerada
- [ ] `screenshots/08-pedidos.png` — tela Pedidos com 1+ pedido
- [ ] `screenshots/09-perfil.png` — tela Perfil
- [ ] `screenshots/10-sobre.png` — tela Sobre
- [ ] `screenshots/11-light-theme.png` — exemplo do app com tema claro

### Como capturar

#### iOS Simulator
1. Com o app rodando, pressione `Cmd + S` no simulador.
2. O print é salvo na Área de Trabalho.

#### Android Emulator
1. Use o botão de câmera na barra lateral do emulador.
2. O print vai pra `~/Pictures/`.

#### Celular físico (Expo Go)
1. **iPhone:** botão lateral + botão de aumentar volume juntos.
2. **Android:** botão lateral + botão de diminuir volume juntos.
3. Transfira via AirDrop/Drive/USB.

### Após capturar
1. Salve os prints em `screenshots/` com os nomes da lista acima.
2. Faça commit + push.

---

## 2. GIF ou Vídeo do fluxo completo

Demonstrar o fluxo: **cadastro → login → cardápio → pedido → confirmação → pedidos → perfil → logout**.

### Opção A — GIF (recomendado para README)

#### Mac
1. Use `kap` (https://getkap.co/) ou `cleanshot X`.
2. Grave a tela do simulador iOS por ~30-60 segundos.
3. Exporte como GIF (qualidade média, max ~5MB).
4. Salve em `screenshots/demo.gif`.

#### Android Studio Emulator
1. Botão de câmera de vídeo na barra lateral → "Record Screen".
2. Exporte e converta MP4 → GIF com `ffmpeg`:
   ```bash
   ffmpeg -i video.mp4 -vf "fps=15,scale=320:-1:flags=lanczos" -c:v gif demo.gif
   ```

### Opção B — Vídeo no YouTube/Drive

1. Grave vídeo de qualquer fonte (simulador, celular, screen recording).
2. Suba no YouTube (não-listado) ou Google Drive (link público).
3. Cole o link no README na seção "Vídeo do fluxo completo".

---

## 3. Atualizar o README

Depois de gerar os prints e o vídeo:

1. Abra o `README.md`.
2. Substitua a linha:
   ```markdown
   > 🎬 [Link do vídeo no YouTube/Drive — adicionar antes da entrega]
   ```
   pelo seu link real.

3. Opcionalmente, embeda os prints diretamente na seção "Demonstração". Exemplo:
   ```markdown
   ### 1. Login
   ![Login](./screenshots/01-login.png)
   ```

---

## 4. Checklist final antes da entrega

- [ ] Todos os 11 prints estão em `screenshots/`
- [ ] GIF (`demo.gif`) ou link de vídeo no README
- [ ] README mostra prints inline ou linka pra `screenshots/`
- [ ] Repositório público no GitHub
- [ ] Branch `main` está com `npx expo start` rodando sem erros
- [ ] `npm run typecheck` retorna exit code 0
- [ ] Todos os 4 integrantes têm commits descritivos no histórico (verificar com `git log --pretty=format:"%h %an %s" | sort -u -k2`)

---

FIAP — Mobile Development & IoT — 2026
