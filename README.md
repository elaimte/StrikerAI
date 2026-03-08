# Striker Screening App

Minimal web app around a Bolna voice agent for first-round interview screening.

## What this includes

- Recruiter dashboard (candidate list + actions)
- Start screening endpoint
- Bolna webhook receiver endpoint
- Screening result storage and retrieval
- Demo seed button for quick assignment walkthrough

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Run app:

```bash
npm run dev
```

4. Open:

[http://localhost:3000](http://localhost:3000)

## Run with Docker

### Build and run (recommended)

```bash
docker compose up --build
```

### Run in background

```bash
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

## API endpoints

- `GET /api/health`
- `GET /api/candidates`
- `GET /api/candidate/:id`
- `POST /api/candidates`
- `PUT /api/candidate/:id/context`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/context/:candidateId`
- `GET /api/screening`
- `POST /api/screening/start`
- `POST /api/screening/result`
- `POST /api/bolna/webhook`
- `GET /api/screening/:candidateId`

## Bolna integration note

### Required workflow

1. Add candidate with resume + JD context:

```bash
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riya Jain",
    "phone": "+919876543219",
    "role": "Backend Developer",
    "resumeSummary": "4 years Node.js, PostgreSQL, API design",
    "jobDescription": "Build backend services with Node.js, SQL, observability and performance optimization."
  }'
```

2. Trigger screening call:

```bash
curl -X POST http://localhost:3000/api/screening/start \
  -H "Content-Type: application/json" \
  -d '{ "candidateId": "cand-<id>" }'
```

`POST /api/screening/start` now returns a Bolna-ready `bolnaContext` payload. Pass this as call variables in your Bolna start-call API request.

- `candidate_id`
- `candidate_name`
- `role`
- `company_name`
- `resume_summary`
- `resume_text`
- `job_description`

When your agent finishes, send final structured output to:

- `POST /api/screening/result`
or
- `POST /api/bolna/webhook` with `{ "type": "screening_result", "data": { ... } }`

### Live Bolna trigger (already wired)

The backend now directly calls Bolna `POST /call` when these env vars are set:

- `BOLNA_AGENT_ID`
- `BOLNA_API_KEY`

Optional:

- `BOLNA_BASE_URL` (default `https://api.bolna.ai`)
- `BOLNA_CALL_ENDPOINT_PATH` (default `/call`)
- `BOLNA_FROM_PHONE_NUMBER`
- `COMPANY_NAME`

`POST /api/screening/start` sends:

```json
{
  "agent_id": "your-agent-id",
  "recipient_phone_number": "+919876543210",
  "from_phone_number": "+91...",
  "user_data": {
    "candidate_id": "...",
    "candidate_name": "...",
    "role": "...",
    "resume_summary": "...",
    "resume_text": "...",
    "job_description": "...",
    "company_name": "Striker AI"
  }
}
```
