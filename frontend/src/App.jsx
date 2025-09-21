import React, { useState } from "react";
import "./App.css";

function App() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);

  let recognition;

  if ("webkitSpeechRecognition" in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
  }

  const handleStart = () => {
    setTranscript("");
    setResult(null);
    setListening(true);
    recognition.start();
  };

  const handleStop = async () => {
    setListening(false);
    recognition.stop();

    if (transcript) {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();
      setResult(data);
    }
  };

  return (
    <div className="container">
      <h1>🎙️ MediVoice</h1>
      <p>Your AI-powered health assistant</p>

      <div className="button-group">
        <button onClick={handleStart} disabled={listening} className="btn start">
          Start Listening 🎤
        </button>
        <button onClick={handleStop} disabled={!listening} className="btn stop">
          Stop ⏹️
        </button>
      </div>

      <p className="transcript"><b>Transcript:</b> {transcript}</p>

      {result && result.message && (
        <p className="warning">{result.message}</p>
      )}

      {result && !result.message && (
        <div className="result-box">
          <h3>🩺 Possible Conditions:</h3>
          <ul>{result.conditions.map((c, i) => <li key={i}>{c}</li>)}</ul>

          <h3>💊 Medicines:</h3>
          <ul>{result.medicines.map((m, i) => <li key={i}>{m}</li>)}</ul>

          <h3>🌿 Organic Remedies:</h3>
          <ul>{result.organic.map((o, i) => <li key={i}>{o}</li>)}</ul>

          <h3>🥗 Food Suggestions:</h3>
          <ul>{result.food.map((f, i) => <li key={i}>{f}</li>)}</ul>

          <h3>👨‍⚕️ Doctor Suggestion:</h3>
          <p>{result.doctor}</p>
        </div>
      )}
    </div>
  );
}

export default App;
