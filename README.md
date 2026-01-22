<div align="center">
<img width="1200" height="475" alt="Ensalament Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# UniEnsal - Sistema de Ensalamento Universitário

O **UniEnsal** é uma plataforma robusta para gestão de ensalamento, recursos acadêmicos e infraestrutura universitária. O sistema foi projetado para otimizar a distribuição de salas, horários e recursos, garantindo uma gestão eficiente e auditável.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic.
- **Banco de Dados:** PostgreSQL 15.
- **Infraestrutura:** Docker, Docker Compose.

---

## 🛠️ Como Executar o Projeto

A maneira recomendada de rodar o projeto é utilizando **Docker**, que já configura o banco de dados, o backend e o frontend automaticamente.

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd Ensalament
   ```

2. **Inicie o ambiente com Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Acesse as aplicações:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend (API):** [http://localhost:8000](http://localhost:8000)
   - **Documentação da API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Banco de Dados (Externo):** localhost:5433

> **Nota:** Se você encontrar problemas com o `docker-compose` nativo (erro `ContainerConfig`), utilize o binário v2 local incluído: `./docker-compose-v2 up -d`.

---

## 📁 Estrutura do Projeto

O projeto está dividido de forma modular para facilitar a manutenção e escalabilidade:

### Backend (`/backend`)
- `app/api`: Endpoints REST da aplicação.
- `app/models`: Definições das tabelas do banco de dados.
- `app/schemas`: Modelos de validação de dados (Pydantic).
- `app/services`: Lógica de negócio principal.

### Frontend (`/frontend`)
- `src/modules`: Divisão por funcionalidades (Dashboard, Acadêmico, Ensalamento, Infraestrutura, Auditoria).
- `src/components`: Componentes UI reutilizáveis.
- `src/core`: Configurações globais e tipos TypeScript.

---

## ⚙️ Variáveis de Ambiente

Crie arquivos `.env` baseados nos exemplos fornecidos em cada diretório:

- **Backend:** `/backend/.env.example` -> `.env`
- **Frontend:** `/frontend/.env.local`

---

## 🛠️ Desenvolvimento Local (Sem Docker)

Se preferir rodar os serviços separadamente na sua máquina:

### Rodando o Backend
1. Entre na pasta `backend`.
2. Crie um ambiente virtual: `python3 -m venv venv`.
3. Ative o venv e instale: `pip install -r requirements.txt`.
4. Rode: `uvicorn app.main:app --reload`.

### Rodando o Frontend
1. Entre na pasta `frontend`.
2. Instale as dependências: `npm install`.
3. Rode: `npm run dev`.

### Executando Testes (Backend)
1. Entre na pasta `backend`.
2. Certifique-se de que as dependências de teste estão instaladas:
   ```bash
   pip install pytest pytest-asyncio httpx aiosqlite
   ```
3. Execute os testes usando o comando:
   ```bash
   PYTHONPATH=. pytest tests/
   ```

---

## ✅ Funcionalidades Principais
- [x] Dashboard de métricas em tempo real.
- [x] Gestão de Dados Acadêmicos (Turmas e Disciplinas).
- [x] Sistema de alocação de salas (Ensalamento) com Algoritmo Inteligente.
- [x] Gestão de infraestrutura física (Prédios, Salas e Capacidades).
- [x] Logs de Auditoria e Segurança (RBAC).

## 🧠 Lógica de Ensalamento Inteligente (v2.0)

O sistema conta agora com um algoritmo avançado para distribuição automática de turmas, focado em maximizar a eficiência e minimizar conflitos:

### 1. Estratégia "Smallest-Group-First" (Menores Primeiro)
O algoritmo prioriza a alocação de grupos menores de turmas. Isso impede que grandes grupos (com muitas turmas) fragmentem o mapa de salas e consumam os espaços pequenos ideais para turmas únicas, garantindo um "encaixe perfeito" para todos.

### 2. Cooperative Packing & Best Fit
- **Best Fit:** Ao buscar uma sala vazia, o sistema escolhe aquela que tem a capacidade mais próxima da necessidade da turma (menor desperdício de assentos).
- **Cooperative Packing:** Se um grupo (mesma disciplina/mês) já possui turmas alocadas em uma sala que ainda tem espaço, o sistema prioriza colocar as próximas turmas desse grupo *na mesma sala*, antes de abrir uma nova sala vazia.

### 3. Tratamento de Conflitos e Superlotação
- **Fallback Inteligente:** Se não houver salas vazias ou ideais, o sistema tenta alocar na sala que possui *mais espaço livre sobrando*, minimizando o impacto da superlotação.
- **Visualização de Conflito:** No frontend, se uma sala excede sua capacidade total, a turma com **menor número de alunos** é marcada com *Conflito Crítico* (Vermelho), sugerindo que ela é a candidata ideal para remanejamento, enquanto as demais recebem um alerta de *Atenção* (Amarelo).

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo para mais detalhes.
