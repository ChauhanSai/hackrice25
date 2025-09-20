function startRecordingTimer() {
    recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        recordingTime.textContent = timeString;
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    recordingTime.textContent = '00:00';
}

async function downloadAllRecordings() {
    try {
        const recordings = await getAllRecordings();
        
        if (recordings.length === 0 && !window.lastRecording) {
            showNotification('No recordings found to download.', 'info');
            return;
        }
    
        if (recordings.length > 0) {
            await downloadRecordingsAsZip(recordings);
        } else if (window.lastRecording) {
            downloadAudioFile(window.lastRecording.blob, window.lastRecording.filename);
        }
        
    } catch (error) {
        console.error('Error downloading recordings:', error);
    
        if (window.lastRecording) {
            downloadAudioFile(window.lastRecording.blob, window.lastRecording.filename);
            showNotification('Downloaded current recording.', 'success');
        } else {
            showNotification('No recordings available to download.', 'error');
        }
    }
}

async function downloadRecordingsAsZip(recordings) {
    // Simple implementation without external libraries
    if (recordings.length === 1) {
        // If only one recording, download it directly
        const recording = recordings[0];
        downloadAudioFile(recording.audioData, recording.filename);
        showNotification('Downloaded recording.', 'success');
    } else {
        // For multiple recordings, download them separately
        for (let i = 0; i < recordings.length; i++) {
            const recording = recordings[i];
            setTimeout(() => {
                downloadAudioFile(recording.audioData, recording.filename);
            }, i * 500); // Stagger downloads by 500ms
        }
        showNotification(`Downloading ${recordings.length} recordings...`, 'success');
    }
}

// Audio Format Conversion Functions
function getAudioFormat() {
    // Check browser support for different formats
    const mediaRecorder = window.MediaRecorder;
    
    if (mediaRecorder && mediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
    } else if (mediaRecorder && mediaRecorder.isTypeSupported('audio/mp4')) {
        return { mimeType: 'audio/mp4', extension: 'm4a' };
    } else if (mediaRecorder && mediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        return { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' };
    } else {
        return { mimeType: 'audio/wav', extension: 'wav' };
    }
}

// Enhanced Audio Recording with Better Format Support
async function startRecordingWithBestFormat() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
                channelCount: 1 // Mono recording for smaller file size
            } 
        });

        const audioFormat = getAudioFormat();
        
        mediaRecorder = new MediaRecorder(audioStream, {
            mimeType: audioFormat.mimeType
        });
        
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            createAudioFileWithFormat(audioFormat);
        };

        // Start recording
        mediaRecorder.start(1000);
        
        return true;
    } catch (error) {
        console.error('Error starting recording:', error);
        return false;
    }
}

function createAudioFileWithFormat(audioFormat) {
    if (audioChunks.length === 0) {
        console.log('No audio data recorded');
        return;
    }

    // Create blob with the appropriate format
    const audioBlob = new Blob(audioChunks, { type: audioFormat.mimeType });
    
    // Generate filename with correct extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `voice-query-${timestamp}.${audioFormat.extension}`;
    
    // Log file info
    console.log('Audio file created:', {
        filename: filename,
        size: audioBlob.size,
        type: audioBlob.type,
        format: audioFormat
    });
    
    // Auto-download the file
    downloadAudioFile(audioBlob, filename);
    
    // Store for potential upload to server
    storeAudioFile(audioBlob, filename);
    
    // Show success message
    showNotification(`Voice recording saved as ${filename}`, 'success');
    
    // Show download button if hidden
    if (downloadRecordingsBtn) {
        downloadRecordingsBtn.style.display = 'flex';
    }
}

// Recording Quality Indicator
function showRecordingQuality() {
    if (!audioStream) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(audioStream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function updateQuality() {
        if (!isRecording) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const quality = Math.min(100, (average / 128) * 100);
        
        // Update UI indicator (you could add a visual indicator)
        if (quality > 50) {
            recordingInfo.style.borderColor = 'var(--success)';
        } else if (quality > 20) {
            recordingInfo.style.borderColor = 'var(--warning)';
        } else {
            recordingInfo.style.borderColor = 'var(--error)';
        }
        
        requestAnimationFrame(updateQuality);
    }
    
    updateQuality();
}function displayQuery(text) {
    queryDisplay.classList.add('has-content');
    queryDisplay.innerHTML = `<p><i class="fas fa-quote-left" style="color: var(--primary-matcha); margin-right: 0.5rem;"></i>${text}</p>`;
}

function processQuery(query) {
    // Process the transcribed query and the audio file
    if (window.lastRecording) {
        console.log('Processing query with audio file:', {
            query: query,
            audioFile: window.lastRecording.filename,
            audioSize: window.lastRecording.size
        });
        
        // Here you would send both the text query and audio file to Twelve Labs API
        processQueryWithTwelveLabs(query, window.lastRecording.blob);
    }
    
    // Simulate AI processing
    setTimeout(() => {
        showResponse(query);
    }, 2000);
}

async function processQueryWithTwelveLabs(query, audioBlob) {
    // This is where you'd integrate with Twelve Labs API
    // Example implementation:
    
    try {
        // 1. Upload audio file to your server
        const uploadResult = await uploadAudioToServer(audioBlob, window.lastRecording.filename);
        
        if (uploadResult) {
            // 2. Send query to Twelve Labs API
            const searchResult = await searchVideoWithQuery(query);
            
            // 3. Process results
            if (searchResult) {
                displayVideoResults(searchResult);
            }
        }
        
    } catch (error) {
        console.error('Error processing with Twelve Labs:', error);
        showNotification('Error processing your query. Please try again.', 'error');
    }
}

async function searchVideoWithQuery(query) {
    // Placeholder for Twelve Labs API integration
    // This would be implemented with your backend API
    
    const response = await fetch('/api/search-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            audioFile: window.lastRecording?.filename
        })
    });
    
    if (response.ok) {
        return await response.json();
    }
    
    return null;
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
const voiceBtn = document.getElementById('voiceBtn');
const micIcon = document.getElementById('micIcon');
const voiceStatus = document.getElementById('voiceStatus');
const queryDisplay = document.getElementById('queryDisplay');
const responseArea = document.getElementById('responseArea');

// State
let isRecording = false;
let recognition;
let mediaRecorder;
let recordingTimeout;
let audioChunks = [];
let audioStream;

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
    // Moon toggle (Dark mode redirect)
    moonToggle.addEventListener('click', function() {
        // Simulate redirect to dark mode/quiz page
        window.location.href = 'quiz.html';
    });

    // Upload modal
    uploadBtn.addEventListener('click', openUploadModal);
    closeModal.addEventListener('click', closeUploadModal);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Voice recording
    voiceBtn.addEventListener('click', toggleVoiceRecording);

    // Click outside modal to close
    uploadModal.addEventListener('click', function(e) {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });
}

// Upload Modal Functions
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

// File Upload Functions
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
    // Validate file type
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        showNotification('Please select a valid video or audio file.', 'error');
        return;
    }

    // Show upload progress
    uploadArea.style.display = 'none';
    uploadProgress.style.display = 'block';

    // Simulate file processing
    setTimeout(() => {
        showNotification('Recording uploaded successfully! You can now ask questions about your visit.', 'success');
        closeUploadModal();
        scrollToVoiceSection();
    }, 3000);
}

// Voice Recording Functions
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

    // Auto-stop after 10 seconds
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
    // Simulate AI processing
    setTimeout(() => {
        showResponse(query);
    }, 2000);
}

function showResponse(query) {
    responseArea.style.display = 'block';
    responseArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Simulate different responses based on query keywords
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
    
    // Animate the video placeholder
    const videoPlaceholder = document.querySelector('.video-placeholder');
    videoPlaceholder.style.borderColor = 'var(--primary-peach)';
    videoPlaceholder.style.background = 'rgba(255, 181, 167, 0.05)';
}

// Utility Functions
function scrollToVoiceSection() {
    const voiceSection = document.getElementById('voiceSection');
    voiceSection.scrollIntoView({ behavior: 'smooth' });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles
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
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
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

// Simulate AI thinking for voice queries
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
        showResponse(query);
    }, 3000);
}

// Replace the original processQuery function
window.processQuery = enhancedProcessQuery;

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
            showNotification('Demo mode: Recording already uploaded! Try asking a question.', 'info');
            localStorage.setItem('hasSeenDemo', 'true');
        }
    }, 2000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
});
