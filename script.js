"use strict";

const currentEl = document.getElementById("current");
const historyEl = document.getElementById("history");

const state = {
  current: "0",     // number being typed or shown (as a string)
  previous: null,   // left-hand operand (as a string)
  operator: null,   // "+", "−", "×", "÷"
  overwrite: false, // next digit replaces the display
  error: false,
};

function compute(a, b, op) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  switch (op) {
    case "+": return x + y;
    case "−": return x - y;
    case "×": return x * y;
    case "÷": return y === 0 ? NaN : x / y;
  }
  return y;
}

// Trim floating-point noise (0.1 + 0.2 -> 0.3)
function format(n) {
  if (!Number.isFinite(n)) return null;
  return String(parseFloat(n.toPrecision(12)));
}

function render() {
  const text = state.current;
  currentEl.textContent = text.length > 14 && !state.error ? Number(text).toExponential(6) : text;
  historyEl.textContent = state.operator && state.previous !== null
    ? `${state.previous} ${state.operator}`
    : "";
  document.querySelectorAll(".op").forEach((b) =>
    b.classList.toggle("active", b.dataset.op === state.operator && state.overwrite)
  );
}

function reset() {
  Object.assign(state, { current: "0", previous: null, operator: null, overwrite: false, error: false });
}

function inputDigit(d) {
  if (state.error) reset();
  if (state.overwrite || state.current === "0") {
    state.current = d;
    state.overwrite = false;
  } else if (state.current.replace(/[-.]/g, "").length < 15) {
    state.current += d;
  }
}

function inputDot() {
  if (state.error) reset();
  if (state.overwrite) {
    state.current = "0.";
    state.overwrite = false;
  } else if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function setError() {
  reset();
  state.current = "Can't divide by 0";
  state.error = true;
}

function chooseOperator(op) {
  if (state.error) return;
  // Chain operations: 2 + 3 × ... evaluates 2 + 3 first
  if (state.operator && !state.overwrite) {
    const result = format(compute(state.previous, state.current, state.operator));
    if (result === null) return setError();
    state.previous = result;
    state.current = result;
  } else {
    state.previous = state.current;
  }
  state.operator = op;
  state.overwrite = true;
}

function equals() {
  if (state.error || !state.operator) return;
  const result = format(compute(state.previous, state.current, state.operator));
  if (result === null) return setError();
  historyEl.textContent = `${state.previous} ${state.operator} ${state.current} =`;
  state.current = result;
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
}

function backspace() {
  if (state.error) return reset();
  if (state.overwrite) return;
  state.current = state.current.length > 1 && !(state.current.length === 2 && state.current[0] === "-")
    ? state.current.slice(0, -1)
    : "0";
}

function toggleSign() {
  if (state.error || state.current === "0") return;
  state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
}

function percent() {
  if (state.error) return;
  state.current = format(parseFloat(state.current) / 100) ?? state.current;
}

function handle(action) {
  switch (action) {
    case "clear": reset(); break;
    case "sign": toggleSign(); break;
    case "percent": percent(); break;
    case "back": backspace(); break;
    case "dot": inputDot(); break;
    case "equals": equals(); render(); return; // keep the "a + b =" history line
  }
  render();
}

// Mouse / touch
document.querySelector(".keys").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.num !== undefined) { inputDigit(btn.dataset.num); render(); }
  else if (btn.dataset.op) { chooseOperator(btn.dataset.op); render(); }
  else handle(btn.dataset.action);
});

// Keyboard
const keyOps = { "+": "+", "-": "−", "*": "×", "/": "÷" };
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)) { inputDigit(e.key); render(); }
  else if (keyOps[e.key]) { e.preventDefault(); chooseOperator(keyOps[e.key]); render(); }
  else if (e.key === "." || e.key === ",") { inputDot(); render(); }
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); handle("equals"); }
  else if (e.key === "Backspace") handle("back");
  else if (e.key === "Escape") handle("clear");
  else if (e.key === "%") handle("percent");
});

render();
