# Business Requirements Document (BRD)

## Project Title

Striker AI - Voice-Based First-Round Interview Screening Platform

## Version

v1.0

## Date

2026-03-08

## 1) Executive Summary

Striker AI is a recruiter workflow platform that combines:

- A web application for recruiter operations (login, candidate management, screening dashboard)
- A Bolna voice AI agent for first-round interview screening calls
- Backend APIs for workflow orchestration, scoring persistence, and result retrieval

The solution reduces manual recruiter effort in repetitive first-round interviews while standardizing interview quality and speeding up shortlisting decisions.

## 2) Business Problem

Recruiters spend significant time conducting repetitive screening calls, capturing notes manually, and inconsistently evaluating candidates. This causes:

- Delayed hiring cycles
- Inconsistent candidate assessment quality
- High operational overhead for recruiting teams

## 3) Business Objectives

- Automate first-round screening interviews via voice AI
- Provide a single recruiter dashboard for candidate lifecycle actions
- Standardize scoring and recommendations (Proceed / Hold / Reject)
- Reduce average screening time per candidate

## 4) Scope

### In Scope

- Recruiter login
- Candidate management (create/list/view/update/delete candidates)
- Start AI screening call from candidate profile
- Receive and store screening results from Bolna webhook/API
- Display candidate-wise latest result and score breakdown
- Basic dashboard metrics (total screened, recommendation split)

### Out of Scope (Phase 1)

- Full ATS integration (Greenhouse/Lever/Workday)
- Advanced role-based access control beyond recruiter/admin
- Multi-round interview scheduling automation
- Automated offer management

## 5) User Roles

- Recruiter: logs in, manages candidates, triggers screening, reviews outcomes
- Hiring Manager (read-only in v1): views candidate outcomes and recommendations
- System Admin: manages platform settings and integrations

## 6) Functional Requirements

### 6.1 Authentication & Login

- FR-LOGIN-01: System shall support secure login with email and password.
- FR-LOGIN-02: System shall validate user credentials before granting access.
- FR-LOGIN-03: System shall maintain authenticated user session.
- FR-LOGIN-04: System shall support logout and session invalidation.
- FR-LOGIN-05: Unauthorized users shall be blocked from dashboard and APIs.

### 6.2 Candidate Management

- FR-CAND-01: Recruiter shall be able to create a new candidate record.
- FR-CAND-02: Candidate fields shall include name, phone, email, target role, experience range, location, and status.
- FR-CAND-03: Recruiter shall be able to list all candidates with status filters.
- FR-CAND-04: Recruiter shall be able to view candidate profile details.
- FR-CAND-05: Recruiter shall be able to edit candidate profile details.
- FR-CAND-06: Recruiter shall be able to archive/delete candidate records.
- FR-CAND-07: System shall show screening history per candidate.

### 6.3 Screening Workflow (Bolna Agent)

- FR-SCR-01: Recruiter shall be able to trigger a screening session from candidate profile.
- FR-SCR-02: System shall pass candidate context variables to Bolna agent (candidate_id, candidate_name, role, company_name).
- FR-SCR-03: Bolna agent shall conduct structured first-round interview as per prompt policy.
- FR-SCR-04: System shall receive final structured result payload via webhook/API.
- FR-SCR-05: System shall persist recommendation, score, transcript summary, strengths, and concerns.
- FR-SCR-06: Recruiter shall see final result on dashboard in near real time.

### 6.4 Results, Scoring & Decisioning

- FR-RES-01: System shall display score categories (technical, project depth, communication, logistics).
- FR-RES-02: System shall compute/store overall score (0-100).
- FR-RES-03: System shall map recommendation based on threshold:
  - Proceed: 75+
  - Hold: 55-74
  - Reject: <55
- FR-RES-04: Recruiter shall be able to add notes after reviewing AI result.

### 6.5 Dashboard & Reporting

- FR-REP-01: Dashboard shall show total candidates screened.
- FR-REP-02: Dashboard shall show recommendation split (Proceed/Hold/Reject).
- FR-REP-03: Dashboard shall show latest screening outcomes list.

## 7) Non-Functional Requirements

- NFR-01: System availability target: 99.0% (MVP)
- NFR-02: API response time target: < 500 ms for read endpoints (excluding external Bolna latency)
- NFR-03: Secure transport using HTTPS in deployed environment
- NFR-04: Basic auditability for candidate updates and screening result timestamps
- NFR-05: Input validation and error-safe API behavior
- NFR-06: Data privacy compliance for candidate personal data (PII minimization and access control)

## 8) Compliance & Interview Guardrails

- Agent must avoid protected/sensitive personal questions (religion, caste, marital status, medical conditions, political views, etc.).
- Agent questions must remain job-relevant and role-specific.
- System must store only required candidate information for recruitment workflow.

## 9) User Journey (End-to-End)

1. Recruiter logs into web app.
2. Recruiter creates/selects a candidate from candidate management.
3. Recruiter clicks "Start Screening."
4. App triggers Bolna agent session with candidate variables.
5. Candidate completes voice screening call with AI agent.
6. Bolna sends structured result to backend webhook/API.
7. Backend stores result and updates candidate screening status.
8. Recruiter reviews recommendation and score in dashboard.

## 10) Success Metrics (KPIs)

- Reduction in recruiter time spent per first-round screening
- Percentage of screenings completed without human intervention
- Time from candidate creation to screening decision
- Proceed/Hold/Reject distribution quality (tracked over time)

## 11) Assumptions

- Bolna API/webhook is available and reachable from deployed backend.
- Recruiters have valid candidate contact details before call initiation.
- Voice screening is limited to predefined role templates in MVP.

## 12) Risks & Mitigations

- Risk: Inaccurate interpretation of candidate responses  
Mitigation: Structured prompt, follow-up clarifications, recruiter override notes
- Risk: Webhook failures or delayed callbacks  
Mitigation: Retry strategy, idempotent save endpoint, monitoring logs
- Risk: Compliance concerns in interview questioning  
Mitigation: Strict prompt guardrails and policy review

## 13) Acceptance Criteria (MVP Sign-off)

- AC-01: Recruiter can log in and log out successfully.
- AC-02: Recruiter can perform full candidate CRUD operations.
- AC-03: Recruiter can trigger screening call for a selected candidate.
- AC-04: Backend receives and stores screening result payload.
- AC-05: Dashboard displays recommendation and score for selected candidate.
- AC-06: End-to-end demo flow works: User -> Web App -> Bolna Agent -> Backend -> Output.

## 14) Proposed MVP Timeline

- Day 1: Login + candidate management + basic dashboard
- Day 2: Bolna integration + webhook/result persistence
- Day 3: QA, demo script, deployment, and submission assets

