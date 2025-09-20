const moonToggle = document.getElementById('moonToggle');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const voiceBtn = document.getElementById('voiceBtn');
const micIcon = document.getElementById('micIcon');
const voiceStatus = document.getElementById('voiceStatus');
const queryDisplay = document.getElementById('queryDisplay');
const responseArea = document.getElementById('responseArea');

let isRecording = false;
let recognition;
let mediaRecorder;
let recordingTimeout;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
}

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    addScrollEffects();
    animateOnScroll();
});

function initializeEventListeners() {
    moonToggle.addEventListener('click', function() {
        window.location.href = 'quiz.html';
    });

    uploadBtn.addEventListener('click', openUploadModal);
    closeModal.addEventListener('click', closeUploadModal);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    voiceBtn.addEventListener('click', toggleVoiceRecording);

    uploadModal.addEventListener('click', function(e) {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });
}
function openUploadModal() {
    uploadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
    uploadModal.classList.remove('active');
    document.body.style.overflow = '';
    resetUploadState();
}

function resetUploadState() {
    uploadArea.style.display = 'block';
    uploadProgress.style.display = 'none';
    fileInput.value = '';
}
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-peach)';
    uploadArea.style.background = 'rgba(255, 181, 167, 0.1)';
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = '#F7FAFC';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
}

function processFile(file) {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        showNotification('Please select a valid video or audio file.', 'error');
        return;
    }

    uploadArea.style.display = 'none';
    uploadProgress.style.display = 'block';

    setTimeout(() => {
        showNotification('Recording uploaded successfully! You can now ask questions about your visit.', 'success');
        closeUploadModal();
        scrollToVoiceSection();
    }, 3000);
}
function toggleVoiceRecording() {
    if (!recognition) {
        showNotification('Speech recognition not supported in this browser.', 'error');
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    isRecording = true;
    voiceBtn.classList.add('recording');
    micIcon.className = 'fas fa-stop';
    voiceStatus.textContent = 'Listening...';
    
    queryDisplay.innerHTML = '<p style="color: var(--primary-peach);">🎤 Listening for your question...</p>';

    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        displayQuery(transcript);
        processQuery(transcript);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        showNotification('Could not understand your question. Please try again.', 'error');
    };

    recognition.onend = function() {
        stopRecording();
    };

    recordingTimeout = setTimeout(() => {
        if (isRecording) {
            recognition.stop();
        }
    }, 10000);
}

function stopRecording() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    micIcon.className = 'fas fa-microphone';
    voiceStatus.textContent = 'Click to speak';
    
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
    }
}

function displayQuery(text) {
    queryDisplay.classList.add('has-content');
    queryDisplay.innerHTML = `<p><i class="fas fa-quote-left" style="color: var(--primary-peach); margin-right: 0.5rem;"></i>${text}</p>`;
}

function processQuery(query) {
    setTimeout(() => {
        showResponse(query);
    }, 2000);
}

function showResponse(query) {
    responseArea.style.display = 'block';
    responseArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let response = "Based on your question, here's what your doctor said during the visit.";
    
    if (query.toLowerCase().includes('prescription') || query.toLowerCase().includes('medication')) {
        response = "Your doctor prescribed medication to be taken twice daily with food. The video segment shows the exact instructions at 15:30 in your visit.";
    } else if (query.toLowerCase().includes('symptom')) {
        response = "Your doctor discussed your symptoms and mentioned they should improve within 7-10 days with proper treatment.";
    } else if (query.toLowerCase().includes('appointment') || query.toLowerCase().includes('follow')) {
        response = "Your doctor recommended a follow-up appointment in 2 weeks to check your progress.";
    }
    
    const responseText = document.querySelector('.response-text p');
    responseText.textContent = response;
  
    const videoPlaceholder = document.querySelector('.video-placeholder');
    videoPlaceholder.style.borderColor = 'var(--primary-peach)';
    videoPlaceholder.style.background = 'rgba(255, 181, 167, 0.05)';
}

function scrollToVoiceSection() {
    const voiceSection = document.getElementById('voiceSection');
    voiceSection.scrollIntoView({ behavior: 'smooth' });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#F56565' : 'var(--dark-matcha)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}
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
    
    const animateElements = document.querySelectorAll('.feature-card, .floating-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}
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

function simulateAIThinking() {
    voiceBtn.classList.add('processing');
    voiceStatus.textContent = 'Processing...';
    
    queryDisplay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary-peach);">
            <i class="fas fa-brain"></i>
            <span>AI is analyzing your question...</span>
            <div class="loading-dots">
                <span>.</span><span>.</span><span>.</span>
            </div>
        </div>
    `;
}

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

function enhancedProcessQuery(query) {
    simulateAIThinking();
    
    setTimeout(() => {
        voiceBtn.classList.remove('processing');
        voiceStatus.textContent = 'Click to speak';
        showResponse(query);
    }, 3000);
}

window.processQuery = enhancedProcessQuery;

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleVoiceRecording();
    }
    
    if (e.key === 'Escape') {
        closeUploadModal();
    }
});

let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    if (diff > 100 && !isRecording) {
        const voiceSection = document.getElementById('voiceSection');
        const rect = voiceSection.getBoundingClientRect();
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            toggleVoiceRecording();
        }
    }
});

function initializeDemoData() {
    setTimeout(() => {
        if (!localStorage.getItem('hasSeenDemo')) {
            showNotification('Demo mode: Recording already uploaded! Try asking a question.', 'info');
            localStorage.setItem('hasSeenDemo', 'true');
        }
    }, 2000);
}
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
});