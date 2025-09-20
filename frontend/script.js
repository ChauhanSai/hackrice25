// Get current URL query parameters
const params = new URLSearchParams(window.location.search);

// Extract values
const index = params.get("i");   // "68cecab1c81f4a8a93031f29"
const video = params.get("v");   // "68cecac9ca672ec899e15fe7"

console.log("Index:", index);
console.log("Video:", video);

// In-browser voice to text
const voiceBtn = document.getElementById("voiceBtn");
const micIcon = document.getElementById("micIcon");
const voiceStatus = document.getElementById("voiceStatus");
const queryDisplay = document.getElementById("queryDisplay");

let recognition;
let listening = false;
let transcript = "";

// Browser support check
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
} else if ("SpeechRecognition" in window) {
  recognition = new SpeechRecognition();
} else {
  alert("Speech Recognition not supported in this browser. Try Chrome or Edge.");
}

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    queryDisplay.textContent = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    voiceStatus.textContent = "Error: " + event.error;
  };

  recognition.onend = () => {
    listening = false;
    micIcon.classList.remove("fa-stop");
    micIcon.classList.add("fa-microphone");
    voiceBtn.classList.remove("listening");
    voiceStatus.textContent = "Click to speak";
    console.log("Stopped listening");
    console.log("Transcript:", transcript);
  };

  voiceBtn.onclick = () => {
    if (!listening) {
      recognition.start();
      listening = true;
      micIcon.classList.remove("fa-microphone");
      micIcon.classList.add("fa-stop");
      voiceBtn.classList.add("listening");
      voiceStatus.textContent = "Listening...";
      queryDisplay.textContent = "Listening...";
      console.log("Listening...");
    } else {
      recognition.stop();
    }
  };
}