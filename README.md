# 🏎️ Baja Gralha — Sistema de Gerenciamento & Ponto Biométrico

Sistema oficial de gestão de membros, presença e ponto biométrico da equipe **Baja Gralha SAE**. O sistema conta com banco de dados em nuvem em tempo real (Firebase Cloud Firestore), relatórios mensais automáticos e integração com hardware de biometria física **DigitalPersona U.are.U 4000B**.

---

## 🌐 Acesso Online

> 🔗 **Acesse o sistema pela internet:**  
> ### 👉 **[https://baja-gralha.web.app](https://baja-gralha.web.app)**
*(Link alternativo: [https://baja-gralha.firebaseapp.com](https://baja-gralha.firebaseapp.com))*

---

## ⚙️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        NUVEM (INTERNET)                         │
│                                                                 │
│   [ Firebase Hosting ]                   [ Cloud Firestore ]    │
│   Frontend React ──────────────────────▶  Banco em Tempo Real   │
│   (Acessível em qualquer PC/Celular)      - Membros / Setores   │
│               │                           - Registros de Ponto  │
│               │                           - Horas Trabalhadas   │
└───────────────┼─────────────────────────────────────────────────┘
                │
                │ (Quando acessado no computador da oficina)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPUTADOR DA OFICINA (LOCAL)                 │
│                                                                 │
│   [ Serviço C# (Porta 5000) ] ◀─────── [ Leitor Físico USB ]   │
│   Escuta eventos do leitor             DigitalPersona 4000B     │
│   e entrega as minúcias para a web                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

- 👆 **Ponto Biométrico**: Leitura ultrarrápida com sensor USB DigitalPersona U.are.U 4000B e detecção inteligente de entrada/saída no mesmo dia.
- 👥 **Gestão de Membros**: Cadastro completo por setor (Powertrain, Chassi & Suspensão, Eletrônica, etc.) e cargo, com gravação de digitais e contagem de presenças.
- 📊 **Relatório Mensal de Horas**: KPIs em tempo real com total de horas trabalhadas, membros ativos, ranking de dedicação por membro e exportação em 1 clique para planilha (CSV / Excel).
- 🕒 **Histórico de Ponto**: Registro auditável de todas as batidas de ponto com hora exata de entrada, saída e permanência.
- 📅 **Calendário**: Cronograma de treinos, reuniões de alinhamento e inspeções técnicas para a etapa SAE.

---

## 🔌 Como Rodar o Leitor Biométrico no Computador da Oficina

O computador onde o sensor físico está conectado só precisa executar o microserviço C# local:

### 1. Requisitos
- Windows 10/11
- Drivers do **DigitalPersona U.are.U 4000B** instalados
- Sensor conectado a uma porta USB
- [.NET Desktop Runtime 8.0](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) (caso o Windows solicite)

### 2. Configurar a Inicialização Automática (1 Clique)
1. Clone o repositório ou baixe a pasta `leitor biometrico`:
   ```powershell
   git clone https://github.com/BrendaGarcez/baja-gralha.git
   ```
2. Abra a pasta `leitor biometrico/`.
3. Dê dois cliques em **`instalar_inicializacao_automatica.bat`**.
4. Pronto! O serviço iniciará em segundo plano na porta `http://localhost:5000/` sempre que o computador for ligado.

### 3. Bater o Ponto
1. Abra o navegador em: **[https://baja-gralha.web.app](https://baja-gralha.web.app)**
2. Entre na aba **"Bater Ponto"**.
3. Selecione o membro, coloque o dedo no leitor e a presença será confirmada instantaneamente na nuvem!

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Date-fns
- **Nuvem**: Google Firebase Hosting & Cloud Firestore
- **Hardware Bridge**: C# .NET 8, DigitalPersona One Touch SDK (`DPFP.dll`), HttpListener com suporte a CORS e Private Network Access (PNA)
- **Backend Local (Opcional)**: Python 3, FastAPI, SQLAlchemy, SQLite

---

<p align="center">
  <b>Baja Gralha SAE</b> • Engenharia, Tecnologia e Paixão pelo Off-Road
</p>
