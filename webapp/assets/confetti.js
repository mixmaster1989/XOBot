/**
 * Confetti Animation
 * Анимация конфетти с сердечками для экрана победы
 */

let confettiAnimationId = null;
let particles = [];

class ConfettiParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 15 + 10;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.opacity = 1;
        this.type = Math.random() > 0.5 ? 'heart' : 'star';
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        const colors = [
            '#FFB6D9', // Pink
            '#E0A8D8', // Pink dark
            '#D4B5E8', // Lavender
            '#C9A8DB', // Lavender dark
            '#E8D4F8', // Purple soft
            '#FFE5F1'  // Pink light
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        // Gravity effect
        this.speedY += 0.1;

        // Fade out at bottom
        if (this.y > this.canvas.height - 100) {
            this.opacity -= 0.02;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        if (this.type === 'heart') {
            this.drawHeart(ctx);
        } else {
            this.drawStar(ctx);
        }

        ctx.restore();
    }

    drawHeart(ctx) {
        const size = this.size;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        // Left curve
        ctx.bezierCurveTo(
            -size * 0.5, -size * 0.2,
            -size * 0.5, size * 0.2,
            0, size * 0.7
        );

        // Right curve
        ctx.bezierCurveTo(
            size * 0.5, size * 0.2,
            size * 0.5, -size * 0.2,
            0, size * 0.3
        );

        ctx.fill();
    }

    drawStar(ctx) {
        const size = this.size;
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    isDead() {
        return this.y > this.canvas.height || this.opacity <= 0;
    }
}

function animateConfetti() {
    const canvas = elements.confettiCanvas;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add new particles
    if (particles.length < 50 && Math.random() > 0.7) {
        particles.push(new ConfettiParticle(canvas));
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);

        // Remove dead particles
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Continue animation
    if (particles.length > 0) {
        confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
        confettiAnimationId = null;
    }
}

function startConfetti() {
    // Reset particles
    particles = [];

    // Create initial burst
    const canvas = elements.confettiCanvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    for (let i = 0; i < 30; i++) {
        particles.push(new ConfettiParticle(canvas));
    }

    // Start animation
    if (!confettiAnimationId) {
        animateConfetti();
    }
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    particles = [];
}
