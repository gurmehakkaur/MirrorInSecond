# MirrorInSeconds.ai

**Instant QA and demo environments — mirrored from your real codebase, powered by AI-generated synthetic data.**

MirrorInSeconds spins up fully isolated, role-aware sandbox environments from any GitHub repository in seconds. No production data touched. No manual setup. Just paste a repo URL and start testing.

---

## What It Does

1. **Onboard your application** — Paste a GitHub URL. A GitHub MCP Agent analyzes the codebase to detect user roles, database schema, and authentication patterns automatically.
2. **Generate scenarios** — Describe a test scenario in plain English (e.g. *"Admin approves a pending booking"*). OpenAI generates schema-accurate synthetic data with realistic test credentials already embedded.
3. **Launch a sandbox** — One click spins up a fully isolated environment: a cloned Docker image of your app connected to its own seeded MongoDB instance, exposed on a public URL.
4. **Share and test** — Hand the URL and credentials to QA, stakeholders, or demo audiences. Everything is isolated — destroy it when done.

---

## Architecture

```
GitHub URL
    │
    ▼
🤖 MCP Agent analyzes repo → detects roles + DB schema
    │
    ▼
🔑 OpenAI generates test credentials per role
    │
    ▼
💾 Project saved (githubUrl, roles, schema, credentials)
    │
    ▼
🎭 User writes scenario in plain English
    │
    ▼
🧠 OpenAI generates synthetic data matching exact schema
   (test credentials embedded in users table)
    │
    ▼
⚙️  EC2 Sandbox Engine:
   1. Creates isolated Docker network
   2. Spins up MongoDB container
   3. Seeds it with synthetic data
   4. git clone the repo
   5. Auto-generates Dockerfile if missing
   6. docker build the image
   7. Launches app container with MONGODB_URL injected
    │
    ▼
🌐 Public URL returned → QA logs in → tests the scenario
   No real data. No real APIs. Fully isolated.
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Backend | Express.js (Node.js) |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-4o-mini |
| Sandbox Engine | Docker (EC2) |
| Hosting | Railway (frontend + backend), EC2 (sandbox runner) |

---

## Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://localhost:27017`)
- Docker Desktop (for local sandbox launching)
- OpenAI API key

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/your-username/MirrorInSecond.git
cd MirrorInSecond
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../my-app
npm install
```

### 3. Configure environment

Create `server/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start the backend

```bash
cd server
npm start
```

Express runs on `http://localhost:4000`

### 5. Start the frontend

```bash
cd my-app
npm run dev
```

Next.js runs on `http://localhost:3000`

Open `http://localhost:3000` in your browser.

---

## Production Deployment

### Railway (Frontend + Backend)

1. Push to GitHub
2. Connect repo to Railway
3. Add environment variables in Railway dashboard:

```
OPENAI_API_KEY=your_openai_api_key
SANDBOX_SERVICE_URL=http://your-ec2-ip:8080
```

Railway auto-deploys on every push.

### EC2 (Sandbox Engine)

The sandbox engine runs on a separate EC2 instance with Docker installed. It receives launch requests from the Railway backend and spins up isolated containers.

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone repo
git clone https://github.com/your-username/MirrorInSecond.git
cd MirrorInSecond/ec2-sandbox

# Install dependencies
npm install

# Start the sandbox engine
EC2_PUBLIC_IP=your-ec2-ip node index.js
```

The sandbox engine listens on port `8080`. Make sure your EC2 security group allows inbound TCP on ports `8080` and `3001–4999`.

---

## Project Structure

```
MirrorInSecond/
├── my-app/               # Next.js frontend
│   ├── app/
│   │   └── page.tsx      # Main UI (sidebar, project detail, scenario cards)
│   └── next.config.ts    # Proxies /api/* → Express on :4000
│
├── server/               # Express backend
│   ├── index.js          # Entry point, routes, OpenAI credential generation
│   ├── models/
│   │   ├── Project.js    # githubUrl, roles, dbSchema, roleCredentials
│   │   └── Scenario.js   # projectId, scenario, role, syntheticData, isLive, url
│   └── routes/
│       ├── generateSyntheticData.js   # OpenAI synthetic data generation
│       └── launchSandbox.js           # Docker sandbox orchestration
│
├── ec2-sandbox/          # Standalone sandbox engine (runs on EC2)
│   └── index.js          # Docker orchestration service
│
├── Dockerfile            # Multi-stage build for Railway deployment
├── docker-compose.yml    # Local full-stack Docker setup
└── ARCHITECTURE.md       # System architecture diagram
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project (triggers credential generation) |
| DELETE | `/api/projects/:id` | Delete project and all its scenarios |
| GET | `/api/scenarios?projectId=` | List scenarios for a project |
| POST | `/api/scenarios` | Create scenario |
| PATCH | `/api/scenarios/:id` | Update scenario (isLive, url, etc.) |
| DELETE | `/api/scenarios/:id` | Delete scenario |
| POST | `/api/generatesyntheticdata` | Generate synthetic data via OpenAI |
| POST | `/api/launchSandbox` | Launch isolated Docker sandbox |

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for credential + data generation |
| `SANDBOX_SERVICE_URL` | URL of the EC2 sandbox engine (e.g. `http://18.x.x.x:8080`) |
| `EC2_PUBLIC_IP` | Public IP of EC2 instance (used to construct sandbox URLs) |

### EC2 Sandbox Engine

| Variable | Description |
|---|---|
| `EC2_PUBLIC_IP` | Public IP used in returned sandbox URLs |
| `PORT` | Port to listen on (default: `8080`) |
