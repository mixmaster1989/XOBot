/**
 * Sound Manager - Генерация звуков через Web Audio API
 * Нежные звуки для женской аудитории
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            // Создаем AudioContext при ЛЮБОМ взаимодействии пользователя
            const initAudio = () => {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('AudioContext created via user interaction');
                }
            };

            // Слушаем все возможные события для инициализации
            ['click', 'touchstart', 'touchend', 'keydown'].forEach(event => {
                window.addEventListener(event, initAudio, { once: true });
            });

            // Загружаем настройку из localStorage
            const savedSetting = localStorage.getItem('xobot_sound_enabled');
            this.enabled = savedSetting !== 'false';
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * Воспроизвести ноту
     */
    async playNote(frequency, duration, type = 'sine', volume = 0.3) {
        console.log('playNote called:', { frequency, duration, type, volume, enabled: this.enabled, hasAudioContext: !!this.audioContext });

        if (!this.enabled || !this.audioContext) {
            console.log('playNote aborted: enabled=', this.enabled, 'audioContext=', !!this.audioContext);
            return;
        }

        // КРИТИЧНО для Telegram WebView: Resume если suspended
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('✅ AudioContext resumed from suspended state');
            } catch (e) {
                console.error('❌ Cannot resume AudioContext:', e);
                return;
            }
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

            console.log('🔊 Sound played successfully!');
        } catch (e) {
            console.error('Error playing sound:', e);
        }
    }

    /**
     * Звук клика по клетке (нежный тик)
     */
    playClick() {
        if (!this.enabled) {
            return;
        }

        // Создаем AudioContext если его нет (для первого клика)
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('AudioContext created on click');
            } catch (e) {
                console.error('Failed to create AudioContext:', e);
                return;
            }
        }

        // Мягкий клик - высокая нота, ГРОМЧЕ и ДОЛЬШЕ
        this.playNote(800, 0.15, 'sine', 0.5);
    }

    /**
     * Звук победы (радостная мелодия)
     */
    async playWin() {
        console.log('playWin called');
        if (!this.enabled) return;

        // Создаем AudioContext если его нет
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('Failed to create AudioContext:', e);
                return;
            }
        }

        const now = this.audioContext.currentTime;

        // Восходящая мелодия C-E-G-C (ГРОМЧЕ!)
        await this.playNoteAt(523.25, 0.2, now, 0.5);         // C5
        await this.playNoteAt(659.25, 0.2, now + 0.2, 0.5);   // E5
        await this.playNoteAt(783.99, 0.2, now + 0.4, 0.5);   // G5
        await this.playNoteAt(1046.50, 0.5, now + 0.6, 0.6);  // C6
    }

    /**
     * Звук проигрыша (мягкий, утешительный)
     */
    playLose() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Нисходящая мелодия G-E-C
        this.playNoteAt(783.99, 0.2, now, 0.2);      // G5
        this.playNoteAt(659.25, 0.2, now + 0.2, 0.2); // E5
        this.playNoteAt(523.25, 0.4, now + 0.4, 0.2); // C5
    }

    /**
     * Звук ничьи (нейтральный)
     */
    playDraw() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Простая последовательность E-E
        this.playNoteAt(659.25, 0.2, now, 0.2);
        this.playNoteAt(659.25, 0.2, now + 0.25, 0.2);
    }

    /**
     * Воспроизвести ноту в определенное время
     */
    async playNoteAt(frequency, duration, startTime, volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;

        // Resume если suspended
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.error('Cannot resume AudioContext:', e);
                return;
            }
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startTime);

            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        } catch (e) {
            console.log('Error playing note:', e);
        }
    }

    /**
     * Включить/выключить звук
     */
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('xobot_sound_enabled', this.enabled);

        // Воспроизводим звук подтверждения
        if (this.enabled) {
            this.playClick();
        }

        return this.enabled;
    }

    /**
     * Проверить включен ли звук
     */
    isEnabled() {
        return this.enabled;
    }
}

// Экспортируем глобальный экземпляр
window.soundManager = new SoundManager();
