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

  recognition.onend = async () => {
    listening = false;
    micIcon.classList.remove("fa-stop");
    micIcon.classList.add("fa-microphone");
    voiceBtn.classList.remove("listening");
    voiceStatus.textContent = "Click to speak";
    console.log("Stopped listening");
    console.log("Transcript:", transcript);
    processQuery(transcript)      // api call to pegasus
    const res = await processVideoQuery(transcript);       // api call to merango
    if (res) {
        showClip(res); 
    } 
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


function showClip(timingData) {
    const responseArea = document.getElementById("responseArea");
    const responseText = document.querySelector('.response-text p');
    const videoPlaceholder = document.querySelector('.video-placeholder');
    
    // Update text
    responseText.innerHTML = `
        <p><strong>🎯 Found it!</strong> Here's the exact moment from your visit:</p>
        <p><small>${formatTime(timingData.start)} - ${formatTime(timingData.end)}</small></p>
    `;
    
    // Create vid player with start and end
    const startTime = timingData.start;
    const endTime = timingData.end;
    const duration = endTime - startTime;
    
    videoPlaceholder.innerHTML = `
        <video id="clipPlayer" controls style="width: 100%; max-width: 400px; border-radius: 10px;">
            <source src="https://storage.googleapis.com/hackrice-2025/68cecac9ca672ec899e15fe7.mp4" type="video/mp4">
        </video>
        <div style="text-align: center; margin-top: 0.5rem; color: #666;">
            <small>${formatDuration(duration)}</small>
            <br>
        </div>
    `;
    
    
    setupClipPlayer(timingData.video_id, startTime, endTime);
    
    responseArea.style.display = 'block';
    responseArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupClipPlayer(videoId, startTime, endTime) {       // Setting ts up
    const video = document.getElementById('clipPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    video.addEventListener('loadeddata', () => {
        video.currentTime = startTime;
        
        // Custom play/pause control
        playPauseBtn.onclick = () => {
            if (video.paused) {
                video.play();
                playPauseBtn.textContent = '⏸️ Pause';
            } else {
                video.pause();
                playPauseBtn.textContent = '▶️ Play';
            }
        };
        
        // Enforce time boundaries
        video.addEventListener('timeupdate', () => {
            if (video.currentTime >= endTime) {
                video.currentTime = startTime;
                video.pause();
                playPauseBtn.textContent = '▶️ Play';
            }
        });
        
        // Prevent seeking outside range
        video.addEventListener('seeking', () => {
            if (video.currentTime < startTime || video.currentTime > endTime) {
                video.currentTime = startTime;
            }
        });
    });
    
    video.src = `https://storage.googleapis.com/hackrice-2025/68cecac9ca672ec899e15fe7.mp4`;
}

// Helpers to format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    return `${Math.round(seconds)}s`;
}

function displayVideoResults(results) {
    // Display the video segments returned by Twelve Labs
    responseArea.style.display = 'block';
    responseArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const responseText = document.querySelector('.response-text p');
    responseText.textContent = results.answer || "Based on your question, here's what your doctor said during the visit.";

    // If there's a video segment, display it
    if (results.videoSegment) {
        const videoPlaceholder = document.querySelector('.video-placeholder');
        videoPlaceholder.innerHTML = `
            <video controls style="width: 100%; max-width: 400px; border-radius: 10px;">
                <source src="${results.videoSegment.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <p style="margin-top: 1rem;">Segment: ${results.videoSegment.startTime} - ${results.videoSegment.endTime}</p>
        `;
        videoPlaceholder.style.borderColor = 'var(--primary-matcha)';
        videoPlaceholder.style.background = 'rgba(136, 201, 153, 0.05)';
    }
}// DOM Elements
const moonToggle = document.getElementById('moonToggle');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    addScrollEffects();
    animateOnScroll();
});

function initializeEventListeners() {
    // Moon toggle (Dark mode redirect)
    moonToggle.addEventListener('click', function() {
        // Simulate redirect to dark mode/quiz page
        window.location.href = 'quiz.html?i='+(index || '')+'&v='+(video || '');
    });
}

// Scroll Effects
function addScrollEffects() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = 'var(--shadow)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Animate on Scroll
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements
    const animateElements = document.querySelectorAll('.feature-card, .floating-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Add CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .notification-content i {
        font-size: 1.25rem;
    }

    /* Enhanced hover effects */
    .feature-card:hover .feature-icon {
        transform: scale(1.1) rotate(5deg);
        transition: transform 0.3s ease;
    }

    .floating-card:hover {
        transform: translateY(-25px) scale(1.05);
        transition: all 0.3s ease;
    }

    /* Loading states */
    .loading {
        position: relative;
        overflow: hidden;
    }

    .loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
        animation: loading 1.5s infinite;
    }

    @keyframes loading {
        0% { left: -100%; }
        100% { left: 100%; }
    }

    /* Smooth focus states */
    button:focus,
    input:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(255, 181, 167, 0.3);
    }

    /* Enhanced voice button states */
    .voice-btn:active {
        transform: scale(0.95);
    }

    .voice-btn.processing {
        background: linear-gradient(135deg, var(--accent-matcha), var(--dark-matcha));
        animation: processing 2s ease-in-out infinite;
    }

    @keyframes processing {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

document.head.appendChild(animationStyles);

// Enhanced file processing with visual feedback
function enhanceFileProcessing() {
    const progressFill = document.querySelector('.progress-fill');
    let progress = 0;

    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) {
            progress = 100;
            clearInterval(progressInterval);
        }
        progressFill.style.width = progress + '%';
    }, 200);
}


// Add loading dots animation
const loadingDotsStyle = document.createElement('style');
loadingDotsStyle.textContent = `
    .loading-dots span {
        animation: loading-dots 1.4s infinite;
        animation-fill-mode: both;
    }

    .loading-dots span:nth-child(1) { animation-delay: 0s; }
    .loading-dots span:nth-child(2) { animation-delay: 0.16s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.32s; }

    @keyframes loading-dots {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
    }
`;

document.head.appendChild(loadingDotsStyle);

// Enhanced query processing with AI thinking simulation
function enhancedProcessQuery(query) {
    simulateAIThinking();

    setTimeout(() => {
        voiceBtn.classList.remove('processing');
        voiceStatus.textContent = 'Click to speak';
        //showResponse(query);
    }, 3000);
}

async function processQuery(query) {     // for pegasus
    try {
        const response = await fetch('http://localhost:5001/pegasus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                video_id: video
            })
        });
        
        const data = await response.json();
        console.log("Response:", data);
        
    } catch (error) {
        console.log("Error:", error);
    }
}

async function processVideoQuery(query) {    // for merango
    try {
        const response = await fetch('http://localhost:5001/merango', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
            })
        });
        
        const data = await response.json();
        console.log("Response:", data);
        return data;
        
    } catch (error) {
        console.log("Error:", error);
        return null;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Space bar to toggle voice recording
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleVoiceRecording();
    }

    // Escape to close modal
    if (e.key === 'Escape') {
        closeUploadModal();
    }
});

// Touch gestures for mobile
let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    // Swipe up gesture to activate voice
    if (diff > 100 && !isRecording) {
        const voiceSection = document.getElementById('voiceSection');
        const rect = voiceSection.getBoundingClientRect();

        if (rect.top < window.innerHeight && rect.bottom > 0) {
            toggleVoiceRecording();
        }
    }
});

// Initialize demo data
function initializeDemoData() {
    // Simulate having a pre-uploaded recording for demo purposes
    setTimeout(() => {
        if (!localStorage.getItem('hasSeenDemo')) {
            //ShowNotification('Demo mode: Recording already uploaded! Try asking a question.', 'info');
            localStorage.setItem('hasSeenDemo', 'true');
        }
    }, 2000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
});
