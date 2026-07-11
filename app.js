import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const statements = [
  "الشخص ده مبادر جداً، أول واحد يتطوع في أي أزمة أو مشكلة مستحيلة عشان ينقذ الموقف، بس عيبه إنه في نص السكة بيتوتر جداً، بيفقد ثقته في نفسه، وبيجيب ورا، ولازم حد تاني يتدخل يلحقه",
  "الشخص ده مابيعرفش يوزن الأمور. لو حاولت تخدمه أو تكرمه، يرفض بشدة وبطريقة دفاعية ويقولك 'مستحيل أسمحلك تعمل كده'. ولما تقنعه بوجهة نظرك، يقلب 180 درجة ويطلب منك تعمل كل حاجة بزيادة وبمبالغة!",
  "عنده ولاء عالي جداً لأصحابه، بس المشكلة إن دمه حامي وانفعالي لدرجة الغشومية. لو حد اتخانق مع صاحبه، ممكن يمد إيده",
  "جدع ومستعد يقف معاك في أي زنقة بس وقت الجد يبيعك عادي جدا"
];

const GAME_ID = "main-session";
const PARTICIPANT_ID_KEY = "redGreenFlagParticipantId.firebase.v1";
let db;
let gameRef;
let state = defaultState();
let unsubscribeStarted = false;

function defaultState() {
  return {
    phase: "waiting",
    currentIndex: 0,
    participants: {},
    votes: statements.map(() => ({ red: 0, green: 0 })),
    votedRounds: {}
  };
}

function isFirebaseConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PASTE_YOUR");
}

function normalizeState(value) {
  const base = defaultState();
  if (!value) return base;
  return {
    ...base,
    ...value,
    participants: value.participants || {},
    votedRounds: value.votedRounds || {},
    votes: Array.isArray(value.votes) && value.votes.length === statements.length
      ? value.votes.map((round) => ({ red: Number(round.red || 0), green: Number(round.green || 0) }))
      : base.votes
  };
}

function getParticipantId() {
  let id = localStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}

function $(id) {
  return document.getElementById(id);
}

function participantList() {
  return Object.values(state.participants || {});
}

function activeParticipants() {
  return participantList().filter((participant) => participant.active).length;
}

function totals() {
  return state.votes.reduce((acc, round) => {
    acc.red += Number(round.red || 0);
    acc.green += Number(round.green || 0);
    return acc;
  }, { red: 0, green: 0 });
}

function currentVote() {
  return state.votes[state.currentIndex] || { red: 0, green: 0 };
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

async function ensureInitialGame() {
  const snapshot = await get(gameRef);
  if (!snapshot.exists()) {
    await set(gameRef, defaultState());
  }
}

async function startGame() {
  await update(gameRef, {
    phase: "playing",
    currentIndex: 0,
    votes: statements.map(() => ({ red: 0, green: 0 })),
    votedRounds: {}
  });
}

async function nextStep() {
  if (state.currentIndex < statements.length - 1) {
    await update(gameRef, { currentIndex: state.currentIndex + 1 });
  } else {
    await update(gameRef, { phase: "results" });
  }
}

async function resetGame() {
  await set(gameRef, defaultState());
}

async function joinGame() {
  const input = $("participantName");
  const cleanName = (input.value || "").trim() || `Participant ${activeParticipants() + 1}`;
  const participantId = getParticipantId();

  await update(ref(db, `games/${GAME_ID}/participants/${participantId}`), {
    id: participantId,
    name: cleanName,
    active: true,
    joinedAt: Date.now()
  });

  input.value = cleanName;
  const notice = $("joinNotice");
  if (notice) {
    notice.textContent = `Joined as ${cleanName}. Waiting for the owner.`;
    notice.classList.remove("hidden");
  }
}

async function submitVote(flag) {
  if (state.phase !== "playing" || hasVoted()) return;

  const key = participantVoteKey();
  const roundRef = ref(db, `games/${GAME_ID}/votes/${state.currentIndex}/${flag}`);
  const voteKeyRef = ref(db, `games/${GAME_ID}/votedRounds/${key}`);

  await runTransaction(roundRef, (currentValue) => Number(currentValue || 0) + 1);
  await set(voteKeyRef, flag);
}

function statementCard() {
  return `
    <div class="statement">
      <div class="label">Statement</div>
      <h3>${statements[state.currentIndex]}</h3>
    </div>
  `;
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
    ${includeReset ? '<button class="primary-btn" id="resetBtn" type="button">↻ Reset game</button>' : ''}
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
      <button class="ghost-btn" id="nextBtn" type="button">${state.currentIndex === statements.length - 1 ? "Show final percentages" : "Next statement"} →</button>
    `;
    $("ownerPlaying").classList.remove("hidden");
    $("nextBtn").addEventListener("click", nextStep);
  }

  if (state.phase === "results") {
    $("ownerResults").innerHTML = resultsHtml(true);
    $("ownerResults").classList.remove("hidden");
    $("resetBtn").addEventListener("click", resetGame);
  }

  const participantLink = new URL("participant.html", window.location.href).href;
  if ($("participantLink")) $("participantLink").textContent = participantLink;
  updateOverview();
}

function renderParticipantPage() {
  ["participantWaiting", "participantPlaying", "participantResults"].forEach((id) => $(id).classList.add("hidden"));

  const participantId = getParticipantId();
  const participant = state.participants[participantId];
  if ($("participantName") && participant) $("participantName").value = participant.name;

  if (state.phase === "waiting") {
    $("participantWaiting").classList.remove("hidden");
  }

  if (state.phase === "playing") {
    const selected = state.votedRounds[participantVoteKey()];
    $("participantPlaying").innerHTML = `
      <div class="round-row"><span class="pill">Statement ${state.currentIndex + 1} of ${statements.length}</span></div>
      ${statementCard()}
      <div class="vote-grid">
        <button class="flag-btn red ${selected === "red" ? "selected-red" : ""}" ${hasVoted() ? "disabled" : ""} id="redVoteBtn" type="button">
          <div class="flag-icon">⚑</div><strong>Red Flag</strong><small>Choose this if the statement feels like a risk or warning sign.</small>
        </button>
        <button class="flag-btn green ${selected === "green" ? "selected-green" : ""}" ${hasVoted() ? "disabled" : ""} id="greenVoteBtn" type="button">
          <div class="flag-icon">⚑</div><strong>Green Flag</strong><small>Choose this if the statement feels like a healthy or positive signal.</small>
        </button>
      </div>
      ${hasVoted() ? '<div class="notice">Vote submitted. Waiting for the owner to move next.</div>' : ''}
    `;
    $("participantPlaying").classList.remove("hidden");
    if (!hasVoted()) {
      $("redVoteBtn").addEventListener("click", () => submitVote("red"));
      $("greenVoteBtn").addEventListener("click", () => submitVote("green"));
    }
  }

  if (state.phase === "results") {
    $("participantResults").innerHTML = resultsHtml(false);
    $("participantResults").classList.remove("hidden");
  }

  updateOverview();
}

function render() {
  const page = document.body.dataset.page;
  if (page === "owner") renderOwnerPage();
  if (page === "participant") renderParticipantPage();
}

function showConfigWarning() {
  const warning = document.createElement("div");
  warning.className = "config-warning";
  warning.innerHTML = "Firebase is not configured yet. Open <strong>firebase-config.js</strong> and paste your Firebase web app config first.";
  document.querySelector(".panel")?.prepend(warning);
}

async function init() {
  if (!isFirebaseConfigured()) {
    showConfigWarning();
    render();
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  gameRef = ref(db, `games/${GAME_ID}`);
  await ensureInitialGame();

  if (!unsubscribeStarted) {
    unsubscribeStarted = true;
    onValue(gameRef, (snapshot) => {
      state = normalizeState(snapshot.val());
      render();
    });
  }
}

window.startGame = startGame;
window.nextStep = nextStep;
window.resetGame = resetGame;
window.joinGame = joinGame;
window.submitVote = submitVote;

init();
