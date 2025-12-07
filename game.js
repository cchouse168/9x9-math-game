// ===== 遊戲資料結構 =====

// 裝備定義
const EQUIPMENT_DATA = {
    2: { name: '木劍', icon: '🗡️', type: 'weapon', style: 'wooden-sword' },
    3: { name: '皮帽', icon: '🎩', type: 'helmet', style: 'leather-hat' },
    4: { name: '布衣', icon: '👕', type: 'armor', style: 'cloth-armor' },
    5: { name: '鐵劍', icon: '⚔️', type: 'weapon', style: 'iron-sword' },
    6: { name: '木盾', icon: '🛡️', type: 'shield', style: 'wooden-shield' },
    7: { name: '鐵盔', icon: '🪖', type: 'helmet', style: 'iron-helmet' },
    8: { name: '鎖甲', icon: '🧥', type: 'armor', style: 'chain-armor' },
    9: { name: '魔法披風', icon: '🌟', type: 'cape', style: 'magic-cape' },
    10: { name: '王者冠冕', icon: '👑', type: 'crown', style: 'king-crown' }
};

// ===== 角色類別 =====
class Character {
    constructor() {
        this.level = 1;
        this.exp = 0;
        this.maxHP = 100;
        this.currentHP = 100;
        this.equipment = [];
        this.loadProgress();
    }

    get expToNextLevel() {
        return this.level * 100;
    }

    addExp(amount) {
        this.exp += amount;
        const leveledUp = [];

        while (this.exp >= this.expToNextLevel && this.level < 10) {
            this.exp -= this.expToNextLevel;
            this.level++;

            // 解鎖裝備
            if (EQUIPMENT_DATA[this.level]) {
                const newEquipment = EQUIPMENT_DATA[this.level];
                this.equipment.push(newEquipment);
                leveledUp.push(newEquipment);
            }
        }

        this.saveProgress();
        return leveledUp;
    }

    takeDamage(amount) {
        this.currentHP = Math.max(0, this.currentHP - amount);
        this.saveProgress();
        return this.currentHP <= 0;
    }

    heal(amount) {
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
        this.saveProgress();
    }

    resetHP() {
        this.currentHP = this.maxHP;
        this.saveProgress();
    }

    saveProgress() {
        const data = {
            level: this.level,
            exp: this.exp,
            currentHP: this.currentHP,
            equipment: this.equipment
        };
        localStorage.setItem('gameProgress', JSON.stringify(data));
    }

    loadProgress() {
        const saved = localStorage.getItem('gameProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.level = data.level || 1;
            this.exp = data.exp || 0;
            this.currentHP = data.currentHP || 100;
            this.equipment = data.equipment || [];
        }
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

// ===== 遊戲管理器 =====
class GameManager {
    constructor() {
        this.character = new Character();
        this.currentStage = null;
        this.achievementsList = [];
        this.init();
    }

    init() {
        this.updateUI();
        this.showStart();
    }

    // ===== 畫面切換 =====
    showStart() {
        this.hideAllScreens();
        document.getElementById('startScreen').classList.add('active');
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

        if (isCorrect) {
            this.showFeedback('✅ 答對了！', true);
            const newEquipment = this.character.addExp(20);

            // 檢查是否升級
            if (newEquipment.length > 0) {
                setTimeout(() => this.showLevelUpModal(newEquipment), 500);
            }
        } else {
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
        const modal = document.getElementById('levelUpModal');
        document.getElementById('newLevel').textContent = this.character.level;

        const display = document.getElementById('newEquipmentDisplay');
        display.innerHTML = newEquipment.map(eq => `
            <div class="equipment-reward">${eq.icon}</div>
            <div class="equipment-name">獲得：${eq.name}</div>
        `).join('');

        modal.classList.add('show');
        this.updateGameUI();
    }

    closeLevelUpModal() {
        document.getElementById('levelUpModal').classList.remove('show');
        document.getElementById('answerInput').focus();
    }

    showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        const stats = document.getElementById('victoryStats');

        stats.innerHTML = `
            <p>✅ 答對題數：${this.currentStage.correctAnswers}/${this.currentStage.totalQuestions}</p>
            <p>❤️ 剩餘血量：${this.character.currentHP}/${this.character.maxHP}</p>
            <p>⭐ 當前等級：${this.character.level}</p>
        `;

        modal.classList.add('show');
    }

    showDefeatModal() {
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

    updateUI() {
        this.updateGameUI();
    }
}

// ===== 遊戲啟動 =====
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new GameManager();
});
