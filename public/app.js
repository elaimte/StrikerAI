const appRoot = document.getElementById("appRoot");
const leftNav = document.getElementById("leftNav");

const state = {
  view: "dashboard",
  candidates: [],
  jobs: [],
  resultsByCandidate: {},
  searchTerm: "",
  selectedCandidateId: null
};

function initials(name) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function recommendationClass(tag) {
  const text = (tag || "").toLowerCase();
  if (text === "proceed") return "pill-proceed";
  if (text === "hold") return "pill-hold";
  return "pill-reject";
}

function statusClass(tag) {
  const text = (tag || "").toLowerCase();
  if (text === "screened") return "pill-screened";
  if (text === "screening") return "pill-screening";
  return "pill-new";
}

function getCandidateResult(candidateId) {
  return state.resultsByCandidate[candidateId] || null;
}

function candidateWithDerived(candidate) {
  const result = getCandidateResult(candidate.id);
  return {
    ...candidate,
    score: result?.scores?.overall ?? null,
    recommendation: result?.recommendation ?? null
  };
}

function renderSidebar() {
  Array.from(leftNav.querySelectorAll(".nav-item")).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });
}

function renderDashboard() {
  const totalCandidates = state.candidates.length;
  const screened = state.candidates.filter((c) => getCandidateResult(c.id)).length;
  const proceed = Object.values(state.resultsByCandidate).filter(
    (r) => (r.recommendation || "").toLowerCase() === "proceed"
  ).length;
  const hold = Object.values(state.resultsByCandidate).filter(
    (r) => (r.recommendation || "").toLowerCase() === "hold"
  ).length;
  const reject = Object.values(state.resultsByCandidate).filter(
    (r) => (r.recommendation || "").toLowerCase() === "reject"
  ).length;

  const recent = state.candidates
    .map(candidateWithDerived)
    .filter((c) => c.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  appRoot.innerHTML = `
    <h1 class="section-title">Dashboard</h1>
    <p class="subtitle">Overview of your screening pipeline</p>

    <section class="stats">
      <article class="card stat"><div class="stat-value">${totalCandidates}</div><div class="stat-label">Total Candidates</div></article>
      <article class="card stat"><div class="stat-value">${screened}</div><div class="stat-label">Screened</div></article>
      <article class="card stat"><div class="stat-value">${proceed}</div><div class="stat-label">Proceed</div></article>
      <article class="card stat"><div class="stat-value">${hold}</div><div class="stat-label">Hold</div></article>
      <article class="card stat"><div class="stat-value">${reject}</div><div class="stat-label">Reject</div></article>
    </section>

    <section class="card section">
      <h2 class="section-title" style="font-size: 28px;">Recent Screenings</h2>
      ${recent
        .map(
          (r) => `
        <div class="list-item">
          <div class="candidate-cell">
            <div class="avatar">${initials(r.name)}</div>
            <div>
              <div><strong>${r.name}</strong></div>
              <div class="muted">${r.role}</div>
            </div>
          </div>
          <div class="candidate-cell">
            <div class="score">${r.score}/100</div>
            <span class="pill ${recommendationClass(r.recommendation)}">${r.recommendation}</span>
          </div>
        </div>
      `
        )
        .join("")}
    </section>
  `;
}

function renderCandidatesPage() {
  const rows = state.candidates
    .map(candidateWithDerived)
    .filter((c) => {
      if (!state.searchTerm.trim()) return true;
      const text = `${c.name} ${c.role} ${c.location}`.toLowerCase();
      return text.includes(state.searchTerm.toLowerCase());
    });

  appRoot.innerHTML = `
    <div class="row-between">
      <div>
        <h1 class="section-title">Candidates</h1>
        <p class="subtitle">Manage and screen your candidate pipeline</p>
      </div>
      <button class="primary-btn" id="addCandidateBtn">+ Add Candidate</button>
    </div>

    <input id="searchInput" class="search" placeholder="Search by name, role, or location..." value="${state.searchTerm}" />

    <section class="card section">
      <table class="table">
        <thead>
          <tr>
            <th>CANDIDATE</th>
            <th>ROLE</th>
            <th>EXPERIENCE</th>
            <th>STATUS</th>
            <th>RESULT</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (c) => `
              <tr data-id="${c.id}" class="candidate-row">
                <td>
                  <div class="candidate-cell">
                    <div class="avatar">${initials(c.name)}</div>
                    <div>
                      <div><strong>${c.name}</strong></div>
                      <div class="muted">${c.location || "-"}</div>
                    </div>
                  </div>
                </td>
                <td>${c.role}</td>
                <td>${c.experienceHint}</td>
                <td><span class="pill ${statusClass(c.status)}">${c.status || "New"}</span></td>
                <td>
                  ${
                    c.score !== null
                      ? `<span class="score">${c.score}</span> <span class="pill ${recommendationClass(c.recommendation)}">${c.recommendation}</span>`
                      : "<span class='muted'>-</span>"
                  }
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <div id="candidateModal" class="modal hidden">
      <div class="modal-card">
        <div class="row-between">
          <h3 style="margin:0;">Add Candidate + Context</h3>
          <button class="ghost-btn" id="closeModalBtn">Close</button>
        </div>
        <form id="candidateForm" class="modal-form">
          <input name="name" placeholder="Candidate name" required />
          <input name="email" placeholder="Email" />
          <input name="phone" placeholder="Phone" required />
          <input name="location" placeholder="Location" />
          <input name="role" placeholder="Role" required />
          <input name="experienceHint" placeholder="Experience (e.g. 3-5 years)" />
          <select name="jobId">
            <option value="">Select existing job (optional)</option>
            ${state.jobs.map((job) => `<option value="${job.id}">${job.title}</option>`).join("")}
          </select>
          <textarea name="resumeSummary" rows="3" placeholder="Resume summary (key highlights)"></textarea>
          <textarea name="resumeText" rows="5" placeholder="Resume text (optional detailed context)"></textarea>
          <textarea name="jobDescription" rows="5" placeholder="Job description text (if no job selected)"></textarea>
          <button type="submit" class="primary-btn">Save Candidate</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    render();
  });

  document.getElementById("addCandidateBtn").addEventListener("click", () => {
    document.getElementById("candidateModal").classList.remove("hidden");
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("candidateModal").classList.add("hidden");
  });

  document.getElementById("candidateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      location: form.get("location"),
      role: form.get("role"),
      experienceHint: form.get("experienceHint"),
      jobId: form.get("jobId"),
      resumeSummary: form.get("resumeSummary"),
      resumeText: form.get("resumeText"),
      jobDescription: form.get("jobDescription")
    };

    const response = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || "Failed to create candidate.");
      return;
    }
    document.getElementById("candidateModal").classList.add("hidden");
    await refreshData();
  });

  Array.from(document.querySelectorAll(".candidate-row")).forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedCandidateId = row.dataset.id;
      state.view = "candidate-detail";
      render();
    });
  });
}

async function triggerScreening(candidateId) {
  const response = await fetch("/api/screening/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId })
  });
  const data = await response.json();
  if (!response.ok) {
    window.alert(data.error || "Failed to trigger screening call.");
    return;
  }
  window.alert(
    `${data.message || "Screening call triggered."}\n\nContext passed:\n${JSON.stringify(
      data.bolnaContext || {},
      null,
      2
    )}`
  );
}

async function refreshData() {
  await loadData();
  render();
}

function metricCircle(label, value) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  return `
    <div class="center">
      <div class="score-ring" style="--pct:${normalized}">
        <span>${normalized}</span>
      </div>
      <div class="muted">${label}</div>
    </div>
  `;
}

function renderCandidateDetail() {
  const candidate = state.candidates.find((c) => c.id === state.selectedCandidateId);
  if (!candidate) {
    state.view = "candidates";
    render();
    return;
  }

  const result = getCandidateResult(candidate.id);
  const scores = result?.scores || {};
  const recommendation = result?.recommendation || "Pending";

  appRoot.innerHTML = `
    <section class="card section">
      <div class="candidate-header">
        <div class="avatar-large">${initials(candidate.name)}</div>
        <div>
          <h1 class="section-title" style="font-size: 40px; margin-bottom: 4px;">${candidate.name}</h1>
          <div class="muted">${candidate.role}</div>
          <div style="margin-top: 6px;">
            <span class="pill ${statusClass(candidate.status)}">${candidate.status || "New"}</span>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box"><div class="label">Email</div><div class="value">${candidate.email || "-"}</div></div>
        <div class="info-box"><div class="label">Phone</div><div class="value">${candidate.phone || "-"}</div></div>
        <div class="info-box"><div class="label">Location</div><div class="value">${candidate.location || "-"}</div></div>
        <div class="info-box"><div class="label">Experience</div><div class="value">${candidate.experienceHint || "-"}</div></div>
      </div>

      <div class="row-between" style="margin-top: 6px;">
        <h2 style="margin: 0;">Screening Result</h2>
        <span class="pill ${recommendationClass(recommendation)}">${recommendation}</span>
      </div>

      <div class="scores">
        ${metricCircle("Overall", scores.overall)}
        ${metricCircle("Technical", scores.technical_fit)}
        ${metricCircle("Project Depth", scores.project_depth)}
        ${metricCircle("Communication", scores.communication)}
        ${metricCircle("Logistics", scores.logistics_fit)}
      </div>

      <div class="split">
        <div>
          <h3>Strengths</h3>
          ${(result?.strengths || ["No data yet"]).map((item) => `<div class="list-pill">${item}</div>`).join("")}
        </div>
        <div>
          <h3>Concerns</h3>
          ${(result?.concerns || ["No data yet"]).map((item) => `<div class="list-pill">${item}</div>`).join("")}
        </div>
      </div>

      <div style="margin-top: 16px;">
        <h3>Interview Summary</h3>
        <div class="list-pill">${result?.project_summary || result?.notes || "No summary available yet."}</div>
      </div>

      <div class="footer-actions">
        <button class="ghost-btn" id="editCandidateBtn">Edit Candidate</button>
        <button class="primary-btn" id="startCallBtn">Start Screening Call</button>
        <button class="ghost-btn" id="refreshBtn">Refresh Results</button>
        <button class="ghost-btn" id="backBtn">Back to Candidates</button>
      </div>

      <div id="editCandidateModal" class="modal hidden">
        <div class="modal-card">
          <div class="row-between">
            <h3 style="margin:0;">Edit Candidate</h3>
            <button class="ghost-btn" id="closeEditModalBtn">Close</button>
          </div>
          <form id="editCandidateForm" class="modal-form">
            <input name="name" value="${candidate.name || ""}" placeholder="Candidate name" required />
            <input name="email" value="${candidate.email || ""}" placeholder="Email" />
            <input name="phone" value="${candidate.phone || ""}" placeholder="Phone (+country code)" required />
            <input name="location" value="${candidate.location || ""}" placeholder="Location" />
            <input name="role" value="${candidate.role || ""}" placeholder="Role" required />
            <input name="experienceHint" value="${candidate.experienceHint || ""}" placeholder="Experience (e.g. 3-5 years)" />
            <select name="jobId">
              <option value="">Select existing job (optional)</option>
              ${state.jobs
                .map(
                  (job) =>
                    `<option value="${job.id}" ${candidate.jobId === job.id ? "selected" : ""}>${job.title}</option>`
                )
                .join("")}
            </select>
            <textarea name="resumeSummary" rows="3" placeholder="Resume summary (key highlights)">${candidate.resumeSummary || ""}</textarea>
            <textarea name="resumeText" rows="5" placeholder="Resume text (optional detailed context)">${candidate.resumeText || ""}</textarea>
            <textarea name="jobDescription" rows="5" placeholder="Job description text (if no job selected)">${candidate.jobDescription || ""}</textarea>
            <button type="submit" class="primary-btn">Save Changes</button>
          </form>
        </div>
      </div>
    </section>
  `;

  document.getElementById("editCandidateBtn").addEventListener("click", () => {
    document.getElementById("editCandidateModal").classList.remove("hidden");
  });
  document.getElementById("closeEditModalBtn").addEventListener("click", () => {
    document.getElementById("editCandidateModal").classList.add("hidden");
  });
  document.getElementById("editCandidateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      location: form.get("location"),
      role: form.get("role"),
      experienceHint: form.get("experienceHint"),
      jobId: form.get("jobId"),
      resumeSummary: form.get("resumeSummary"),
      resumeText: form.get("resumeText"),
      jobDescription: form.get("jobDescription")
    };

    const response = await fetch(`/api/candidate/${candidate.id}/context`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error || "Failed to update candidate.");
      return;
    }
    document.getElementById("editCandidateModal").classList.add("hidden");
    await refreshData();
  });

  document.getElementById("startCallBtn").addEventListener("click", async () => {
    await triggerScreening(candidate.id);
  });
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    await refreshData();
  });
  document.getElementById("backBtn").addEventListener("click", () => {
    state.view = "candidates";
    render();
  });
}

function render() {
  renderSidebar();
  if (state.view === "dashboard") return renderDashboard();
  if (state.view === "candidates") return renderCandidatesPage();
  if (state.view === "candidate-detail") return renderCandidateDetail();
}

async function loadData() {
  const [candidatesRes, resultsRes, jobsRes] = await Promise.all([
    fetch("/api/candidates"),
    fetch("/api/screening"),
    fetch("/api/jobs")
  ]);
  const candidatesData = await candidatesRes.json();
  const resultsData = await resultsRes.json();
  const jobsData = await jobsRes.json();

  state.candidates = candidatesData.candidates || [];
  state.jobs = jobsData.jobs || [];
  state.resultsByCandidate = {};

  (resultsData.results || []).forEach((result) => {
    const key = result.candidate_id || result.candidateId;
    state.resultsByCandidate[key] = result;
  });
}

leftNav.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-item");
  if (!button) return;
  state.view = button.dataset.view;
  render();
});

loadData()
  .then(() => render())
  .catch((error) => {
    appRoot.innerHTML = `<p>Unable to load data: ${error.message}</p>`;
  });
