const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data", "screening-results.json");
const CONTEXT_FILE = path.join(__dirname, "data", "context-data.json");

const seedCandidates = [
  {
    id: "cand-101",
    name: "Priya Sharma",
    role: "Senior Frontend Engineer",
    email: "priya@example.com",
    phone: "+91-9876543210",
    location: "Bangalore",
    experienceHint: "5-7 years",
    status: "Screened"
  },
  {
    id: "cand-102",
    name: "Rahul Verma",
    role: "Backend Developer",
    email: "rahul@example.com",
    phone: "+91-9876543211",
    location: "Mumbai",
    experienceHint: "3-5 years",
    status: "Screened"
  },
  {
    id: "cand-103",
    name: "Ananya Patel",
    role: "Full Stack Developer",
    email: "ananya@example.com",
    phone: "+91-9876543212",
    location: "Hyderabad",
    experienceHint: "2-4 years",
    status: "Screened"
  },
  {
    id: "cand-104",
    name: "Vikram Singh",
    role: "DevOps Engineer",
    email: "vikram@example.com",
    phone: "+91-9876543213",
    location: "Delhi",
    experienceHint: "4-6 years",
    status: "New"
  },
  {
    id: "cand-105",
    name: "Meera Iyer",
    role: "Senior Frontend Engineer",
    email: "meera@example.com",
    phone: "+91-9876543214",
    location: "Chennai",
    experienceHint: "6-8 years",
    status: "Screening"
  },
  {
    id: "cand-106",
    name: "Arjun Reddy",
    role: "Data Engineer",
    email: "arjun@example.com",
    phone: "+91-9876543215",
    location: "Pune",
    experienceHint: "3-5 years",
    status: "New"
  }
];

const seedJobs = [
  {
    id: "job-frontend-senior",
    title: "Senior Frontend Engineer",
    description:
      "Build scalable frontend applications using React and TypeScript. Own architecture, performance, accessibility, testing, and collaboration with design/product teams."
  },
  {
    id: "job-backend",
    title: "Backend Developer",
    description:
      "Design and build APIs, data models, and backend services using Node.js and PostgreSQL. Focus on reliability, observability, and performance."
  }
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ results: [] }, null, 2), "utf8");
  }
}

function ensureContextFile() {
  if (!fs.existsSync(CONTEXT_FILE)) {
    fs.writeFileSync(
      CONTEXT_FILE,
      JSON.stringify({ candidates: seedCandidates, jobs: seedJobs }, null, 2),
      "utf8"
    );
  }
}

function readResults() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function writeResults(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function readContext() {
  ensureContextFile();
  const raw = fs.readFileSync(CONTEXT_FILE, "utf8");
  return JSON.parse(raw);
}

function writeContext(data) {
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(data, null, 2), "utf8");
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function validateScreeningReadiness(candidate, jobDescription) {
  if (!candidate) return "Candidate not found";
  if (!candidate.phone) return "Candidate phone is required to place call";
  const normalizedPhone = normalizePhoneNumber(candidate.phone);
  if (!normalizedPhone.startsWith("+")) {
    return "Candidate phone must include country code in E.164 format (e.g., +919876543210)";
  }
  if (!candidate.role) return "Candidate role is required";
  if (!jobDescription) return "Job description is missing";
  if (!candidate.resumeSummary && !candidate.resumeText) {
    return "Resume information is missing";
  }
  return null;
}

function compactText(text, max = 1200) {
  if (!text) return "";
  return String(text).trim().slice(0, max);
}

function normalizePhoneNumber(phone) {
  if (!phone) return "";
  const raw = String(phone).trim();
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

function buildBolnaAuthHeader(apiKey) {
  if (!apiKey) return "";
  return apiKey.toLowerCase().startsWith("bearer ") ? apiKey : `Bearer ${apiKey}`;
}

async function triggerBolnaCall({ candidate, bolnaContext }) {
  const baseUrl = (process.env.BOLNA_BASE_URL || "https://api.bolna.ai").replace(/\/+$/, "");
  const endpointPath = process.env.BOLNA_CALL_ENDPOINT_PATH || "/call";
  const endpoint = process.env.BOLNA_CALL_ENDPOINT_URL || `${baseUrl}${endpointPath}`;
  const payload = {
    agent_id: process.env.BOLNA_AGENT_ID,
    recipient_phone_number: normalizePhoneNumber(candidate.phone),
    user_data: bolnaContext
  };

  if (process.env.BOLNA_FROM_PHONE_NUMBER) {
    payload.from_phone_number = process.env.BOLNA_FROM_PHONE_NUMBER;
  }

  const scheduledAt = process.env.BOLNA_SCHEDULED_AT;
  if (scheduledAt) {
    payload.scheduled_at = scheduledAt;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: buildBolnaAuthHeader(process.env.BOLNA_API_KEY || ""),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_error) {
    data = { raw };
  }

  return { ok: response.ok, status: response.status, data, endpoint, payload };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "striker-screening-app" });
});

app.get("/api/candidates", (_req, res) => {
  const context = readContext();
  res.json({ candidates: context.candidates });
});

app.get("/api/candidate/:id", (req, res) => {
  const context = readContext();
  const candidate = context.candidates.find((c) => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  return res.json({ candidate });
});

app.post("/api/candidates", (req, res) => {
  const payload = req.body || {};
  const {
    name,
    email,
    phone,
    location,
    experienceHint,
    role,
    resumeSummary,
    resumeText,
    jobId,
    jobDescription
  } = payload;

  if (!name || !phone || !role) {
    return res.status(400).json({ error: "name, phone, and role are required" });
  }

  const context = readContext();
  const candidate = {
    id: makeId("cand"),
    name,
    email: email || "",
    phone,
    location: location || "",
    experienceHint: experienceHint || "",
    role,
    status: "New",
    resumeSummary: compactText(resumeSummary, 500),
    resumeText: compactText(resumeText, 4000),
    jobId: jobId || "",
    jobDescription: compactText(jobDescription, 4000)
  };

  context.candidates.unshift(candidate);
  writeContext(context);
  return res.status(201).json({ candidate });
});

app.put("/api/candidate/:id/context", (req, res) => {
  const payload = req.body || {};
  const context = readContext();
  const candidate = context.candidates.find((c) => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  candidate.name = payload.name ?? candidate.name;
  candidate.email = payload.email ?? candidate.email;
  candidate.phone = payload.phone ?? candidate.phone;
  candidate.resumeSummary = compactText(payload.resumeSummary ?? candidate.resumeSummary, 500);
  candidate.resumeText = compactText(payload.resumeText ?? candidate.resumeText, 4000);
  candidate.jobId = payload.jobId ?? candidate.jobId;
  candidate.jobDescription = compactText(payload.jobDescription ?? candidate.jobDescription, 4000);
  candidate.role = payload.role ?? candidate.role;
  candidate.experienceHint = payload.experienceHint ?? candidate.experienceHint;
  candidate.location = payload.location ?? candidate.location;

  writeContext(context);
  return res.json({ candidate });
});

app.get("/api/jobs", (_req, res) => {
  const context = readContext();
  return res.json({ jobs: context.jobs || [] });
});

app.post("/api/jobs", (req, res) => {
  const payload = req.body || {};
  if (!payload.title || !payload.description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  const context = readContext();
  const job = {
    id: makeId("job"),
    title: payload.title,
    description: compactText(payload.description, 6000)
  };
  context.jobs.unshift(job);
  writeContext(context);
  return res.status(201).json({ job });
});

app.post("/api/screening/start", async (req, res) => {
  const { candidateId } = req.body || {};

  if (!candidateId) {
    return res.status(400).json({ error: "candidateId is required" });
  }

  const context = readContext();
  const candidate = context.candidates.find((c) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const matchedJob = context.jobs.find((job) => job.id === candidate.jobId);
  const jobDescription = candidate.jobDescription || matchedJob?.description || "";
  const readinessError = validateScreeningReadiness(candidate, jobDescription);
  if (readinessError) {
    return res.status(400).json({ error: readinessError });
  }

  const bolnaContext = {
    candidate_id: candidate.id,
    candidate_name: candidate.name,
    candidateName: candidate.name,
    role: candidate.role,
    phone: normalizePhoneNumber(candidate.phone),
    location: candidate.location || "",
    experience_hint: candidate.experienceHint || "",
    experienceHint: candidate.experienceHint || "",
    resume_summary: compactText(candidate.resumeSummary, 500),
    resumeSummary: compactText(candidate.resumeSummary, 500),
    resume_text: compactText(candidate.resumeText, 1500),
    resumeText: compactText(candidate.resumeText, 1500),
    job_description: compactText(jobDescription, 1500),
    jobDescription: compactText(jobDescription, 1500),
    company_name: process.env.COMPANY_NAME || "Striker AI",
    companyName: process.env.COMPANY_NAME || "Striker AI"
  };

  const previousStatus = candidate.status || "New";
  candidate.status = "Screening";
  writeContext(context);

  const hasBolnaConfig = Boolean(process.env.BOLNA_AGENT_ID && process.env.BOLNA_API_KEY);
  if (!hasBolnaConfig) {
    const mockSessionId = `sess_${Date.now()}`;
    return res.json({
      sessionId: mockSessionId,
      candidateId: candidate.id,
      status: "triggered",
      mode: "mock",
      bolnaContext,
      message: "Mock session started. Configure BOLNA_AGENT_ID and BOLNA_API_KEY for live calls."
    });
  }

  try {
    const bolnaResponse = await triggerBolnaCall({ candidate, bolnaContext });
    if (!bolnaResponse.ok) {
      candidate.status = previousStatus;
      writeContext(context);
      return res.status(502).json({
        error: "Bolna call trigger failed",
        bolnaStatus: bolnaResponse.status,
        bolnaResponse: bolnaResponse.data,
        bolnaEndpoint: bolnaResponse.endpoint,
        bolnaPayload: bolnaResponse.payload,
        bolnaContext
      });
    }

    return res.json({
      status: "queued",
      mode: "bolna",
      candidateId: candidate.id,
      executionId: bolnaResponse.data.execution_id || null,
      bolnaResponse: bolnaResponse.data,
      bolnaContext,
      message: "Live Bolna call queued successfully."
    });
  } catch (error) {
    candidate.status = previousStatus;
    writeContext(context);
    return res.status(502).json({
      error: "Failed to connect to Bolna API",
      details: error.message,
      bolnaContext
    });
  }
});

app.post("/api/screening/result", (req, res) => {
  const payload = req.body || {};
  const candidateId = payload.candidate_id || payload.candidateId;
  const recommendation = payload.recommendation;

  if (!candidateId || !recommendation) {
    return res.status(400).json({
      error: "candidate_id (or candidateId) and recommendation are required"
    });
  }

  const db = readResults();
  const result = {
    id: `result_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload
  };

  db.results = [result, ...db.results.filter((r) => (r.candidate_id || r.candidateId) !== candidateId)];
  writeResults(db);

  const context = readContext();
  const candidate = context.candidates.find((c) => c.id === candidateId);
  if (candidate) {
    candidate.status = "Screened";
    writeContext(context);
  }

  return res.status(201).json({ ok: true, saved: result.id });
});

app.post("/api/bolna/webhook", (req, res) => {
  const event = req.body || {};

  // Accept webhook and store final result if sent by agent.
  if (event.type === "screening_result" && event.data) {
    const db = readResults();
    const result = {
      id: `result_${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: "bolna_webhook",
      ...event.data
    };
    const candidateId = result.candidate_id || result.candidateId;
    db.results = [result, ...db.results.filter((r) => (r.candidate_id || r.candidateId) !== candidateId)];
    writeResults(db);
  }

  return res.json({ ok: true });
});

app.get("/api/screening", (_req, res) => {
  const db = readResults();
  return res.json({ results: db.results });
});

app.get("/api/screening/:candidateId", (req, res) => {
  const db = readResults();
  const result = db.results.find(
    (r) => (r.candidate_id || r.candidateId) === req.params.candidateId
  );

  if (!result) {
    return res.status(404).json({ error: "No result found for this candidate yet" });
  }

  return res.json({ result });
});

app.get("/api/context/:candidateId", (req, res) => {
  const context = readContext();
  const candidate = context.candidates.find((c) => c.id === req.params.candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }
  const matchedJob = context.jobs.find((job) => job.id === candidate.jobId);
  const jobDescription = candidate.jobDescription || matchedJob?.description || "";

  return res.json({
    context: {
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      candidateName: candidate.name,
      role: candidate.role,
      phone: candidate.phone,
      location: candidate.location || "",
      experience_hint: candidate.experienceHint || "",
      experienceHint: candidate.experienceHint || "",
      resume_summary: compactText(candidate.resumeSummary, 500),
      resumeSummary: compactText(candidate.resumeSummary, 500),
      resume_text: compactText(candidate.resumeText, 1500),
      resumeText: compactText(candidate.resumeText, 1500),
      job_description: compactText(jobDescription, 1500),
      jobDescription: compactText(jobDescription, 1500),
      company_name: process.env.COMPANY_NAME || "Striker AI",
      companyName: process.env.COMPANY_NAME || "Striker AI"
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`App running at http://localhost:${PORT}`);
});
