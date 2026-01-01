const timeDisplay = document.getElementById("timeDisplay");
const modeLabel = document.getElementById("modeLabel");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const progressRing = document.querySelector(".timer__progress");
const dial = document.getElementById("dial");
const hourHand = document.getElementById("hourHand");
const minuteHand = document.getElementById("minuteHand");
const secondHand = document.getElementById("secondHand");
const modeButtons = document.querySelectorAll("[data-mode]");
const presetButtons = document.querySelectorAll("[data-preset]");
const timerPresets = document.getElementById("timerPresets");

const TIMER_PRESETS = [300, 600, 900];
const DEFAULT_TIMER_SECONDS = TIMER_PRESETS[0];

let mode = "stopwatch";
let status = "Ready";
let timerId = null;

let elapsedSeconds = 0;
let totalSeconds = DEFAULT_TIMER_SECONDS;
let remainingSeconds = DEFAULT_TIMER_SECONDS;

const RING_CIRCUMFERENCE = 2 * Math.PI * 98;
progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE}px`;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function setModeLabel() {
  const modeText = mode === "stopwatch" ? "Stopwatch" : "Timer";
  modeLabel.textContent = `${modeText} · ${status}`;
}

function updateRing() {
  let progress = 0;
  if (mode === "stopwatch") {
    progress = (elapsedSeconds % 60) / 60;
  } else if (totalSeconds > 0) {
    progress = remainingSeconds / totalSeconds;
  }
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = `${offset}px`;
}

function updateDisplay() {
  const displaySeconds = mode === "stopwatch" ? elapsedSeconds : remainingSeconds;
  timeDisplay.textContent = formatTime(displaySeconds);
  updateHands(displaySeconds);
  updateRing();
  setModeLabel();
}

function updateHands(displaySeconds) {
  const hours = Math.floor(displaySeconds / 3600) % 12;
  const minutes = Math.floor(displaySeconds / 60) % 60;
  const seconds = displaySeconds % 60;
  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  hourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
  minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
  secondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
}

function buildDial() {
  if (!dial) return;
  dial.innerHTML = "";
  const svgNS = "http://www.w3.org/2000/svg";
  const center = 120;
  const majorOuter = 94;
  const majorInner = 84;
  const minorOuter = 94;
  const minorInner = 88;
  const labelRadius = 70;

  for (let i = 0; i < 60; i += 1) {
    const angle = (i * 6) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const isMajor = i % 5 === 0;

    const x1 = center + (isMajor ? majorInner : minorInner) * cos;
    const y1 = center + (isMajor ? majorInner : minorInner) * sin;
    const x2 = center + (isMajor ? majorOuter : minorOuter) * cos;
    const y2 = center + (isMajor ? majorOuter : minorOuter) * sin;

    const tick = document.createElementNS(svgNS, "line");
    tick.setAttribute("x1", x1.toFixed(2));
    tick.setAttribute("y1", y1.toFixed(2));
    tick.setAttribute("x2", x2.toFixed(2));
    tick.setAttribute("y2", y2.toFixed(2));
    tick.setAttribute("class", `dial__tick${isMajor ? "" : " dial__tick--minor"}`);
    dial.appendChild(tick);

    if (isMajor) {
      const labelValue = i === 0 ? 0 : i;
      const lx = center + labelRadius * cos;
      const ly = center + labelRadius * sin + 3;
      const label = document.createElementNS(svgNS, "text");
      label.textContent = String(labelValue).padStart(2, "0");
      label.setAttribute("x", lx.toFixed(2));
      label.setAttribute("y", ly.toFixed(2));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "dial__label");
      dial.appendChild(label);
    }
  }
}

function setButtonsRunning(isRunning) {
  startPauseBtn.textContent = isRunning ? "Pause" : "Start";
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  setButtonsRunning(false);
}

function tick() {
  if (mode === "stopwatch") {
    elapsedSeconds += 1;
    updateDisplay();
    return;
  }

  remainingSeconds -= 1;
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    status = "Done";
    stopTimer();
  }
  updateDisplay();
}

function startTimer() {
  if (timerId) return;
  if (mode === "timer" && remainingSeconds <= 0) {
    remainingSeconds = totalSeconds;
  }
  status = "Running";
  setButtonsRunning(true);
  updateDisplay();
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  stopTimer();
  status = "Ready";
  if (mode === "stopwatch") {
    elapsedSeconds = 0;
  } else {
    remainingSeconds = totalSeconds;
  }
  updateDisplay();
}

function setMode(newMode) {
  if (mode === newMode) return;
  stopTimer();
  mode = newMode;
  status = "Ready";

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === newMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  if (mode === "stopwatch") {
    elapsedSeconds = 0;
    timerPresets.classList.add("is-hidden");
  } else {
    totalSeconds = totalSeconds || DEFAULT_TIMER_SECONDS;
    remainingSeconds = totalSeconds;
    timerPresets.classList.remove("is-hidden");
  }

  updateDisplay();
}

function setPreset(seconds) {
  if (Number.isNaN(seconds) || seconds <= 0) return;
  totalSeconds = seconds;
  remainingSeconds = seconds;
  status = "Ready";
  updateDisplay();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const seconds = Number(button.dataset.preset || 0);
    setPreset(seconds);
  });
});

startPauseBtn.addEventListener("click", () => {
  if (timerId) {
    stopTimer();
    status = "Paused";
    updateDisplay();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener("click", resetTimer);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    startPauseBtn.click();
  }
  if (event.key.toLowerCase() === "r") {
    resetTimer();
  }
});

timerPresets.classList.add("is-hidden");
buildDial();
updateDisplay();
