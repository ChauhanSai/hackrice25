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
let heartsRemaining = 3;

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

// Modal elements
const answerModalEl = document.getElementById('answerModal');
const modalIconEl = document.getElementById('modalIcon');
const modalTitleEl = document.getElementById('modalTitle');
const modalMessageEl = document.getElementById('modalMessage');
const modalBtnEl = document.getElementById('modalBtn');

let hearts = [heart1El, heart2El, heart3El];

function initializeQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    hintsUsed = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    heartsRemaining = 3;
    
    // Reset hearts
    hearts.forEach(heart => {
        heart.classList.remove('lost');
        heart.style.filter = '';
    });
    
    // Disable hint button initially until quiz loads
    hintBtnEl.disabled = true;
    hintBtnEl.style.opacity = '0.5';
    hintBtnEl.innerHTML = '<i class="fas fa-lightbulb"></i> Loading...';
    
    updateUI();
    loadQuestion();
}

function setupEventListeners() {
    hintBtnEl.addEventListener('click', showHint);
    nextBtnEl.addEventListener('click', nextQuestion);
    modalBtnEl.addEventListener('click', closeModal);
    
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
    
    // Reset hint button - always visible, only disable if already used for this question
    hintBtnEl.style.display = 'flex';
    // Only reset hint button if we're loading a new question (not if it was already disabled)
    if (!hintBtnEl.hasAttribute('data-used-for-question') || 
        hintBtnEl.getAttribute('data-used-for-question') != currentQuestionIndex) {
        hintBtnEl.disabled = false;
        hintBtnEl.style.opacity = '1';
        hintBtnEl.removeAttribute('data-used-for-question');
    }
    
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
    // Prevent multiple clicks while loading
    if (hintBtnEl.disabled) return;
    
    // Immediately disable the button to prevent multiple clicks
    hintBtnEl.disabled = true;
    hintBtnEl.style.opacity = '0.5';
    hintBtnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    const question = quizQuestions[currentQuestionIndex];

    // Use the question text as the query
    const query = question.question;
    console.log("Sending query to Merango:", query);

    try {
        // Call your backend to get timing data (start/end, video_id, etc.)
        const timingData = await processVideoQuery(query);

        if (!timingData) {
            console.error("No timing data returned for query:", query);
            // Reset button if error occurs
            hintBtnEl.innerHTML = '<i class="fas fa-lightbulb"></i> Get Hint';
            hintBtnEl.disabled = false;
            hintBtnEl.style.opacity = '1';
            return;
        }

        // Now reuse showClip to populate response area
        showClip(timingData);

        // Track hints used
        hintsUsed++;

        // Keep button disabled and mark as used for this question
        hintBtnEl.innerHTML = '<i class="fas fa-lightbulb"></i> Hint Used';
        hintBtnEl.setAttribute('data-used-for-question', currentQuestionIndex);
        
    } catch (error) {
        console.error("Error loading hint:", error);
        // Reset button if error occurs
        hintBtnEl.innerHTML = '<i class="fas fa-lightbulb"></i> Get Hint';
        hintBtnEl.disabled = false;
        hintBtnEl.style.opacity = '1';
    }
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

function showModal(isCorrect) {
    const modalOverlay = document.getElementById('answerModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    if (isCorrect) {
        modalIcon.className = 'modal-icon correct fas fa-check-circle';
        modalTitle.textContent = 'You got it correct!';
        modalMessage.textContent = 'Great job! Your memory is serving you well.';
    } else {
        modalIcon.className = 'modal-icon incorrect fas fa-times-circle';
        modalTitle.textContent = 'You got it wrong';
        modalMessage.textContent = 'Try using the hint to refresh your memory!';
    }
    
    modalOverlay.classList.add('show');
}

function closeModal() {
    const modalOverlay = document.getElementById('answerModal');
    modalOverlay.classList.remove('show');
    
    // Continue with the next question or show results
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
    }, 300);
}

function nextQuestion() {
    if (selectedAnswer === null) return;
    
    const question = quizQuestions[currentQuestionIndex];
    console.log(selectedAnswer);
    console.log(question.options[selectedAnswer]);
    console.log(question.correct);
    
    // Find the index of the correct answer
    const correctIndex = question.options.findIndex(option => option === question.correct);
    const isCorrect = selectedAnswer === correctIndex;

    // Show correct/incorrect states
    showAnswerFeedback(isCorrect);

    // Update score and stats
    if (isCorrect) {
        score++;
        correctAnswers++;
    } else {
        incorrectAnswers++;
        // Remove a heart
        if (heartsRemaining > 0) {
            heartsRemaining--;
            const heartToRemove = hearts[heartsRemaining];
            heartToRemove.style.filter = "opacity(25%)";
        } else {
            // No hearts left, end quiz early
            alert('You have no hearts left! The quiz will end now.');
        }
    }

    // Hide hint card
    const responseArea = document.getElementById("hintCard");
    responseArea.style.display = 'none';

    // Save progress
    saveProgress();

    // Show modal after a brief delay to see the answer feedback
    setTimeout(() => {
        showModal(isCorrect);
    }, 1500);
}

function showAnswerFeedback(isCorrect) {
    const question = quizQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');
    const correctIndex = question.options.findIndex(option => option === question.correct);
    
    // Disable all options
    options.forEach((btn, index) => {
        btn.classList.add('disabled');
        btn.style.pointerEvents = 'none';
        
        if (index === correctIndex) {
            btn.classList.add('correct');
        } else if (index === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Keep both buttons visible but disable next button temporarily
    nextBtnEl.disabled = true;
    // Don't hide hint button, just keep it in its state (enabled/disabled)
}

function showResults() {
    // Hide question card
    questionCardEl.style.display = 'none';
    hintCardEl.style.display = 'none';
    
    // Update results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('heartsRemaining').textContent = heartsRemaining;
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
        incorrectAnswers,
        heartsRemaining
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
                heartsRemaining = progress.heartsRemaining || 3;
                
                // Update hearts display
                for (let i = heartsRemaining; i < 3; i++) {
                    hearts[i].style.filter = "opacity(25%)";
                }
                
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
