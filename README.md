# PlanAI — AI-Powered Hierarchical Planning

## Project Structure
```
planai/
├── backend/      → Node.js + Express + SQLite
└── frontend/     → React + Vite
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
```

Edit `.env` file:
```
GEMINI_API_KEY=your_key_from_aistudio.google.com
JWT_SECRET=any_random_string
PORT=3001
```

Start backend:
```bash
npm start
# or: node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## Features
- Simple email/password login (register + sign in)
- Create multiple Workspaces
- AI generates hierarchical plan nodes on command
- Click any node → execution view with notes + complete button
- Persistent data in SQLite (planai.db file created automatically)

## AI Commands (type in the chat panel)
- `Generate top level plan` → creates root nodes
- `Generate subtopics for Math` → creates children under Math node
- `Add node: Review Chapter 5 under Algebra` → creates specific node
- `Generate execution steps for Understand Variables` → detailed subtasks

## Tech Stack
- Backend: Node.js, Express, SQLite (better-sqlite3), JWT, bcryptjs
- Frontend: React, Vite
- AI: Google Gemini 2.0 Flash (free tier)
