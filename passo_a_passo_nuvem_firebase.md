# 🚀 Guia de Publicação na Internet & Integração Firebase (Baja Gralha)

Este guia explica como colocar o **Sistema de Gerenciamento & Ponto Biométrico do Baja Gralha** na internet, permitindo que qualquer pessoa acesse o sistema pelo celular ou computador de casa, mantendo a leitura da biometria no computador local da oficina.

---

## 🏛️ Como a Arquitetura Funciona Agora

```
┌─────────────────────────────────────────────────────────────┐
│                       NUVEM (INTERNET)                      │
│                                                             │
│   [ Firebase Hosting / Vercel ]        [ Cloud Firestore ]  │
│        Frontend Web React ────────────▶  Banco na Nuvem     │
│        (Acessível em qualquer           - Membros           │
│         celular / computador)           - Pontos / Horas    │
│                     │                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ (Quando você abre o site no PC da oficina)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 COMPUTADOR LOCAL DA OFICINA                 │
│                                                             │
│   [ Serviço C# (Porta 5000) ] ◀── [ Leitor USB U.are.U ]   │
│   Lê o dedo físico e entrega     DigitalPersona 4000B       │
│   a biometria para a página                                 │
└─────────────────────────────────────────────────────────────┘
```

1. **Acesso pela Internet**: O site fica hospedado gratuitamente (no **Firebase Hosting** ou na **Vercel**). Qualquer membro ou capitão pode consultar o histórico, ver relatórios mensais e cadastrar membros pelo celular ou de casa.
2. **Banco na Nuvem (Firebase Cloud Firestore)**: Todos os membros cadastrados e registros de ponto são gravados diretamente no Firebase. Não é necessário manter um servidor backend Python rodando na nuvem!
3. **Leitor Biométrico Local**: Ao abrir a página no computador da oficina (onde o sensor USB DigitalPersona está conectado), o navegador conversa com o serviço local C# (`http://localhost:5000/`) e envia o ponto diretamente para o Firebase.

---

## 📋 PASSO 1: Criar o Projeto no Firebase (100% Gratuito)

1. Acesse o **[Console do Firebase](https://console.firebase.google.com/)** com sua conta Google.
2. Clique em **"Adicionar projeto"** e dê um nome (ex: `baja-gralha-gestao`).
3. Desative o Google Analytics (opcional) e clique em **"Criar projeto"**.
4. No menu lateral esquerdo, vá em **Compilação** (Build) ➔ **Firestore Database**:
   - Clique em **"Criar banco de dados"**.
   - Escolha o local (ex: `southamerica-east1` em São Paulo, ou o padrão dos EUA).
   - Escolha **"Iniciar no modo de teste"** (permite leitura e escrita imediata pelos membros) e clique em **Ativar**.
5. No menu lateral, clique no ícone de engrenagem ⚙️ (ao lado de "Visão geral do projeto") ➔ **Configurações do projeto**.
6. Na aba **Geral**, desça até "Seus aplicativos" e clique no ícone **Web** (`</>`):
   - Apelido do app: `Baja Gralha Web`.
   - Marque a caixa *"Configurar também o Firebase Hosting"* (se desejar).
   - Clique em **"Registrar aplicativo"**.
7. O Firebase exibirá um bloco de código como este:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "baja-gralha.firebaseapp.com",
     projectId: "baja-gralha",
     storageBucket: "baja-gralha.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456:web:abcdef"
   };
   ```
   **Copie esse trecho!** Você vai usá-lo no passo seguinte.

---

## 📋 PASSO 2: Ativar o Firebase no Projeto

Você tem duas formas muito simples:

### Opção A (Direto pela Interface Visual - Mais Fácil)
1. Inicie o frontend localmente (`npm run dev` na pasta `frontend`) ou abra o site já publicado.
2. No topo direito do cabeçalho, clique no botão **"Conectar Firebase"** (ícone de nuvem).
3. Na caixa **"Colar Código do Console Firebase"**, basta colar o bloco que você copiou no Passo 1!
4. O sistema preenche todos os campos automaticamente. Clique em **"Testar Conexão"** e depois em **"Salvar Alterações"**.
5. Pronto! O botão no cabeçalho ficará verde com o status **"Nuvem Firebase"**.

### Opção B (Via arquivo `.env`)
1. Na pasta `frontend/`, crie um arquivo chamado `.env` (baseado no `.env.example`).
2. Preencha com os dados do seu Firebase:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_PROJECT_ID=baja-gralha
   VITE_FIREBASE_AUTH_DOMAIN=baja-gralha.firebaseapp.com
   VITE_FIREBASE_STORAGE_BUCKET=baja-gralha.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456:web:abcdef
   VITE_CSHARP_SERVICE_URL=http://localhost:5000/
   ```

---

## 📋 PASSO 3: Migrar os Membros Existentes para a Nuvem (Opcional)

Se você já cadastrou membros no banco local SQLite e deseja levá-los para o Firebase:
1. Certifique-se de que o backend Python está rodando (`python main.py` na pasta `backend`).
2. Abra a janela do Firebase no app (clique no botão da Nuvem no topo).
3. Vá na aba **"Migrar do SQLite"** e clique em **"Copiar Membros do SQLite para o Firebase"**.
4. Todos os membros e históricos de pontos serão importados instantaneamente para o Firestore!

---

## 📋 PASSO 4: Como Subir o Frontend na Internet

### Método 1: Firebase Hosting (Recomendado e Gratuito)
1. Instale a ferramenta oficial do Firebase no seu computador (apenas uma vez):
   ```bash
   npm install -g firebase-tools
   ```
2. Faça login na sua conta Google:
   ```bash
   firebase login
   ```
3. Na raiz do projeto, vincule ao seu projeto:
   ```bash
   firebase use --add
   ```
   *(Escolha o projeto que você criou no Passo 1 e dê o alias de `default`)*.
4. Gere a versão de produção e faça o deploy:
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```
5. O terminal retornará o link público (exemplo: `https://baja-gralha.web.app`). O seu sistema já está no ar na internet!

---

### Método 2: Vercel (Alternativa em 1 Clique)
1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Conecte o repositório GitHub do projeto.
3. No Root Directory, aponte para `frontend`.
4. Em Environment Variables, adicione as variáveis `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.
5. Clique em **Deploy**.

---

## 📋 PASSO 5: Como Usar no Computador da Oficina (Leitor Biométrico)

No computador onde o leitor USB **DigitalPersona U.are.U 4000B** está plugado:

1. **Drivers do Sensor**:
   - Certifique-se de ter os drivers do DigitalPersona One Touch for Windows instalados (`DPFP.dll` e driver USB).
2. **Executar o Serviço C#**:
   - Abra a pasta `leitor biometrico/PontoBiometricoService/ConsoleApp1`.
   - Execute o serviço (pelo Visual Studio ou rodando o executável compilado `.exe`).
   - Ele iniciará na porta `http://localhost:5000/` já preparado com suporte a CORS e Private Network Access (PNA).
3. **Bater o Ponto**:
   - Abra o navegador no link público do sistema (ex: `https://baja-gralha.web.app`).
   - Vá na aba **"Bater Ponto"**.
   - Coloque o dedo no leitor. A biometria será lida pelo serviço C# local e o ponto será salvo no Firebase na nuvem em tempo real!
