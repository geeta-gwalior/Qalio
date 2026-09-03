# ⚡ Qalio - Commercial B2B/B2C Hiring & Skill Assessment SaaS Platform

**Qalio** is a full-stack, enterprise-grade talent acquisition and skill assessment platform. It enables **Companies** (Employers/Recruiters) to create customized online assessments, post job drives, screen candidate applications, and train a **Company AI Knowledge Base & RAG Policy Chatbot** to automatically answer candidate queries. Candidates (**Job Seekers**) can browse jobs, take live timed assessments (MCQs, Coding, Prompt-based questions), interact with Company AI Assistants, and track application results in real time.

---

## ✨ Features Highlight

### 🏢 Employer / Company Portal
- **Job Drive Management**: Create and manage job openings with salary packages, locations, eligible batches, and experience levels.
- **Assessment Engine Builder**: Build multi-topic skill assessments featuring MCQs, Multi-MCQs, Monaco-powered Coding challenges, and Short-answer questions.
- **Company AI Knowledge Base (RAG)**: Upload PDF policy handbooks, website URLs, or custom FAQs to train an AI Assistant that automatically handles candidate inquiries during recruitment drives.
- **Applicant Screening & PDF Analytics**: Evaluate applicants, review test performance breakdowns, download PDF reports, and approve/shortlist candidates.

### 🎓 Candidate / Job Seeker Portal
- **Interactive Job Search**: Filter and apply for company job drives with attached skill assessments.
- **Live Timed Test Engine**: Take online tests with anti-cheat timers, code execution windows, and instant score submission.
- **Company AI Assistant**: Floating AI Chatbot on job listing pages to ask real-time questions about company culture, remote work policies, salary reviews, and hiring rounds.
- **Performance Analytics**: View detailed score breakdowns, past submission history, and downloadable PDF skill reports.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Zustand, Radix UI.
- **Backend**: Node.js, Express.js, TypeScript, MongoDB (Mongoose ORM), WebSockets (Socket.io), OpenAI API / RAG, Multer, pdf-parse.
- **Email Service**: Production Nodemailer Gmail SMTP integration.
- **DevOps & Cloud**: Docker, Docker Compose, GCP Artifact Registry, GCP Cloud Run.

---

## 🚀 Quick Start Guide

### Option 1: 1-Click Docker Compose (Recommended)

Run both frontend, backend API, and MongoDB using a single command:

```bash
docker compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **MongoDB**: `localhost:27017`

---

### Option 2: Manual Local Development

#### 1. Backend Setup
```bash
cd qalio-backend
npm install
npm run dev
```

#### 2. Frontend Setup
```bash
cd qalio-frontend
npm install
npm run dev
```

---

## ☁️ Google Cloud Platform (GCP) Cloud Run Deployment

Deploy both frontend and backend services to GCP Cloud Run with a single automated script:

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"

chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

---

## 🔐 Environment Variables

### Backend (`qalio-backend/.env`)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/qalio
JWT_SECRET=your_production_jwt_secret
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (`qalio-frontend/.env`)
```env
NEXT_PUBLIC_QALIO_BACKEND_URL=http://localhost:4000/api
```

---

## 📝 License

Distributed under the ISC License. Commercial rights reserved.
