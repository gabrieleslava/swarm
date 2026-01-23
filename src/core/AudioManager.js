
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.3;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playShoot() {
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit() {
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playLevelUp() {
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.value = this.volume;

        // Arpeggio
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.connect(gain);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });

        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    }

    playStart() {
        if (this.muted || !this.ctx) return;
        // Low hum
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}
