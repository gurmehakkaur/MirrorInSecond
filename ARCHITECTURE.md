flowchart TB
    User(["👤 User"])

    subgraph ONBOARD["🔍 Step 1 — Onboard Application"]
        direction TB
        GH["GitHub Repository URL"]
        MCP["🤖 GitHub MCP Agent
Analyzes codebase:
• Detects user roles
• Reads DB models & schemas
• Identifies API routes
• Finds auth patterns"]
        CREDS["🔑 OpenAI GPT-4o-mini
Generates realistic test
credentials per role
(email + password)"]

        GH --> MCP --> CREDS
    end

    subgraph STORE["🗄️ Platform Database (MongoDB on Railway)"]
        direction TB
        PROJ["Projects
─────────
githubUrl
roles
dbSchema
roleCredentials"]

        SCEN["Scenarios
─────────
projectId
scenario
role
userId / userPassword
syntheticData
isLive / url"]
    end

    subgraph SCENARIO["🎭 Step 2 — Define Scenario"]
        direction TB
        DESC["User describes scenario
e.g. 'Admin approves a pending booking'"]

        SYNTH["🧠 OpenAI GPT-4o-mini
Generates schema-accurate
synthetic data
• Matches detected DB schema
• Embeds generated credentials
  into users table
• Creates realistic related records"]

        DESC --> SYNTH
    end

    subgraph EC2["⚙️ Step 3 — Sandbox Engine (EC2)"]
        direction TB
        NET["Create isolated Docker network"]
        MONGO["Spin up MongoDB container
(per sandbox)"]
        SEED["Seed MongoDB with
synthetic data"]
        CLONE["git clone repo"]
        DOCK["Auto-generate Dockerfile
if missing"]
        BUILD["docker build image"]
        RUN["Launch app container
+ inject MONGODB_URL"]

        NET --> MONGO --> SEED --> CLONE --> DOCK --> BUILD --> RUN
    end

    subgraph SANDBOX["🌐 Live Sandbox"]
        direction TB
        URL["Public URL
http://ec2-ip:port"]

        LOGIN["QA / Demo User
logs in with generated
credentials"]

        APP["Fully functional app
✓ Real UI
✓ Synthetic data
✓ No prod APIs touched
✓ Fully isolated"]

        URL --> LOGIN --> APP
    end


    User -->|"Pastes GitHub URL"| GH
    CREDS -->|"Saves project"| PROJ

    PROJ -->|"User picks role + describes scenario"| DESC
    SYNTH -->|"Saves scenario (isLive: false)"| SCEN

    SCEN -->|"User clicks 'Go Live'"| NET

    RUN -->|"Returns URL
Patches scenario isLive: true"| SCEN
    RUN --> URL


    style ONBOARD fill:#0e1a2b,stroke:#2a4a7f,color:#7eb3ff
    style SCENARIO fill:#0e2018,stroke:#2a7f4a,color:#7effa0
    style STORE fill:#1a1a0e,stroke:#7f7f2a,color:#ffff7e
    style EC2 fill:#2b0e1a,stroke:#7f2a4a,color:#ffb3d9
    style SANDBOX fill:#1a2b0e,stroke:#4a7f2a,color:#c0ff7e