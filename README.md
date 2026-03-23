# Smart Panchayat

Smart Panchayat is a full-stack civic governance platform for managing village-level public services. It combines citizen service workflows with AI-powered complaint intelligence, analytics, and assistance tools.

## Features

- Citizen complaints lifecycle: create, track, update, and resolve
- AI-assisted complaint analysis, routing, deduplication, and priority support
- AI complaint heatmap and governance analytics
- Voice complaint processing and image verification flows
- Tax, pension, and certificate service modules
- Announcements and support ticket center
- Role-aware dashboards (citizen, staff, admin)
- Realtime communication support with Socket.IO

## Tech Stack

### Frontend

- React 19 + Vite
- React Router
- Leaflet / React Leaflet (maps)
- Recharts (charts)
- Socket.IO client

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Cloudinary file storage
- AI integrations (OpenAI, Groq, Gemini SDK in dependencies)
- Winston logging, Helmet, CORS, rate limiting

## Project Structure

```text
SmartPanchayat/
  Backend/
    ai-agents/
    config/
    middleware/
    models/
    routes/
    services/
    server.js
  Frontend/
    src/
    public/
    vite.config.js
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or cloud)
- Cloudinary account (for media uploads)
- API keys for AI providers you plan to use

## Setup

### 1. Clone

```bash
git clone <your-repo-url>
cd SmartPanchayat
```

### 2. Install dependencies

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 3. Configure environment variables

Create `Backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/smartpanchayat
JWT_SECRET=replace_with_strong_secret
ALLOWED_ORIGINS=http://localhost:5173

# Google Auth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password

# AI Providers
OPENAI_API_KEY=your_openai_key
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_STT_MODEL=gpt-4o-mini-transcribe

GROQ_API_KEY=your_groq_key

# Optional tuning
DEDUPE_LOOKBACK_DAYS=14
DEDUPE_THRESHOLD=0.45
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Run Locally

### Start backend

```bash
cd Backend
npm run dev
```

### Start frontend

```bash
cd Frontend
npm run dev
```

Then open the Vite URL shown in terminal (typically http://localhost:5173).

## Available Scripts

### Backend (`Backend/package.json`)

- `npm start` - run server with Node
- `npm run dev` - run server with nodemon

### Frontend (`Frontend/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - build production bundle
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## API Modules (Backend)

- `/api/users`
- `/api/complaints`
- `/api/tax`
- `/api/announcements`
- `/api/dashboard`
- `/api/pensions`
- `/api/certificates`
- `/api/chatbot`
- `/api/support`
- `/api/ai`

## AI Agent Modules (Backend)

Located in `Backend/ai-agents/`:

- complaint analyzer
- complaint heatmap
- complaint routing
- duplicate complaint detection
- governance analytics
- image verification
- priority prediction
- voice complaint processing
- report generation

## Notes

- `Backend/data/` is local runtime database storage and is excluded from git.
- Keep `.env` files out of version control.
- For CORS issues, ensure `ALLOWED_ORIGINS` includes your frontend URL.
