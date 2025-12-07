// ===== 遊戲資料結構 =====

// 裝備定義 (含經驗加乘)
const EQUIPMENT_DATA = {
    2: { name: '木劍', icon: '🗡️', type: 'weapon', style: 'wooden-sword', expBonus: 0.1 },
    3: { name: '皮帽', icon: '🎩', type: 'helmet', style: 'leather-hat', expBonus: 0.1 },
    4: { name: '布衣', icon: '👕', type: 'armor', style: 'cloth-armor', expBonus: 0.1 },
    5: { name: '鐵劍', icon: '⚔️', type: 'weapon', style: 'iron-sword', expBonus: 0.15 },
    6: { name: '木盾', icon: '🛡️', type: 'shield', style: 'wooden-shield', expBonus: 0.15 },
    7: { name: '鐵盔', icon: '🪖', type: 'helmet', style: 'iron-helmet', expBonus: 0.2 },
    8: { name: '鎖甲', icon: '🧥', type: 'armor', style: 'chain-armor', expBonus: 0.2 },
    9: { name: '魔法披風', icon: '🌟', type: 'cape', style: 'magic-cape', expBonus: 0.25 },
    10: { name: '王者冠冕', icon: '👑', type: 'crown', style: 'king-crown', expBonus: 0.3 }
};

// 音效管理器
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('音效不可用');
        }
    }

    playCorrect() {
        this.playTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
    }

    playWrong() {
        this.playTone(200, 0.2, 'sawtooth');
    }

    playLevelUp() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 100);
        });
    }

    playVictory() {
        // 華麗的勝利音效
        const melody = [
            { freq: 523.25, dur: 0.1 }, // C5
            { freq: 587.33, dur: 0.1 }, // D5
            { freq: 659.25, dur: 0.1 }, // E5
            { freq: 783.99, dur: 0.1 }, // G5
            { freq: 1046.50, dur: 0.3 }, // C6
            { freq: 783.99, dur: 0.1 }, // G5
            { freq: 1046.50, dur: 0.5 }, // C6
        ];
        let time = 0;
        melody.forEach(note => {
            setTimeout(() => this.playTone(note.freq, note.dur, 'sine'), time);
            time += note.dur * 1000;
        });
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.enabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // 忽略音效錯誤
        }
    }
}

// ===== 角色類別 =====
class Character {
    constructor() {
        this.reset();
    }

    reset() {
        this.level = 1;
        this.exp = 0;
        this.maxHP = 100;
        this.currentHP = 100;
        this.equipment = [];
    }

    get expToNextLevel() {
        return this.level * 100;
    }

    // 計算經驗加乘倍率
    getExpMultiplier() {
        let bonus = 1.0;
        this.equipment.forEach(eq => {
            bonus += eq.expBonus || 0;
        });
        return bonus;
    }

    addExp(baseAmount) {
        const multiplier = this.getExpMultiplier();
        const actualExp = Math.floor(baseAmount * multiplier);
        this.exp += actualExp;
        const leveledUp = [];

        while (this.exp >= this.expToNextLevel && this.level < 10) {
            this.exp -= this.expToNextLevel;
            this.level++;

            // 解鎖裝備
            if (EQUIPMENT_DATA[this.level]) {
                const newEquipment = { ...EQUIPMENT_DATA[this.level] };
                this.equipment.push(newEquipment);
                leveledUp.push(newEquipment);
            }
        }

        // 回傳實際獲得經驗與升級資訊
        return { leveledUp, actualExp, multiplier };
    }

    // 檢查是否達成終極勝利
    isMaxLevel() {
        return this.level >= 10 && this.exp >= this.expToNextLevel;
    }

    takeDamage(amount) {
        this.currentHP = Math.max(0, this.currentHP - amount);
        return this.currentHP <= 0;
    }

    heal(amount) {
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    }

    resetHP() {
        this.currentHP = this.maxHP;
    }
}

// ===== 關卡類別 =====
class Stage {
    constructor(number) {
        this.number = number;
        this.multiplyBy = number;
        this.totalQuestions = 10;
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.generateQuestion();
    }

    generateQuestion() {
        const num = Math.floor(Math.random() * 9) + 1;
        this.question = {
            a: this.multiplyBy,
            b: num,
            answer: this.multiplyBy * num
        };
    }

    checkAnswer(userAnswer) {
        const isCorrect = parseInt(userAnswer) === this.question.answer;
        if (isCorrect) {
            this.correctAnswers++;
        }
        this.currentQuestion++;
        return isCorrect;
    }

    isComplete() {
        return this.currentQuestion >= this.totalQuestions;
    }

    getProgress() {
        return `${this.currentQuestion}/${this.totalQuestions}`;
    }
}

// ===== 計時器類別 =====
class GameTimer {
    constructor() {
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.timerInterval = null;
        this.bestTime = this.loadBestTime();
    }

    start() {
        this.startTime = Date.now();
        this.isRunning = true;
        this.timerInterval = setInterval(() => this.update(), 100);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.elapsedTime = Date.now() - this.startTime;
        return this.elapsedTime;
    }

    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.startTime = null;
        this.updateDisplay();
    }

    update() {
        if (this.isRunning && this.startTime) {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const timerEl = document.getElementById('gameTimer');
        if (timerEl) {
            timerEl.textContent = this.formatTime(this.elapsedTime);
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    }

    checkNewRecord() {
        if (this.bestTime === null || this.elapsedTime < this.bestTime) {
            this.bestTime = this.elapsedTime;
            this.saveBestTime();
            return true;
        }
        return false;
    }

    saveBestTime() {
        localStorage.setItem('mathHeroBestTime', this.bestTime.toString());
    }

    loadBestTime() {
        const saved = localStorage.getItem('mathHeroBestTime');
        return saved ? parseInt(saved) : null;
    }

    getBestTimeFormatted() {
        return this.bestTime ? this.formatTime(this.bestTime) : '--:--:--';
    }
}

// ===== 遊戲管理器 =====
class GameManager {
    constructor() {
        this.character = new Character();
        this.currentStage = null;
        this.timer = new GameTimer();
        this.sound = new SoundManager();
        this.gameStarted = false;
        this.totalCorrect = 0;
        this.totalQuestions = 0;
        this.init();
    }

    init() {
        this.updateUI();
        this.showStart();
        this.updateBestTimeDisplay();
    }

    // ===== 新遊戲開始 =====
    startNewGame() {
        // 重置角色為 Lv1
        this.character.reset();
        this.timer.reset();
        this.gameStarted = true;
        this.totalCorrect = 0;
        this.totalQuestions = 0;

        // 初始化音效
        this.sound.init();

        // 開始計時
        this.timer.start();

        // 進入關卡選擇
        this.showStageSelect();
    }

    // ===== 畫面切換 =====
    showStart() {
        this.hideAllScreens();
        document.getElementById('startScreen').classList.add('active');
        this.updateBestTimeDisplay();
    }

    showStageSelect() {
        this.hideAllScreens();
        document.getElementById('stageSelectScreen').classList.add('active');
        this.renderStageGrid();
        this.updatePlayerStatus();
    }

    showGame(stageNumber) {
        if (stageNumber < 1 || stageNumber > 9) return;

        this.character.resetHP();
        this.currentStage = new Stage(stageNumber);
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('currentStageTitle').textContent = `關卡 ${stageNumber} - ${stageNumber} 的乘法表`;
        this.updateGameUI();
        this.renderQuestion();
        document.getElementById('answerInput').focus();
    }

    exitGame() {
        this.currentStage = null;
        this.showStageSelect();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    // ===== UI 渲染 =====
    renderStageGrid() {
        const grid = document.getElementById('stageGrid');
        grid.innerHTML = '';

        for (let i = 1; i <= 9; i++) {
            const card = document.createElement('div');
            card.className = 'stage-card';
            card.innerHTML = `
                <div class="stage-icon">${this.getStageIcon(i)}</div>
                <div class="stage-title">關卡 ${i}</div>
                <div class="stage-desc">${i} 的乘法表</div>
            `;
            card.onclick = () => this.showGame(i);
            grid.appendChild(card);
        }
    }

    getStageIcon(stage) {
        const icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        return icons[stage - 1];
    }

    updatePlayerStatus() {
        document.getElementById('playerLevelDisplay').textContent = this.character.level;
        document.getElementById('playerExpDisplay').textContent =
            `${this.character.exp}/${this.character.expToNextLevel}`;

        // 顯示經驗加乘
        const multiplier = this.character.getExpMultiplier();
        const bonusEl = document.getElementById('expBonusDisplay');
        if (bonusEl) {
            bonusEl.textContent = multiplier > 1 ? `(x${multiplier.toFixed(1)})` : '';
        }
    }

    updateBestTimeDisplay() {
        const bestTimeEl = document.getElementById('bestTimeDisplay');
        if (bestTimeEl) {
            bestTimeEl.textContent = this.timer.getBestTimeFormatted();
        }
    }

    updateGameUI() {
        // 更新角色狀態
        document.getElementById('charLevel').textContent = this.character.level;
        this.updateHP();
        this.updateExp();
        this.updateEquipmentDisplay();
        this.updateCharacterAppearance();

        // 更新進度
        if (this.currentStage) {
            document.getElementById('questionProgress').textContent = this.currentStage.getProgress();
        }

        // 更新經驗加乘顯示
        const multiplier = this.character.getExpMultiplier();
        const bonusInfo = document.getElementById('expBonusInfo');
        if (bonusInfo) {
            bonusInfo.textContent = multiplier > 1 ? `經驗加乘: x${multiplier.toFixed(1)}` : '';
        }
    }

    updateHP() {
        const hpPercent = (this.character.currentHP / this.character.maxHP) * 100;
        document.getElementById('hpFill').style.width = `${hpPercent}%`;
        document.getElementById('hpText').textContent =
            `${this.character.currentHP}/${this.character.maxHP}`;
    }

    updateExp() {
        const expPercent = (this.character.exp / this.character.expToNextLevel) * 100;
        document.getElementById('expFill').style.width = `${expPercent}%`;
        document.getElementById('expText').textContent =
            `${this.character.exp}/${this.character.expToNextLevel}`;
    }

    updateEquipmentDisplay() {
        const slotsContainer = document.getElementById('equipmentSlots');
        slotsContainer.innerHTML = '';

        // 顯示所有已解鎖的裝備
        if (this.character.equipment.length === 0) {
            slotsContainer.innerHTML = '<p class="muted" style="grid-column: 1/-1; text-align: center;">升級解鎖裝備</p>';
            return;
        }

        this.character.equipment.forEach(eq => {
            const slot = document.createElement('div');
            slot.className = 'equipment-slot equipped';
            slot.innerHTML = `
                <div class="icon">${eq.icon}</div>
                <div class="name">${eq.name}</div>
                <div class="bonus">+${Math.round(eq.expBonus * 100)}%</div>
            `;
            slotsContainer.appendChild(slot);
        });
    }

    updateCharacterAppearance() {
        const equipLayer = document.getElementById('equipmentLayer');
        equipLayer.innerHTML = '';

        this.character.equipment.forEach(eq => {
            const equipElement = document.createElement('div');
            equipElement.className = `equipment-visual ${eq.style}`;

            // 根據裝備類型添加樣式
            switch (eq.type) {
                case 'weapon':
                    equipElement.style.cssText = `
                        position: absolute;
                        right: 40px;
                        top: 90px;
                        width: 8px;
                        height: 60px;
                        background: ${eq.style === 'iron-sword' ? '#94a3b8' : '#8b4513'};
                        border-radius: 2px;
                        transform: rotate(-45deg);
                        border: 2px solid ${eq.style === 'iron-sword' ? '#64748b' : '#654321'};
                    `;
                    break;
                case 'helmet':
                    equipElement.style.cssText = `
                        position: absolute;
                        top: 15px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 70px;
                        height: 25px;
                        background: ${eq.style === 'iron-helmet' ? '#64748b' : '#8b4513'};
                        border-radius: 50% 50% 0 0;
                        border: 2px solid ${eq.style === 'iron-helmet' ? '#475569' : '#654321'};
                    `;
                    break;
                case 'armor':
                    equipElement.style.cssText = `
                        position: absolute;
                        top: 75px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 55px;
                        height: 75px;
                        background: ${eq.style === 'chain-armor' ?
                            'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                            'linear-gradient(135deg, #86efac 0%, #4ade80 100%)'};
                        border-radius: 8px;
                        border: 3px solid ${eq.style === 'chain-armor' ? '#475569' : '#16a34a'};
                        z-index: -1;
                    `;
                    break;
                case 'shield':
                    equipElement.style.cssText = `
                        position: absolute;
                        left: 35px;
                        top: 90px;
                        width: 30px;
                        height: 40px;
                        background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
                        border-radius: 5px 5px 15px 15px;
                        border: 3px solid #654321;
                    `;
                    break;
                case 'cape':
                    equipElement.style.cssText = `
                        position: absolute;
                        top: 80px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 70px;
                        height: 80px;
                        background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                        border-radius: 10px;
                        z-index: -2;
                        animation: capeWave 2s ease-in-out infinite;
                    `;
                    // 添加披風動畫
                    if (!document.querySelector('style#capeAnimation')) {
                        const style = document.createElement('style');
                        style.id = 'capeAnimation';
                        style.textContent = `
                            @keyframes capeWave {
                                0%, 100% { transform: translateX(-50%) rotate(0deg); }
                                50% { transform: translateX(-50%) rotate(3deg); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    break;
                case 'crown':
                    equipElement.style.cssText = `
                        position: absolute;
                        top: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 60px;
                        height: 30px;
                        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                        clip-path: polygon(0% 100%, 10% 0%, 30% 50%, 50% 0%, 70% 50%, 90% 0%, 100% 100%);
                        box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
                    `;
                    break;
            }

            equipLayer.appendChild(equipElement);
        });
    }

    renderQuestion() {
        if (!this.currentStage) return;

        const q = this.currentStage.question;
        document.getElementById('questionText').textContent = `${q.a} × ${q.b} = ?`;
        document.getElementById('answerInput').value = '';
    }

    // ===== 遊戲邏輯 =====
    submitAnswer() {
        if (!this.currentStage) return;

        const input = document.getElementById('answerInput');
        const userAnswer = input.value.trim();

        if (userAnswer === '') {
            this.showFeedback('請輸入答案！', false);
            return;
        }

        const isCorrect = this.currentStage.checkAnswer(userAnswer);
        this.totalQuestions++;

        if (isCorrect) {
            this.totalCorrect++;
            this.sound.playCorrect();
            const result = this.character.addExp(20);

            // 顯示獲得經驗（含加乘）
            const bonusText = result.multiplier > 1 ? ` (x${result.multiplier.toFixed(1)})` : '';
            this.showFeedback(`✅ 答對了！+${result.actualExp} EXP${bonusText}`, true);

            // 檢查是否升級
            if (result.leveledUp.length > 0) {
                setTimeout(() => this.showLevelUpModal(result.leveledUp), 500);
            }

            // 檢查是否達成終極勝利 (Lv10 滿經驗)
            if (this.character.level >= 10) {
                setTimeout(() => this.showUltimateVictory(), 800);
                return;
            }
        } else {
            this.sound.playWrong();
            this.showFeedback(`❌ 答錯了！正確答案是 ${this.currentStage.question.answer}`, false);
            const isDead = this.character.takeDamage(15);

            if (isDead) {
                setTimeout(() => this.showDefeatModal(), 800);
                return;
            }
        }

        this.updateGameUI();

        // 檢查關卡是否完成
        if (this.currentStage.isComplete()) {
            setTimeout(() => this.showVictoryModal(), 1000);
        } else {
            // 生成下一題
            setTimeout(() => {
                this.currentStage.generateQuestion();
                this.renderQuestion();
                input.focus();
            }, 1200);
        }
    }

    showFeedback(message, isCorrect) {
        const feedback = document.getElementById('feedbackMessage');
        feedback.textContent = message;
        feedback.className = 'feedback-message show ' + (isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1000);
    }

    // ===== 彈窗控制 =====
    showLevelUpModal(newEquipment) {
        this.sound.playLevelUp();
        const modal = document.getElementById('levelUpModal');
        document.getElementById('newLevel').textContent = this.character.level;

        const display = document.getElementById('newEquipmentDisplay');
        display.innerHTML = newEquipment.map(eq => `
            <div class="equipment-reward">${eq.icon}</div>
            <div class="equipment-name">獲得：${eq.name}</div>
            <div class="equipment-bonus">經驗加乘 +${Math.round(eq.expBonus * 100)}%</div>
        `).join('');

        modal.classList.add('show');
        this.updateGameUI();
    }

    closeLevelUpModal() {
        document.getElementById('levelUpModal').classList.remove('show');

        // 檢查是否已達 Lv10
        if (this.character.level >= 10) {
            setTimeout(() => this.showUltimateVictory(), 300);
        } else {
            document.getElementById('answerInput').focus();
        }
    }

    showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        const stats = document.getElementById('victoryStats');

        stats.innerHTML = `
            <p>✅ 答對題數：${this.currentStage.correctAnswers}/${this.currentStage.totalQuestions}</p>
            <p>❤️ 剩餘血量：${this.character.currentHP}/${this.character.maxHP}</p>
            <p>⭐ 當前等級：${this.character.level}</p>
            <p>⏱️ 已用時間：${this.timer.formatTime(this.timer.elapsedTime)}</p>
        `;

        modal.classList.add('show');
    }

    // ===== 終極勝利 =====
    showUltimateVictory() {
        this.timer.stop();
        this.sound.playVictory();

        const isNewRecord = this.timer.checkNewRecord();
        const modal = document.getElementById('ultimateVictoryModal');

        if (modal) {
            document.getElementById('finalTime').textContent = this.timer.formatTime(this.timer.elapsedTime);
            document.getElementById('finalAccuracy').textContent =
                `${this.totalCorrect}/${this.totalQuestions} (${Math.round(this.totalCorrect / this.totalQuestions * 100)}%)`;

            const recordBadge = document.getElementById('newRecordBadge');
            if (recordBadge) {
                recordBadge.style.display = isNewRecord ? 'block' : 'none';
            }

            const bestTimeEl = document.getElementById('ultimateBestTime');
            if (bestTimeEl) {
                bestTimeEl.textContent = this.timer.getBestTimeFormatted();
            }

            modal.classList.add('show');

            // 觸發煙火特效
            this.triggerFireworks();
        }
    }

    triggerFireworks() {
        const container = document.getElementById('fireworksContainer');
        if (!container) return;

        container.innerHTML = '';

        // 創建多個煙火
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = Math.random() * 100 + '%';
                firework.style.top = Math.random() * 60 + 20 + '%';
                firework.style.setProperty('--hue', Math.random() * 360);
                container.appendChild(firework);

                setTimeout(() => firework.remove(), 1500);
            }, i * 200);
        }
    }

    closeUltimateVictory() {
        document.getElementById('ultimateVictoryModal').classList.remove('show');
        this.showStart();
    }

    showDefeatModal() {
        this.timer.stop();
        const modal = document.getElementById('defeatModal');
        modal.classList.add('show');
    }

    nextStage() {
        document.getElementById('victoryModal').classList.remove('show');
        if (this.currentStage && this.currentStage.number < 9) {
            this.showGame(this.currentStage.number + 1);
        } else {
            this.showStageSelect();
        }
    }

    retryStage() {
        document.getElementById('defeatModal').classList.remove('show');
        if (this.currentStage) {
            this.showGame(this.currentStage.number);
        }
    }

    restartGame() {
        document.getElementById('defeatModal').classList.remove('show');
        this.startNewGame();
    }

    updateUI() {
        this.updateGameUI();
    }
}

// ===== 遊戲啟動 =====
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new GameManager();
});
