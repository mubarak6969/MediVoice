// frontend/app.js
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcriptEl = document.getElementById("transcript");
const resultEl = document.getElementById("result");

let recognition;
let listening = false;

// clean transcript: remove common filler phrases before sending
function cleanTranscript(text) {
  if (!text) return "";
  text = text.toLowerCase();
  text = text.replace(/[^a-z0-9\s]/gi, " ");
  // remove common phrases
  text = text.replace(/\b(i have|i've got|i have got|i am having|i'm having|i've been|i have been|i feel|i'm|i am|there is|there's|my|please|kind of|kinda)\b/g, " ");
  text = text.replace(/\b(pain in|pain on|in my|on my|since|for|and|with|but|also)\b/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// Setup speech recognition
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    transcriptEl.textContent = "... listening ...";
  };

  recognition.onresult = (event) => {
    const text = Array.from(event.results).map(r => r[0].transcript).join(" ");
    transcriptEl.textContent = text;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    listening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    transcriptEl.textContent = "";
    resultEl.innerHTML = `<p style="color:red">Speech recognition error: ${event.error}</p>`;
  };

  recognition.onend = () => {
    listening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    const raw = transcriptEl.textContent || "";
    const cleaned = cleanTranscript(raw);
    if (cleaned) {
      sendToBackend(cleaned);
    } else {
      resultEl.innerHTML = `<p style="color:#666">No usable words detected. Try saying "I have fever" or "stomach pain".</p>`;
    }
  };
} else {
  startBtn.disabled = true;
  stopBtn.disabled = true;
  resultEl.innerHTML = `<p style="color:orange">Your browser doesn't support Speech Recognition. Use Chrome or Edge.</p>`;
}

startBtn.addEventListener("click", () => {
  transcriptEl.textContent = "";
  resultEl.innerHTML = "";
  try {
    recognition.start();
  } catch (e) {
    // sometimes start() raises if already started; ignore
    console.warn(e);
  }
});

stopBtn.addEventListener("click", () => {
  if (recognition && listening) {
    recognition.stop();
  }
});

async function sendToBackend(symptomsText) {
  resultEl.innerHTML = "<p>Analyzing...</p>";
  try {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: symptomsText })
    });

    const data = await res.json();

    if (!res.ok) {
      resultEl.innerHTML = `<p style="color:red">Error: ${data.detail || data.message || "Backend error"}</p>`;
      return;
    }

    if (data.success === false) {
      resultEl.innerHTML = `<p style="color:#cc0000">${data.message || "No match found."}</p>`;
      return;
    }

    const cond = (Array.isArray(data.conditions) && data.conditions.length) ? data.conditions.join(", ") : "Not available";
    const meds = (Array.isArray(data.medicines) && data.medicines.length) ? data.medicines.join(", ") : "Not available";
    const organic = (Array.isArray(data.organic_remedies) && data.organic_remedies.length) ? data.organic_remedies.join(", ") : "Not available";
    const foods = (Array.isArray(data.food_suggestions) && data.food_suggestions.length) ? data.food_suggestions.join(", ") : "Not available";
    const doctor = data.doctor_suggestion || "Consult a healthcare professional if symptoms worsen.";

    resultEl.innerHTML = `
      <div class="card"><h3>🩺 Possible Conditions</h3><p>${cond}</p></div>
      <div class="card"><h3>💊 Medicines</h3><p>${meds}</p></div>
      <div class="card"><h3>🌿 Organic Remedies</h3><p>${organic}</p></div>
      <div class="card"><h3>🥗 Food Suggestions</h3><p>${foods}</p></div>
      <div class="card"><h3>👨‍⚕️ Doctor Suggestion</h3><p>${doctor}</p></div>
    `;
  } catch (err) {
    console.error(err);
    resultEl.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
  }
}
