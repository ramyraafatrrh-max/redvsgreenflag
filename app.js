const statements = [
  "A teammate consistently delivers great work, but rarely communicates progress until the deadline.",
  "A customer asks for a shortcut that saves time but skips an important quality check.",
  "A participant dominates the discussion and answers before others get a chance to speak.",
  "A project is moving fast, but the team has not documented the key decisions yet."
];

const STORAGE_KEY = "redGreenFlagGameState.v2";
const PARTICIPANT_ID_KEY = "redGreenFlagParticipantId.v2";

function defaultState() {
  return {
    phase: "waiting",
    currentIndex: 0,
    participants: [],
    votes: statements.map(() => ({ red: 0, green: 0 })),
    votedRounds: {}
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState();
    const parsed = JSON.parse(saved);
    return {
      ...defaultState(),
      ...parsed,
      votes: Array.isArray(parsed.votes) && parsed.votes.length === statements.length
        ? parsed.votes
        : statements.map(() => ({ red: 0, green: 0 })),
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      votedRounds: parsed.votedRounds || {}
    };
  } catch (error) {
    return defaultState();
  }
}

let state = loadState();
const $ = (id) => document.getElementById(id);

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getParticipantId() {
  let id = localStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}

function totals() {
  return state.votes.reduce((acc, round) => {
    acc.red += round.red;
    acc.green += round.green;
    return acc;
  }, { red: 0, green: 0 });
}

function currentVote() {
  return state.votes[state.currentIndex] || { red: 0, green: 0 };
}

function activeParticipants() {
  return state.participants.filter((participant) => participant.active).length;
}

function pct(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function participantVoteKey() {
  return `${getParticipantId()}-${state.currentIndex}`;
}

function hasVoted() {
  return Boolean(state.votedRounds[participantVoteKey()]);
}

function startGame() {
  state.phase = "playing";
  state.currentIndex = 0;
  state.votes = statements.map(() => ({ red: 0, green: 0 }));
  state.votedRounds = {};
  saveState();
  render();
}

function nextStep() {
  if (state.currentIndex < statements.length - 1) {
    state.currentIndex += 1;
  } else {
    state.phase = "results";
  }
  saveState();
  render();
}

function resetGame() {
  state = defaultState();
  saveState();
  render();
}

function joinGame() {
  const input = $("participantName");
  const cleanName = (input.value || "").trim() || `Participant ${state.participants.length + 1}`;
  const participantId = getParticipantId();
  const existingIndex = state.participants.findIndex((participant) => participant.id === participantId);

  if (existingIndex >= 0) {
    state.participants[existingIndex] = { ...state.participants[existingIndex], name: cleanName, active: true };
  } else {
    state.participants.push({ id: participantId, name: cleanName, active: true });
  }

  input.value = cleanName;
  saveState();
  render();
}

function submitVote(flag) {
  if (state.phase !== "playing" || hasVoted()) return;
  state.votes[state.currentIndex][flag] += 1;
  state.votedRounds[participantVoteKey()] = flag;
  saveState();
  render();
}

function statementCard() {
  return `<div class="statement"><div class="label">Statement</div><h3>${statements[state.currentIndex]}</h3></div>`;
}

function metric(color, label, value, total) {
  const width = pct(value, total || 1);
  return `
    <div class="metric">
      <div class="metric-top"><span>${label}</span><strong>${value}</strong></div>
      <div class="bar"><div class="${color}-fill" style="width:${width}%"></div></div>
    </div>
  `;
}

function resultsHtml(includeReset) {
  const t = totals();
  const totalVotes = t.red + t.green;
  const redPercent = pct(t.red, totalVotes);
  const greenPercent = totalVotes ? 100 - redPercent : 0;

  return `
    <div class="label">Final result</div>
    <h3>Flag percentages</h3>
    <div class="result-grid">
      <div class="result-card red">
        <p>Red flags</p>
        <div class="percent">${redPercent}%</div>
        <small>${t.red} total votes</small>
      </div>
      <div class="result-card green">
        <p>Green flags</p>
        <div class="percent">${greenPercent}%</div>
        <small>${t.green} total votes</small>
      </div>
    </div>
    ${includeReset ? '<button class="primary-btn" onclick="resetGame()" type="button">↻ Reset game</button>' : ''}
  `;
}

function updateOverview() {
  const t = totals();
  if ($("participantCount")) $("participantCount").textContent = activeParticipants();
  if ($("sideParticipants")) $("sideParticipants").textContent = activeParticipants();
  if ($("totalRed")) $("totalRed").textContent = t.red;
  if ($("totalGreen")) $("totalGreen").textContent = t.green;
  if ($("statusText")) $("statusText").textContent = state.phase === "waiting" ? "Waiting" : state.phase === "playing" ? "In progress" : "Results";
  if ($("roundText")) $("roundText").textContent = state.phase === "playing" ? `${state.currentIndex + 1} / ${statements.length}` : "--";
}

function renderOwnerPage() {
  ["ownerWaiting", "ownerPlaying", "ownerResults"].forEach((id) => $(id).classList.add("hidden"));

  if (state.phase === "waiting") {
    $("ownerWaiting").classList.remove("hidden");
  }

  if (state.phase === "playing") {
    const cv = currentVote();
    const totalRoundVotes = cv.red + cv.green;
    $("ownerPlaying").innerHTML = `
      <div class="round-row">
        <span class="pill">Statement ${state.currentIndex + 1} of ${statements.length}</span>
        <span class="pill orange">Live votes: ${totalRoundVotes}</span>
      </div>
      ${statementCard()}
      <div class="vote-grid">
        ${metric("red", "Red flags", cv.red, Math.max(1, totalRoundVotes))}
        ${metric("green", "Green flags", cv.green, Math.max(1, totalRoundVotes))}
      </div>
      <button class="ghost-btn" onclick="nextStep()" type="button">${state.currentIndex === statements.length - 1 ? "Show final percentages" : "Next statement"} →</button>
    `;
    $("ownerPlaying").classList.remove("hidden");
  }

  if (state.phase === "results") {
    $("ownerResults").innerHTML = resultsHtml(true);
    $("ownerResults").classList.remove("hidden");
  }

  const participantLink = new URL("participant.html", window.location.href).href;
  if ($("participantLink")) $("participantLink").textContent = participantLink;
  updateOverview();
}

function renderParticipantPage() {
  ["participantWaiting", "participantPlaying", "participantResults"].forEach((id) => $(id).classList.add("hidden"));

  const participantId = getParticipantId();
  const existingParticipant = state.participants.find((participant) => participant.id === participantId);
  if ($("participantName") && existingParticipant) $("participantName").value = existingParticipant.name;

  if (state.phase === "waiting") {
    $("participantWaiting").classList.remove("hidden");
  }

  if (state.phase === "playing") {
    const selected = state.votedRounds[participantVoteKey()];
    $("participantPlaying").innerHTML = `
      <div class="round-row"><span class="pill">Statement ${state.currentIndex + 1} of ${statements.length}</span></div>
      ${statementCard()}
      <div class="vote-grid">
        <button class="flag-btn red ${selected === "red" ? "selected-red" : ""}" ${hasVoted() ? "disabled" : ""} onclick="submitVote('red')" type="button">
          <div class="flag-icon">⚑</div><strong>Red Flag</strong><small>Choose this if the statement feels like a risk or warning sign.</small>
        </button>
        <button class="flag-btn green ${selected === "green" ? "selected-green" : ""}" ${hasVoted() ? "disabled" : ""} onclick="submitVote('green')" type="button">
          <div class="flag-icon">⚑</div><strong>Green Flag</strong><small>Choose this if the statement feels like a healthy or positive signal.</small>
        </button>
      </div>
      ${hasVoted() ? '<div class="notice">Vote submitted. Waiting for the owner to move next.</div>' : ''}
    `;
    $("participantPlaying").classList.remove("hidden");
  }

  if (state.phase === "results") {
    $("participantResults").innerHTML = resultsHtml(false);
    $("participantResults").classList.remove("hidden");
  }

  updateOverview();
}

function render() {
  state = loadState();
  const page = document.body.dataset.page;
  if (page === "owner") renderOwnerPage();
  if (page === "participant") renderParticipantPage();
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) render();
});
