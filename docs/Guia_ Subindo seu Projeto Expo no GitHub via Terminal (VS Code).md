# Guia_ Subindo seu Projeto Expo no GitHub via Terminal (VS Code)

Guia: Subindo seu Projeto Expo no GitHub via
Terminal (VS Code)
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​Pré-requisitos
Antes de começar, certifique-se de ter:
[ ] VS Code instalado → code.visualstudio.com
[ ] Node.js instalado → nodejs.org
[ ] Expo CLI instalado ( npm install -g expo-cli )
[ ] Git instalado → git-scm.com
[ ] Conta no GitHub criada → github.com
[ ] Um projeto Expo já criado (ex: npx create-expo-app meu-app )
  ⁠
​Visão Geral do Processo
Projeto local (VS Code) → Repositório local (Git) →
1
​
⁠
  ⁠
​meu-app git init / add / commit
2
 
3
Repositório remoto (GitHub)
4
git push
5
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 1/8
Passo 1 — Abrir o Terminal Integrado no VS Code
Abra o VS Code
1.
Abra a pasta do seu projeto: File → Open Folder... e selecione a pasta do seu projeto Expo
2.
Abra o terminal integrado com um dos métodos abaixo:
3.
  Dica: O terminal abre automaticamente na pasta do seu projeto. Confirme isso vendo o caminho exibido no
prompt.
Passo 2 — Verificar se o Git está Instalado
No terminal, digite:
git --version
1
Resultado esperado:
git version 2.43.0
1
Se aparecer um erro como command not found , instale o Git em e reinicie o VS Code.
git-scm.com
Passo 3 — Configurar seu Usuário no Git (somente na 1ª vez)
O Git precisa saber quem está fazendo as alterações. Configure seu nome e e-mail iguais aos da sua conta GitHub:
git config --global user.name "Seu Nome Aqui"
1
git config --global user.email "seu-email@exemplo.com"
2
Verificar se ficou salvo:
git config --global --list
1
Resultado esperado:
user.name=Seu Nome Aqui
1
user.email=seu-email@exemplo.com
2
  Atenção: Use o mesmo e-mail cadastrado no GitHub para que seus commits apareçam vinculados ao seu perfil.
Passo 4 — Inicializar o Repositório Git Local
Dentro da pasta do seu projeto, execute:
Atalho de teclado Ctrl + ` (Windows/Linux) ou Cmd + ` (Mac)
Menu Terminal → New Terminal
Paleta de comandos Ctrl+Shift+P → digite "Toggle Terminal"
Método Como fazer
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 2/8
git init
1
Resultado esperado:
Initialized empty Git repository in /caminho/do/seu/projeto/.git/
1
  O que aconteceu? O Git criou uma pasta oculta .git dentro do seu projeto. Ela guarda todo o histórico de
versões. Não apague essa pasta!
Passo 5 — Verificar o .gitignore do Expo
O Expo já cria um arquivo .gitignore automaticamente ao criar o projeto. Ele evita que arquivos desnecessários
(como a pasta node_modules ) sejam enviados ao GitHub.
Verifique se o arquivo existe:
cat .gitignore
1
Você deve ver algo parecido com:
node_modules/
1
.expo/
2
dist/
3
npm-debug.*
4
*.jks
5
*.p8
6
*.p12
7
*.key
8
*.mobileprovision
9
*.orig.*
10
web-build/
11
.DS_Store
12
  Se o arquivo existir, ótimo! Não precisa fazer nada.
  Se não existir, crie-o com o comando abaixo:
echo "node_modules/
1
.expo/
2
dist/
3
web-build/
4
.DS_Store" > .gitignore
5
Passo 6 — Adicionar os Arquivos ao Stage (Área de Preparação)
O Git usa um sistema de "stage" — você escolhe quais arquivos quer incluir no próximo commit.
Para adicionar TODOS os arquivos do projeto:
git add .
1
Para verificar o que foi adicionado:
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 3/8
git status
1
Resultado esperado:
On branch main
1
No commits yet
2
Changes to be staged:
3
(use "git rm --cached <file>..." to unstage)
4
new file: .gitignore
5
new file: App.js
6
new file: app.json
7
new file: package.json
8
...
9
  O que é o "stage"? Imagine que você está preparando uma encomenda para enviar. O git add coloca os itens
na caixa. O git commit (próximo passo) fecha e lacra a caixa.
Passo 7 — Criar o Primeiro Commit
O commit é um "ponto de salvamento" no histórico do projeto. Sempre escreva uma mensagem descritiva:
git commit -m "feat: primeiro commit - projeto Expo criado"
1
Resultado esperado:
[main (root-commit) a1b2c3d] feat: primeiro commit - projeto Expo criado
1
10 files changed, 250 insertions(+)
2
create mode 100644 .gitignore
3
create mode 100644 App.js
4
...
5
  Dica de mensagens de commit: Use verbos no infinitivo e seja descritivo.
  feat: adiciona tela de login
  fix: corrige bug no botão de cadastro
  arrumei umas coisas
Passo 8 — Criar o Repositório no GitHub
Acesse e faça login
1. github.com
Clique no botão "New" (ou o ícone "+" no canto superior direito → "New repository")
2.
Preencha as informações:
3.
Repository name Nome do seu projeto (ex: meu-app-expo )
Description Uma descrição breve (opcional)
Visibility Public (visível para todos) ou Private (só você)
Campo O que preencher
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 4/8
Clique em "Create repository"
4.
  Por que não inicializar? Você já tem um repositório local com um commit. Se o GitHub criar arquivos, haverá
conflito na hora de enviar.
Passo 9 — Conectar o Repositório Local ao GitHub
Após criar o repositório, o GitHub exibirá uma tela com instruções. Copie a URL do seu repositório — ela terá o
formato:
1 https://github.com/seu-usuario/meu-app-expo.git
No terminal do VS Code, adicione o repositório remoto:
git remote add origin
1 https://github.com/seu-usuario/meu-app-expo.git
Verificar se a conexão foi criada:
git remote -v
1
Resultado esperado:
origin (fetch)
1 https://github.com/seu-usuario/meu-app-expo.git
origin (push)
2 https://github.com/seu-usuario/meu-app-expo.git
  O que é "origin"? É apenas um apelido para a URL do repositório remoto. Por convenção, o primeiro remoto
sempre se chama origin .
Passo 10 — Enviar o Projeto para o GitHub
Agora chegou a hora de enviar (fazer o "push") os arquivos para o GitHub:
git push -u origin main
1
  Se der erro dizendo que a branch se chama master em vez de main , use:
git push -u origin master
1
Ou renomeie a branch com: git branch -M main
Na primeira vez, o VS Code pode abrir uma janela pedindo autenticação com o GitHub. Clique em "Sign in with your
browser" e siga as instruções.
Resultado esperado:
Enumerating objects: 12, done.
1
Counting objects: 100% (12/12), done.
2
Initialize this repository ⚠️ NÃO marque nenhuma opção (sem README, sem .gitignore, sem
licença)
Campo O que preencher
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 5/8
Writing objects: 100% (12/12), 3.45 KiB | 3.45 MiB/s, done.
3
Total 12 (delta 0), reused 0 (delta 0)
4
To * [new branch] main -> main
5 https://github.com/seu-usuario/meu-app-expo.git
Branch 'main' set up to track remote branch 'main' from 'origin'.
6
  Parabéns! Seu projeto está no GitHub!
  ⁠
​Verificando o Resultado
Acesse no navegador
1. https://github.com/seu-usuario/meu-app-expo
Você verá todos os arquivos do seu projeto listados
2.
A estrutura deve incluir App.js , package.json , app.json , etc.
3.
A pasta node_modules não deve aparecer (graças ao .gitignore )
4.
  ⁠
​Fluxo de Trabalho Diário (Após o Setup Inicial)
Depois que o repositório já está no GitHub, para enviar novas alterações, use sempre este fluxo:
# 1. Ver o que mudou
1
git status
2
 
3
# 2. Adicionar os arquivos modificados
4
git add .
5
 
6
# 3. Criar o commit com uma mensagem
7
git commit -m "feat: descreva o que você fez"
8
 
9
# 4. Enviar para o GitHub
10
git push
11
  Dica: Agora que a branch está rastreando o remoto ( -u já foi feito), não precisa mais escrever git push -u
origin main — apenas git push já funciona!
  ⁠
​Problemas Comuns e Soluções
  ⁠
​Erro: fatal: not a git repository
Causa: Você não está dentro da pasta do projeto ou não rodou git init .
Solução:
# Confirmar em qual pasta você está
1
pwd
2
 
3
# Navegar para a pasta do projeto
4
cd caminho/para/o/seu/projeto
5
 
6
# Inicializar novamente
7
git init
8
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 6/8
  ⁠
​Erro: src refspec main does not match any
Causa: Você não tem nenhum commit ainda.
Solução: Certifique-se de ter feito o git add . e o git commit antes do git push .
  ⁠
​Erro: remote origin already exists
Causa: Você já adicionou um remote origin antes.
Solução:
# Remover o origin antigo
1
git remote remove origin
2
 
3
# Adicionar o novo
4
git remote add origin
5 https://github.com/seu-usuario/meu-app-expo.git
  ⁠
​Erro de autenticação / senha não aceita
Causa: O GitHub não aceita mais senha simples — exige um Personal Access Token (PAT).
Solução: Crie um token em: GitHub → Settings → Developer settings → Personal access tokens → Generate new
token. Use o token no lugar da senha quando solicitado.
  ⁠
​A pasta node_modules foi enviada para o GitHub
Causa: O .gitignore não foi criado antes do git add . .
Solução:
# Remover do rastreamento do Git (sem apagar do computador)
1
git rm -r --cached node_modules
2
 
3
# Adicionar o .gitignore corretamente
4
echo "node_modules/" >> .gitignore
5
 
6
# Fazer um novo commit
7
git add .
8
git commit -m "fix: remove node_modules do repositório"
9
git push
10
  ⁠
​Referência Rápida dos Comandos
git init Inicializa um repositório Git local
git status Mostra os arquivos modificados/adicionados
Comando O que faz
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 7/8
  Consulte a documentação oficial do Git em ou a do GitHub em .
git-scm.com/doc docs.github.com
  ⁠
​Dúvidas?
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
#KeepCoding #ReactNative #FIAP
Let's code! ​
⁠
  ⁠
​
​
⁠
  ⁠
​
"O único modo de aprender programação é programando." - Todo desenvolvedor, sempre
Copyright © 2026 Prof. Hercules Ramos
Todos direitos reservados. Reprodução ou divulgação total ou parcial deste documento é expressamente proibido
sem o consentimento formal, por escrito, do Professor (autor).
 
git add . Adiciona todos os arquivos ao stage
git add arquivo.js Adiciona um arquivo específico ao stage
git commit -m "msg" Cria um ponto de salvamento com mensagem
git remote add origin URL Conecta o repositório local ao GitHub
git remote -v Lista os repositórios remotos configurados
git push Envia os commits para o GitHub
git push -u origin main Envia e define o rastreamento da branch
git log --oneline Mostra o histórico de commits resumido
git config --global --
list
Lista as configurações globais do Git
Comando O que faz
15/04/2026, 03:51 Guia: Subindo seu Projeto Expo no GitHub via Terminal (VS Code)
https://whimsical.com/guia-subindo-seu-projeto-expo-no-github-via-terminal-vs-code-SbqDpaP1AFbpv3jkqJ4B9c 8/8
