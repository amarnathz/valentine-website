// Initialize configuration
const config = window.VALENTINE_CONFIG;

// ============================================
// 💝 AUTO-SAVE CLICKS TO GITHUB 💝
// ============================================

const userInteractions = [];

async function saveClickToGitHub(clickData) {
    try {
        const githubConfig = window.GITHUB_CONFIG;
        
        // Get current file content
        const getUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}`;
        
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+raw'
            }
        });
        
        let currentContent = '';
        let sha = '';
        
        if (getResponse.ok) {
            currentContent = await getResponse.text();
            // Get the SHA for updating
            const shaResponse = await fetch(getUrl, {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const shaData = await shaResponse.json();
            sha = shaData.sha;
        }
        
        // Add new click data
        const newEntry = `\n[${new Date().toLocaleString()}] ${clickData}`;
        const newContent = currentContent + newEntry;
        
        // Update file in GitHub
        const updateUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}`;
        
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `📊 Click tracked: ${clickData}`,
                content: btoa(newContent), // Base64 encode
                sha: sha
            })
        });
        
        if (updateResponse.ok) {
            console.log("✅ Click saved to GitHub:", clickData);
        }
    } catch (error) {
        console.log("⚠️ Could not save to GitHub (this is OK):", error);
        // Still track locally
        localStorage.setItem('valentineInteractions', JSON.stringify(userInteractions));
    }
}

function logUserAction(action, buttonName, timestamp = new Date().toLocaleString()) {
    const currentStep = getCurrentStep();
    const clickEntry = `${action} | ${buttonName} | ${currentStep}`;
    
    userInteractions.push(clickEntry);
    console.log("📊 Click Logged:", clickEntry);
    
    // Save to GitHub
    saveClickToGitHub(clickEntry);
    
    // Also save locally
    localStorage.setItem('valentineInteractions', JSON.stringify(userInteractions));
}

function getCurrentStep() {
    if (!document.getElementById('question1').classList.contains('hidden')) return 'Q1: Do you like me?';
    if (!document.getElementById('question2').classList.contains('hidden')) return 'Q2: Love Meter';
    if (!document.getElementById('question3').classList.contains('hidden')) return 'Q3: Will you be my Valentine?';
    if (!document.getElementById('celebration').classList.contains('hidden')) return 'Celebration!';
    return 'Unknown';
}

// ============================================
// REST OF YOUR EXISTING CODE
// ============================================

function validateConfig() {
    const warnings = [];
    if (!config.valentineName) {
        warnings.push("Valentine's name is not set! Using default.");
        config.valentineName = "My Love";
    }
    const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    Object.entries(config.colors).forEach(([key, value]) => {
        if (!isValidHex(value)) {
            warnings.push(`Invalid color for ${key}! Using default.`);
            config.colors[key] = getDefaultColor(key);
        }
    });
    if (parseFloat(config.animations.floatDuration) < 5) {
        warnings.push("Float duration too short! Setting to 5s minimum.");
        config.animations.floatDuration = "5s";
    }
    if (config.animations.heartExplosionSize < 1 || config.animations.heartExplosionSize > 3) {
        warnings.push("Heart explosion size should be between 1 and 3! Using default.");
        config.animations.heartExplosionSize = 1.5;
    }
    if (warnings.length > 0) {
        console.warn("⚠️ Configuration Warnings:");
        warnings.forEach(warning => console.warn("- " + warning));
    }
}

function getDefaultColor(key) {
    const defaults = {
        backgroundStart: "#ffafbd",
        backgroundEnd: "#ffc3a0",
        buttonBackground: "#ff6b6b",
        buttonHover: "#ff8787",
        textColor: "#ff4757"
    };
    return defaults[key];
}

document.title = config.pageTitle;

window.addEventListener('DOMContentLoaded', () => {
    validateConfig();
    
    document.getElementById('valentineTitle').textContent = `${config.valentineName}, my love...`;
    
    document.getElementById('question1Text').textContent = config.questions.first.text;
    document.getElementById('yesBtn1').textContent = config.questions.first.yesBtn;
    document.getElementById('noBtn1').textContent = config.questions.first.noBtn;
    document.getElementById('secretAnswerBtn').textContent = config.questions.first.secretAnswer;
    
    document.getElementById('question2Text').textContent = config.questions.second.text;
    document.getElementById('startText').textContent = config.questions.second.startText;
    document.getElementById('nextBtn').textContent = config.questions.second.nextBtn;
    
    document.getElementById('question3Text').textContent = config.questions.third.text;
    document.getElementById('yesBtn3').textContent = config.questions.third.yesBtn;
    document.getElementById('noBtn3').textContent = config.questions.third.noBtn;

    // ============================================
    // 💝 SETUP CLICK TRACKING FOR ALL BUTTONS
    // ============================================
    
    document.getElementById('yesBtn1').onclick = function() { 
        logUserAction('CLICK', 'YES Button - Question 1');
        showNextQuestion(2); 
    };
    
    document.getElementById('noBtn1').onclick = function() { 
        logUserAction('CLICK', 'NO Button - Question 1 (Moved away)');
        moveButton(this); 
    };
    
    document.getElementById('secretAnswerBtn').onclick = function() { 
        logUserAction('CLICK', 'Secret Answer Button');
        showNextQuestion(2); 
    };
    
    document.getElementById('loveMeter').addEventListener('input', function() {
        logUserAction('METER', `Love Meter set to ${this.value}%`);
    });
    
    document.getElementById('nextBtn').onclick = function() { 
        logUserAction('CLICK', 'NEXT Button - Question 2');
        showNextQuestion(3); 
    };
    
    document.getElementById('yesBtn3').onclick = function() { 
        logUserAction('CLICK', '🎉 YES BUTTON - FINAL ANSWER - SAID YES!');
        celebrate(); 
    };
    
    document.getElementById('noBtn3').onclick = function() { 
        logUserAction('CLICK', 'NO Button - Question 3 (Moved away)');
        moveButton(this); 
    };

    createFloatingElements();
    setupMusicPlayer();
    
    logUserAction('PAGE_LOAD', 'Website opened');
});

function createFloatingElements() {
    const container = document.querySelector('.floating-elements');
    config.floatingEmojis.hearts.forEach(heart => {
        const div = document.createElement('div');
        div.className = 'heart';
        div.innerHTML = heart;
        setRandomPosition(div);
        container.appendChild(div);
    });
    config.floatingEmojis.bears.forEach(bear => {
        const div = document.createElement('div');
        div.className = 'bear';
        div.innerHTML = bear;
        setRandomPosition(div);
        container.appendChild(div);
    });
}

function setRandomPosition(element) {
    element.style.left = Math.random() * 100 + 'vw';
    element.style.animationDelay = Math.random() * 5 + 's';
    element.style.animationDuration = 10 + Math.random() * 20 + 's';
}

function showNextQuestion(questionNumber) {
    document.querySelectorAll('.question-section').forEach(q => q.classList.add('hidden'));
    document.getElementById(`question${questionNumber}`).classList.remove('hidden');
}

function moveButton(button) {
    const x = Math.random() * (window.innerWidth - button.offsetWidth);
    const y = Math.random() * (window.innerHeight - button.offsetHeight);
    button.style.position = 'fixed';
    button.style.left = x + 'px';
    button.style.top = y + 'px';
}

const loveMeter = document.getElementById('loveMeter');
const loveValue = document.getElementById('loveValue');
const extraLove = document.getElementById('extraLove');

function setInitialPosition() {
    loveMeter.value = 100;
    loveValue.textContent = 100;
    loveMeter.style.width = '100%';
}

loveMeter.addEventListener('input', () => {
    const value = parseInt(loveMeter.value);
    loveValue.textContent = value;
    
    if (value > 100) {
        extraLove.classList.remove('hidden');
        const overflowPercentage = (value - 100) / 9900;
        const extraWidth = overflowPercentage * window.innerWidth * 0.8;
        loveMeter.style.width = `calc(100% + ${extraWidth}px)`;
        loveMeter.style.transition = 'width 0.3s';
        
        if (value >= 5000) {
            extraLove.classList.add('super-love');
            extraLove.textContent = config.loveMessages.extreme;
        } else if (value > 1000) {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.high;
        } else {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.normal;
        }
    } else {
        extraLove.classList.add('hidden');
        extraLove.classList.remove('super-love');
        loveMeter.style.width = '100%';
    }
});

window.addEventListener('DOMContentLoaded', setInitialPosition);
window.addEventListener('load', setInitialPosition);

function celebrate() {
    document.querySelectorAll('.question-section').forEach(q => q.classList.add('hidden'));
    const celebration = document.getElementById('celebration');
    celebration.classList.remove('hidden');
    
    document.getElementById('celebrationTitle').textContent = config.celebration.title;
    document.getElementById('celebrationMessage').textContent = config.celebration.message;
    document.getElementById('celebrationEmojis').textContent = config.celebration.emojis;
    
    createHeartExplosion();
}

function createHeartExplosion() {
    for (let i = 0; i < 50; i++) {
        const heart = document.createElement('div');
        const randomHeart = config.floatingEmojis.hearts[Math.floor(Math.random() * config.floatingEmojis.hearts.length)];
        heart.innerHTML = randomHeart;
        heart.className = 'heart';
        document.querySelector('.floating-elements').appendChild(heart);
        setRandomPosition(heart);
    }
}

function setupMusicPlayer() {
    const musicControls = document.getElementById('musicControls');
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    const musicSource = document.getElementById('musicSource');

    if (!config.music.enabled) {
        musicControls.style.display = 'none';
        return;
    }

    musicSource.src = config.music.musicUrl;
    bgMusic.volume = config.music.volume || 0.5;
    bgMusic.load();

    if (config.music.autoplay) {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented by browser");
                musicToggle.textContent = config.music.startText;
            });
        }
    }

    musicToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            musicToggle.textContent = config.music.stopText;
            logUserAction('MUSIC', 'Music started');
        } else {
            bgMusic.pause();
            musicToggle.textContent = config.music.startText;
            logUserAction('MUSIC', 'Music stopped');
        }
    });
}
