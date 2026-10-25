const DOMAIN = "ashokacollege.in";            // change this one line for another college
const LOCAL = /[A-Za-z0-9._-]/;               // characters allowed in the name part
const ACCEPT = "q" + (DOMAIN.length + 2);     // q18 for ashokacollege.in
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

/* ================= VOICE ================= */
const Voice = { last: "" };
const canSpeak = "speechSynthesis" in window;

function loadVoices() {
  if (!canSpeak) return;
  const list = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  if (!list.length) return;
  const sel = $("voiceSel"), keep = sel.value;
  sel.replaceChildren(...list.map(v => new Option(`${v.name} (${v.lang})`, v.name)));
  const pref = list.find(v => /heera|neerja|zira|samantha|victoria|tessa|karen|female|google us english/i.test(v.name)) || list[0];
  sel.value = list.some(v => v.name === keep) ? keep : pref.name;
}

function speak(text) {
  Voice.last = text;
  $("replayBtn").disabled = false;
  if (!canSpeak || !$("voiceOn").checked) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = speechSynthesis.getVoices().find(x => x.name === $("voiceSel").value);
  if (v) u.voice = v;
  u.rate = parseFloat($("rate").value);
  speechSynthesis.speak(u);
}

// make symbols readable for the voice
const sayable = s => s.replace(/@/g, " at ").replace(/\./g, " dot ").replace(/_/g, " underscore ").replace(/-/g, " dash ");

/* ================= EMAIL DFA ================= */
function stepEmail(state, ch) {
  if (state === "qTRAP") return "qTRAP";
  const n = +state.slice(1);
  if (n === 0) return LOCAL.test(ch) ? "q1" : "qTRAP";
  if (n === 1) return LOCAL.test(ch) ? "q1" : ch === "@" ? "q2" : "qTRAP";
  if (n >= 2 && n < DOMAIN.length + 2) return ch.toLowerCase() === DOMAIN[n - 2] ? "q" + (n + 1) : "qTRAP";
  return "qTRAP"; // accepting state: any extra character is rejected
}

function emailReason(state, ch) {
  const n = +state.slice(1);
  if (n === 0) return ch === "@" ? "there must be a name before the @ symbol" : `"${ch}" cannot start an email address`;
  if (n === 1) return `"${ch}" is not allowed in the name part`;
  if (n < DOMAIN.length + 2) return `expected "${DOMAIN[n - 2]}" but found "${ch}" while matching ${DOMAIN}`;
  return `there are extra characters after ${DOMAIN}`;
}

function runEmail(input) {
  let state = "q0", reason = "";
  const steps = [];
  for (const ch of input) {
    const next = stepEmail(state, ch);
    steps.push({ ch, label: next });
    if (next === "qTRAP") { reason = emailReason(state, ch); break; }
    state = next;
  }
  const accepted = state === ACCEPT;
  if (!accepted && !reason) {
    const n = +state.slice(1);
    reason = !input ? "nothing was entered"
      : n === 1 ? "the @ symbol is missing"
      : n === 0 ? "the address is empty"
      : `the domain is incomplete, ${DOMAIN.length + 2 - n} more characters needed`;
  }
  return { accepted, reason, steps };
}

/* ================= PASSWORD DFA ================= */
const RULES = { upper: /[A-Z]/, lower: /[a-z]/, digit: /[0-9]/, symbol: /[^A-Za-z0-9]/ };
const BIT = ["upper", "lower", "digit", "symbol"];
const pLabel = s => "q" + s.bits.join("") + "," + s.len;

function runPassword(input) {
  let s = { bits: [0, 0, 0, 0], len: 0 };
  const steps = [];
  for (const ch of input) {
    const bits = s.bits.slice();
    const k = BIT.findIndex(r => RULES[r].test(ch));
    bits[k] = 1;
    s = { bits, len: Math.min(s.len + 1, 8) };
    steps.push({ ch, label: pLabel(s) });
  }
  const missing = [];
  if (s.len < 8) missing.push("at least 8 characters");
  if (!s.bits[0]) missing.push("an uppercase letter");
  if (!s.bits[1]) missing.push("a lowercase letter");
  if (!s.bits[2]) missing.push("a digit");
  if (!s.bits[3]) missing.push("a symbol");
  return { accepted: !missing.length, missing, steps, final: pLabel(s) };
}

/* ================= RENDERING ================= */
function drawPath(box, steps, startLabel, accepted) {
  const wrap = el("div", "path");
  box.append(wrap);
  const nodes = [{ ch: "start", label: startLabel }, ...steps];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gap = calm ? 0 : Math.min(110, 1600 / nodes.length);
  nodes.forEach((n, i) => setTimeout(() => {
    const last = i === nodes.length - 1;
    const chip = el("span", "state" + (n.label === "qTRAP" ? " trap" : last && accepted ? " hit" : ""));
    chip.append(el("i", "", n.ch === " " ? "space" : n.ch), n.label);
    if (i) wrap.append(el("span", "arrow", "→"));
    wrap.append(chip);
  }, i * gap));
}

function show(box, accepted, headline, reason, steps, startLabel) {
  box.className = "result " + (accepted ? "accept" : "reject");
  box.style.display = "block";
  box.replaceChildren(el("div", "verdict", headline));
  if (reason) box.append(el("div", "reason", reason));
  drawPath(box, steps, startLabel, accepted);
}

/* ================= EVENTS ================= */
$("emailForm").addEventListener("submit", e => {
  e.preventDefault();
  const value = $("email").value.trim();
  const r = runEmail(value);
  $("email").style.borderColor = r.accepted ? "var(--ok)" : "var(--bad)";
  show($("emailResult"), r.accepted,
    r.accepted ? `✔ Accepted. Reached final state ${ACCEPT}. Valid ${DOMAIN} address.` : "✘ Rejected.",
    r.accepted ? "" : "Reason: " + r.reason + ".", r.steps, "q0");
  speak(r.accepted
    ? `Email is valid. It reached the accepting state ${ACCEPT}, matching ${sayable(DOMAIN)}.`
    : `Email is invalid. ${sayable(r.reason)}.`);
});

$("passForm").addEventListener("submit", e => {
  e.preventDefault();
  const r = runPassword($("pass").value);
  $("pass").style.borderColor = r.accepted ? "var(--ok)" : "var(--bad)";
  show($("passResult"), r.accepted,
    r.accepted ? `✔ Accepted. Reached final state ${r.final}. Strong password.` : `✘ Rejected. Current state ${r.final}.`,
    r.accepted ? "" : "Still missing: " + r.missing.join(", ") + ".", r.steps, "q0000,0");
  speak(r.accepted
    ? "Password is strong. It reached the accepting state."
    : "Password is weak. Please add " + r.missing.join(", ") + ".");
});

// live checklist and strength meter
$("pass").addEventListener("input", () => {
  const p = $("pass").value;
  const ok = { len: p.length >= 8, ...Object.fromEntries(BIT.map(k => [k, RULES[k].test(p)])) };
  document.querySelectorAll("#checks li").forEach(li => li.classList.toggle("ok", ok[li.dataset.k]));
  const score = Object.values(ok).filter(Boolean).length;
  const bar = $("meterBar");
  bar.style.width = score * 20 + "%";
  bar.style.background = score < 3 ? "var(--bad)" : score < 5 ? "var(--gold)" : "var(--ok)";
});

$("eye").addEventListener("click", () => {
  const show = $("pass").type === "password";
  $("pass").type = show ? "text" : "password";
  $("eye").textContent = show ? "Hide" : "Show";
  $("eye").setAttribute("aria-label", show ? "Hide password" : "Show password");
});

$("rate").addEventListener("input", () => $("rateVal").textContent = parseFloat($("rate").value).toFixed(1) + "x");
$("testBtn").addEventListener("click", () => speak("Hello! This is how I will read your validation results."));
$("replayBtn").addEventListener("click", () => Voice.last && speak(Voice.last));
$("voiceOn").addEventListener("change", () => { if (!$("voiceOn").checked && canSpeak) speechSynthesis.cancel(); });

if (canSpeak) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
else { $("voiceNote").textContent = "Your browser does not support voice output. Try Chrome or Edge."; document.querySelectorAll("#voiceCard input, #voiceCard select, #voiceCard button").forEach(x => x.disabled = true); }