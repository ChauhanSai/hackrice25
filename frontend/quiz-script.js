// Quiz Data
const quizQuestions = [
    {
        question: "What medication did your doctor prescribe for your blood pressure?",
        options: [
            "Lisinopril 10mg",
            "Metformin 500mg", 
            "Aspirin 81mg",
            "Atorvastatin 20mg"
        ],
        correct: 0,
        hint: "Your doctor mentioned this medication helps with cardiovascular health and starts with 'L'.",
        videoSegment: "Video segment from 12:30 - 'I'm prescribing Lisinopril for your blood pressure...'"
    },
    {
        question: "How often should you take your prescribed medication?",
        options: [
            "Once daily in the morning",
            "Twice daily with meals",
            "Three times daily",
            "Only when symptoms occur"
        ],
        correct: 1,
        hint: "Your doctor emphasized taking it with food to avoid stomach upset.",
        videoSegment: "Video segment from 15:45 - 'Take this twice daily with your meals...'"
    },
    {
        question: "When is your follow-up appointment scheduled?",
        options: [
            "In 1 week",
            "In 2 weeks", 
            "In 1 month",
            "In 3 months"
        ],
        correct: 1,
        hint: "Your doctor wanted to check your progress relatively soon, but not immediately.",
        videoSegment: "Video segment from 22:10 - 'Let's schedule a follow-up in two weeks...'"
    },
    {
        question: "What dietary changes did your doctor recommend?",
        options: [
            "Increase protein intake",
            "Reduce sodium and processed foods",
            "Eliminate all carbohydrates", 
            "Only eat organic foods"
        ],
        correct: 1,
        hint: "Your doctor specifically mentioned foods that can affect blood pressure.",
        videoSegment: "Video segment from 18:30 - 'Try to reduce your sodium intake and avoid processed foods...'"
    },
    {
        question: "What warning signs should you watch for?",
        options: [
            "Mild headaches",
            "Slight fatigue",
            "Severe dizziness or chest pain",
            "Occasional nausea"
        ],
        correct: 2,
        hint: "Your doctor emphasized symptoms that would require immediate medical attention.",
        videoSegment: "Video segment from 20:15 - 'Call me immediately if you experience severe dizziness or chest pain...'"
    }
];

// State Management
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let hintsUsed = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;

// DOM Elements
const currentQuestionEl = document.getElementById('currentQuestion');
const scoreEl = document.getElementById('score');
const progressFillEl = document.getElementById('progressFill');
const progressTextEl = document.getElementById('progressText');
const questionCardEl = document.getElementById('questionCard');
const questionTextEl = document.getElementById('questionText');
const optionsContainerEl = document.getElementById('optionsContainer');
const hintBtnEl = document.getElementById('hintBtn');
const nextBtnEl = document.getElementById('nextBtn');
const hintCardEl = document.getElementById('hintCard');
const resultsCardEl = document.getElementById('resultsCard');

// Initialize Quiz
document.addEventListener('DOMContentLoaded', function() {
    initializeQuiz();
    setupEventListeners();
});

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
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    scoreEl.textContent = score;
    
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

function showHint() {
    const question = quizQuestions[currentQuestionIndex];
    
    // Update hint content
    const videoSegmentEl = hintCardEl.querySelector('.video-segment p');
    const hintTextEl = hintCardEl.querySelector('.hint-text');
    
    videoSegmentEl.textContent = question.videoSegment;
    hintTextEl.textContent = question.hint;
    
    // Show hint card with animation
    hintCardEl.style.display = 'block';
    hintCardEl.style.animation = 'fadeIn 0.5s ease-out';
    
    // Disable hint button
    hintBtnEl.disabled = true;
    hintBtnEl.style.opacity = '0.5';
    
    // Track hints used
    hintsUsed++;
    
    // Scroll to hint
    hintCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function nextQuestion() {
    if (selectedAnswer === null) return;
    
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;
    
    // Show correct/incorrect states
    showAnswerFeedback(isCorrect);
    
    // Update score and stats
    if (isCorrect) {
        score++;
        correctAnswers++;
    } else {
        incorrectAnswers++;
    }
    
    // Wait for feedback animation, then proceed
    setTimeout(() => {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < quizQuestions.length) {
            updateUI();
            loadQuestion();
        } else {
            showResults();
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

// Save progress after each question
function nextQuestion() {
    if (selectedAnswer === null) return;
    
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;
    
    // Show correct/incorrect states
    showAnswerFeedback(isCorrect);
    
    // Update score and stats
    if (isCorrect) {
        score++;
        correctAnswers++;
    } else {
        incorrectAnswers++;
    }
    
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