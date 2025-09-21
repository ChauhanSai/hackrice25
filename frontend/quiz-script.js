// Get current URL query parameters
const params = new URLSearchParams(window.location.search);

// Extract values
const index = params.get("i");   // "68cecab1c81f4a8a93031f29"
const video = params.get("v");   // "68cecac9ca672ec899e15fe7"

console.log("Index:", index);
console.log("Video:", video);

// Back to main page
const moonToggle = document.getElementById('moonToggle');
moonToggle.addEventListener('click', function() {
    // Simulate redirect to dark mode/quiz page
    window.location.href = 'index.html?i='+(index || '')+'&v='+(video || '');
});

// Get video transcription
const url1 = "http://127.0.0.1:5001/dark/transcript?v=" + video + "&i=" + index;
const url2 = "http://127.0.0.1:5001/dark/quiz?hsp=Family+Medical";

const headers = {
  "X-HSP-Header": "Family Medical",
  "Content-Type": "application/json"
};

let quizQuestions;

fetch(url1)
  .then(response => response.json())
  .then(data => {
    console.log("Transcript:", data);
    const transcript = data.transcript;

    // Quiz questions
    return fetch(url2, {
      method: "POST",
      headers,
      body: JSON.stringify({ transcription: transcript })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log("Quiz:", data);
    console.log(JSON.parse(data));
    console.log(JSON.parse(data)[0].quiz);
    quizQuestions = JSON.parse(data)[0].quiz; // use it here

    // Initialize quiz once we have the data
    initializeQuiz();
    setupEventListeners();
  })
  .catch(err => {
    console.error("Error:", err);
  });

// State Management
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let hintsUsed = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;

// DOM Elements
const loadingContentEl = document.getElementById('loadingContent');
const questionContentEl = document.getElementById('questionContent');
const progressFillEl = document.getElementById('progressFill');
const progressTextEl = document.getElementById('progressText');
const questionCardEl = document.getElementById('questionCard');
const questionTextEl = document.getElementById('questionText');
const optionsContainerEl = document.getElementById('optionsContainer');
const hintBtnEl = document.getElementById('hintBtn');
const nextBtnEl = document.getElementById('nextBtn');
const hintCardEl = document.getElementById('hintCard');
const resultsCardEl = document.getElementById('resultsCard');
const heart1El = document.getElementById('heart1');
const heart2El = document.getElementById('heart2');
const heart3El = document.getElementById('heart3');

let hearts = [heart1El, heart2El, heart3El];

function initializeQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    hintsUsed = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    updateUI();
    loadQuestion();
}

function setupEventListeners() {
    hintBtnEl.addEventListener('click', showHint);
    nextBtnEl.addEventListener('click', nextQuestion);
    
    // Add keyboard support
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (e.key >= '1' && e.key <= '4') {
        const optionIndex = parseInt(e.key) - 1;
        selectOption(optionIndex);
    } else if (e.key === 'Enter' && !nextBtnEl.disabled) {
        nextQuestion();
    } else if (e.key === 'h' || e.key === 'H') {
        showHint();
    }
}

function updateUI() {
    loadingContentEl.style.display = 'none';
    questionContentEl.style.display = 'block';
    
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;
    progressFillEl.style.width = progress + '%';
    progressTextEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
}

function loadQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    
    // Reset state
    selectedAnswer = null;
    nextBtnEl.disabled = true;
    hintCardEl.style.display = 'none';
    
    // Update question text
    questionTextEl.textContent = question.question;
    
    // Clear and populate options
    optionsContainerEl.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionEl = createOptionElement(option, index);
        optionsContainerEl.appendChild(optionEl);
    });
    
    // Update hint button
    hintBtnEl.style.display = 'flex';
    hintBtnEl.disabled = false;
    
    // Animate in
    questionCardEl.style.animation = 'none';
    setTimeout(() => {
        questionCardEl.style.animation = 'fadeIn 0.5s ease-out';
    }, 10);
}

function createOptionElement(text, index) {
    const optionEl = document.createElement('button');
    optionEl.className = 'option-btn';
    optionEl.setAttribute('data-answer', index);
    
    optionEl.innerHTML = `
        <span class="option-letter">${String.fromCharCode(65 + index)}</span>
        <span class="option-text">${text}</span>
    `;
    
    optionEl.addEventListener('click', () => selectOption(index));
    
    return optionEl;
}

function selectOption(index) {
    // Remove previous selections
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select current option
    const selectedBtn = document.querySelector(`[data-answer="${index}"]`);
    selectedBtn.classList.add('selected');
    console.log(index);
    
    selectedAnswer = index;
    nextBtnEl.disabled = false;
    
    // Add ripple effect
    addRippleEffect(selectedBtn);
}

function addRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(136, 201, 153, 0.3);
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: 100px;
        height: 100px;
        left: 50%;
        top: 50%;
        margin-left: -50px;
        margin-top: -50px;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

async function showHint() {
    const question = quizQuestions[currentQuestionIndex];

    // Use the question text as the query
    const query = question.question;
    console.log("Sending query to Merango:", query);

    // Call your backend to get timing data (start/end, video_id, etc.)
    const timingData = await processVideoQuery(query);

    if (!timingData) {
        console.error("No timing data returned for query:", query);
        return;
    }

    // Now reuse showClip to populate response area
    showClip(timingData);

    // Track hints used
    hintsUsed++;

    // Disable hint button
    hintBtnEl.disabled = true;
    hintBtnEl.style.opacity = '0.5';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    return `${Math.round(seconds)}s`;
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

function showClip(timingData) {
    const responseArea = document.getElementById("hintCard");
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

function nextQuestion() {
    if (selectedAnswer === null) return;
    
    const question = quizQuestions[currentQuestionIndex];
    console.log(selectedAnswer);
    console.log(question.options[selectedAnswer]);
    console.log(question.correct);
    const isCorrect = question.options[selectedAnswer] === question.correct;

    // Show correct/incorrect states
    showAnswerFeedback(isCorrect);

    // Update score and stats
    if (isCorrect) {
        score++;
        correctAnswers++;
    } else {
        incorrectAnswers++;
        // Remove a heart
        if(hearts.length > 0) {
            removeHeart = hearts.pop();
            removeHeart.style.filter = "opacity(25%)";  // 50% brightness
        } else {
            // No hearts left, end quiz early
            alert('You have no hearts left! The quiz will end now.');
        }
    }

    const responseArea = document.getElementById("hintCard");
    responseArea.style.display = 'none';

    // Save progress
    saveProgress();

    // Wait for feedback animation, then proceed
    setTimeout(() => {
        currentQuestionIndex++;

        if (currentQuestionIndex < quizQuestions.length) {
            updateUI();
            loadQuestion();
            saveProgress();
        } else {
            showResults();
            localStorage.removeItem('quizProgress'); // Clear saved progress
        }
    }, 2000);
}

function showAnswerFeedback(isCorrect) {
    const question = quizQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');
    
    // Disable all options
    options.forEach((btn, index) => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Disable buttons
    nextBtnEl.disabled = true;
    hintBtnEl.style.display = 'none';
    
    // Show feedback message
    const feedbackEl = document.createElement('div');
    feedbackEl.className = `feedback-message ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
        <i class="fas fa-${isCorrect ? 'check-circle' : 'times-circle'}"></i>
        <span>${isCorrect ? 'Correct!' : 'Incorrect. The correct answer is highlighted.'}</span>
    `;
    
    feedbackEl.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 10px;
        background: ${isCorrect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        color: ${isCorrect ? 'var(--success)' : 'var(--error)'};
        border: 1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'};
        animation: fadeIn 0.5s ease-out;
    `;
    
    questionCardEl.appendChild(feedbackEl);
    
    // Update next button
    setTimeout(() => {
        nextBtnEl.disabled = false;
        nextBtnEl.innerHTML = currentQuestionIndex === quizQuestions.length - 1 
            ? '<i class="fas fa-trophy"></i> View Results'
            : 'Next Question <i class="fas fa-arrow-right"></i>';
    }, 1000);
}

function showResults() {
    // Hide question card
    questionCardEl.style.display = 'none';
    hintCardEl.style.display = 'none';
    
    // Update results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('incorrectCount').textContent = incorrectAnswers;
    document.getElementById('hintsUsed').textContent = hintsUsed;
    
    // Update score message
    const percentage = (score / quizQuestions.length) * 100;
    const messageEl = document.getElementById('scoreMessage');
    
    if (percentage >= 80) {
        messageEl.textContent = 'Excellent memory! You retained most of the important information.';
        messageEl.style.color = 'var(--success)';
    } else if (percentage >= 60) {
        messageEl.textContent = 'Good job! You remembered the key details well.';
        messageEl.style.color = 'var(--primary-matcha)';
    } else {
        messageEl.textContent = 'Keep practicing! Regular review will help improve your recall.';
        messageEl.style.color = 'var(--warning)';
    }
    
    // Show results card
    resultsCardEl.style.display = 'block';
    resultsCardEl.style.animation = 'fadeIn 0.5s ease-out';
    
    // Update final progress
    progressFillEl.style.width = '100%';
    progressTextEl.textContent = 'Quiz Complete!';
    
    // Scroll to results
    resultsCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Confetti effect for high scores
    if (percentage >= 80) {
        setTimeout(createConfetti, 500);
    }
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${['var(--primary-matcha)', 'var(--secondary-matcha)', 'var(--light-matcha)'][Math.floor(Math.random() * 3)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            z-index: 10000;
            pointer-events: none;
            animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

function restartQuiz() {
    // Reset display
    questionCardEl.style.display = 'block';
    resultsCardEl.style.display = 'none';
    
    // Reinitialize
    initializeQuiz();
}

// Add confetti animation
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

document.head.appendChild(confettiStyle);

// Touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Swipe left to go to next question
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 100 && !nextBtnEl.disabled) {
        nextQuestion();
    }
    
    // Swipe down to show hint
    if (Math.abs(diffY) > Math.abs(diffX) && diffY < -100 && !hintBtnEl.disabled) {
        showHint();
    }
});

// Auto-save progress
function saveProgress() {
    const progress = {
        currentQuestionIndex,
        score,
        hintsUsed,
        correctAnswers,
        incorrectAnswers
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        if (progress.currentQuestionIndex < quizQuestions.length) {
            // Ask user if they want to continue
            if (confirm('You have an unfinished quiz. Would you like to continue from where you left off?')) {
                currentQuestionIndex = progress.currentQuestionIndex;
                score = progress.score;
                hintsUsed = progress.hintsUsed;
                correctAnswers = progress.correctAnswers;
                incorrectAnswers = progress.incorrectAnswers;
                updateUI();
                loadQuestion();
                return true;
            }
        }
    }
    return false;
}

// Load progress on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!loadProgress()) {
        initializeQuiz();
    }
});