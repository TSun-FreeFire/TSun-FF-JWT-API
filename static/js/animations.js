/**
 * Biolume Noir - Animation Engine
 */

const Animations = {
    mouseTrail: {
        lastX: 0,
        lastY: 0,
        throttle: 0,
        active: false
    },

    init() {
        this.initNavIndicator();
        this.initParticles();
        this.initCursorTrail();
        this.initReducedMotion();
    },

    /**
     * Navigation "Vein" Indicator
     */
    initNavIndicator() {
        const navTabs = document.getElementById('navTabs');
        const indicator = document.getElementById('navIndicator');
        const activeBtn = navTabs.querySelector('.tab-btn.active');

        if (!navTabs || !indicator) return;

        const updateIndicator = (btn) => {
            const rect = btn.getBoundingClientRect();
            const navRect = navTabs.getBoundingClientRect();

            indicator.style.width = `${rect.width}px`;
            indicator.style.left = `${rect.left - navRect.left}px`;
        };

        // Initial position
        if (activeBtn) updateIndicator(activeBtn);

        // Update on click
        navTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (btn) updateIndicator(btn);
        });

        // Update on resize
        window.addEventListener('resize', () => {
            const currentActive = navTabs.querySelector('.tab-btn.active');
            if (currentActive) updateIndicator(currentActive);
        });
    },

    /**
     * Particle Emission on Click
     */
    initParticles() {
        document.addEventListener('click', (e) => {
            // Don't trigger on buttons or interactive elements to keep it "scarce"
            if (e.target.closest('button, input, a')) return;

            this.createParticleBurst(e.clientX, e.clientY, 8);
        });
    },

    /**
     * Cursor Trail Effect
     */
    initCursorTrail() {
        let lastTime = 0;
        const throttleDelay = 30; // milliseconds between particles

        document.addEventListener('mousemove', (e) => {
            const currentTime = Date.now();
            
            // Throttle particle creation
            if (currentTime - lastTime < throttleDelay) return;
            lastTime = currentTime;

            // Calculate distance moved
            const dx = e.clientX - this.mouseTrail.lastX;
            const dy = e.clientY - this.mouseTrail.lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only create particles if mouse is moving
            if (distance > 5) {
                this.createTrailParticle(e.clientX, e.clientY);
                this.mouseTrail.lastX = e.clientX;
                this.mouseTrail.lastY = e.clientY;
            }
        });
    },

    createTrailParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'trail-particle';

        const size = Math.random() * 3 + 1;
        const hue = Math.random() > 0.5 ? 167 : 28; // Biolume green or Copper
        const opacity = Math.random() * 0.4 + 0.3;

        Object.assign(particle.style, {
            position: 'fixed',
            top: `${y}px`,
            left: `${x}px`,
            width: `${size}px`,
            height: `${size}px`,
            background: `hsl(${hue}, 100%, 65%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: '9998',
            opacity: opacity,
            boxShadow: `0 0 ${size * 3}px hsl(${hue}, 100%, 65%)`
        });

        document.body.appendChild(particle);

        const animation = particle.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: opacity 
            },
            { 
                transform: 'translate(-50%, -50%) scale(0)',
                opacity: 0 
            }
        ], {
            duration: 600,
            easing: 'ease-out'
        });

        animation.onfinish = () => particle.remove();
    },

    createParticleBurst(x, y, count = 6) {
        const container = document.body;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'click-particle';

            const size = Math.random() * 5 + 3;
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const velocity = Math.random() * 80 + 60;
            const destinationX = Math.cos(angle) * velocity;
            const destinationY = Math.sin(angle) * velocity;
            const rotation = Math.random() * 360;
            const delay = Math.random() * 0.15;
            const hue = Math.random() > 0.3 ? 167 : 28; // Mostly biolume, occasionally copper

            Object.assign(particle.style, {
                position: 'fixed',
                top: `${y}px`,
                left: `${x}px`,
                width: `${size}px`,
                height: `${size}px`,
                background: `hsl(${hue}, 100%, 65%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: '10000',
                opacity: '0.9',
                boxShadow: `0 0 15px hsl(${hue}, 100%, 65%)`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`
            });

            container.appendChild(particle);

            const animation = particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1)', 
                    opacity: 0.9 
                },
                { 
                    transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                delay: delay * 1000
            });

            animation.onfinish = () => particle.remove();
        }
    },

    /**
     * Reduced Motion Support
     */
    initReducedMotion() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleMotionChange = (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        };

        mediaQuery.addEventListener('change', handleMotionChange);
        handleMotionChange(mediaQuery);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Animations.init());
