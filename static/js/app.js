/**
 * Biolume Noir - Core Application Logic
 */

const App = {
    elements: {
        authForm: document.getElementById('authForm'),
        submitBtn: document.getElementById('submitBtn'),
        responseSection: document.getElementById('responseSection'),
        jsonOutput: document.getElementById('jsonOutput'),
        resetBtn: document.getElementById('resetBtn'),
        navTabs: document.getElementById('navTabs'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        copyButtons: document.querySelectorAll('.copy-token')
    },

    state: {
        isSubmitting: false
    },

    init() {
        this.preventAutofill();
        this.bindEvents();
        this.initTabs();
        this.initCopyButtons();
        this.initGsap();
    },

    /**
     * Prevent Autofill
     */
    preventAutofill() {
        // Remove readonly after a short delay to prevent autofill
        setTimeout(() => {
            const uidInput = document.getElementById('uid');
            const apiKeyInput = document.getElementById('apiKey');
            const passwordInput = document.getElementById('password');
            if (apiKeyInput && apiKeyInput.hasAttribute('readonly')) {
                apiKeyInput.removeAttribute('readonly');
            }
            if (uidInput && uidInput.hasAttribute('readonly')) {
                uidInput.removeAttribute('readonly');
            }
            if (passwordInput && passwordInput.hasAttribute('readonly')) {
                passwordInput.removeAttribute('readonly');
            }
        }, 100);
    },

    bindEvents() {
        this.elements.authForm.addEventListener('submit', (e) => this.handleSubmit(e));
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        }
    },

    /**
     * Tab Navigation
     */
    initTabs() {
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    },

    switchTab(targetTab) {
        const currentBtn = document.querySelector('.tab-btn.active');
        const currentContent = document.querySelector('.tab-content.active');
        const nextContent = document.getElementById(`${targetTab}-tab`);
        const nextBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);

        if (currentBtn) {
            currentBtn.classList.remove('active');
        }

        if (nextBtn) {
            nextBtn.classList.add('active');
        }

        if (!nextContent || currentContent === nextContent) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const activateNext = () => {
            this.elements.tabContents.forEach(content => {
                if (content === nextContent) {
                    content.classList.remove('hidden');
                    content.classList.add('active');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('active');
                }
            });
        };

        if (window.gsap && !reducedMotion && currentContent) {
            gsap.to(currentContent, {
                opacity: 0,
                y: 18,
                duration: 0.18,
                ease: 'power2.out',
                onComplete: () => {
                    activateNext();
                    gsap.fromTo(nextContent, { opacity: 0, y: 18 }, {
                        opacity: 1,
                        y: 0,
                        duration: 0.42,
                        ease: 'power3.out'
                    });
                }
            });
            return;
        }

        activateNext();
    },

    initGsap() {
        if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        gsap.set(['.brand', '.meta-info', '.nav-tabs', '.card', '.footer'], { opacity: 0, y: 24 });
        gsap.set('.tab-content.active', { opacity: 0, y: 18 });

        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

        intro
            .to('.brand', { opacity: 1, y: 0, duration: 0.75 })
            .to('.meta-info', { opacity: 1, y: 0, duration: 0.55 }, '<0.1')
            .to('.nav-tabs', { opacity: 1, y: 0, duration: 0.55 }, '<0.1')
            .to('.card', { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '<0.05')
            .to('.footer', { opacity: 1, y: 0, duration: 0.45 }, '<0.05')
            .to('.tab-content.active', { opacity: 1, y: 0, duration: 0.45 }, '<0.05');

        document.querySelectorAll('.card, .btn, .tab-btn').forEach((element) => {
            element.addEventListener('mouseenter', () => {
                gsap.to(element, {
                    scale: element.classList.contains('btn') ? 1.02 : 1.01,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    scale: 1,
                    duration: 0.24,
                    ease: 'power2.out'
                });
            });
        });
    },

    /**
     * Form Submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        if (this.state.isSubmitting) return;

        const apiKey = document.getElementById('apiKey').value.trim();
        const uid = document.getElementById('uid').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!apiKey) {
            this.showError('API key required');
            return;
        }

        if (!uid || !password) {
            this.showError('Identification sequence incomplete');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch(`/v1/auth/${encodeURIComponent(apiKey)}?uid=${encodeURIComponent(uid)}&password=${encodeURIComponent(password)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication sequence failed');
            }

            this.showSuccess(data);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    },

    setLoading(isLoading) {
        this.state.isSubmitting = isLoading;
        const btn = this.elements.submitBtn;
        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    },

    /**
     * Response Display
     */
    showSuccess(data) {
        const { responseSection, jsonOutput } = this.elements;

        // Update UI
        responseSection.querySelector('.response-title').textContent = 'Sequence Complete';
        responseSection.querySelector('.response-message').textContent = 'Token generated successfully';
        responseSection.querySelector('.response-icon').style.color = 'var(--primary)';

        // Format JSON
        const formatted = JSON.stringify(data, null, 2);
        jsonOutput.innerHTML = this.syntaxHighlight(formatted);
        jsonOutput.dataset.raw = formatted;

        // Show section
        responseSection.style.display = 'block';

        if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.fromTo(responseSection, { opacity: 0, y: 40, scale: 0.8 }, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.5)'
            });
        }

        responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    showError(message) {
        const { responseSection, jsonOutput } = this.elements;

        responseSection.querySelector('.response-title').textContent = 'Sequence Interrupted';
        responseSection.querySelector('.response-message').textContent = message;
        responseSection.querySelector('.response-icon').style.color = '#ff4d4d';

        const errorData = {
            status: 'error',
            message: message,
            timestamp: new Date().toISOString()
        };

        const formatted = JSON.stringify(errorData, null, 2);
        jsonOutput.innerHTML = this.syntaxHighlight(formatted);
        jsonOutput.dataset.raw = formatted;

        responseSection.style.display = 'block';

        if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.fromTo(responseSection, { opacity: 0, y: 40, scale: 0.8 }, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.5)'
            });
        }

        responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    handleReset() {
        this.elements.responseSection.style.display = 'none';
        this.elements.authForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Copy Functionality
     */
    initCopyButtons() {
        this.elements.copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.token;
                const rawData = this.elements.jsonOutput.dataset.raw;
                if (!rawData) return;

                try {
                    const data = JSON.parse(rawData);
                    const value = data[type];
                    if (value) {
                        this.copyToClipboard(value, btn);
                    }
                } catch (e) {
                    console.error('Copy failed', e);
                }
            });
        });
    },

    async copyToClipboard(text, btn) {
        const onSuccess = () => {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="icon-check"></i><span>Copied</span>';
            btn.style.borderColor = 'var(--primary)';

            this.showToast('Copied to clipboard!', 'success');

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.style.borderColor = '';
            }, 2000);
        };

        const onError = (err) => {
            console.error('Clipboard error', err);
            this.showToast('Failed to copy', 'error');
        };

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                onSuccess();
            } else {
                // Fallback for non-HTTPS or missing clipboard API
                const textArea = document.createElement("textarea");
                textArea.value = text;
                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    const successful = document.execCommand('copy');
                    if (successful) onSuccess();
                    else onError(new Error('Fallback copy failed'));
                } catch (err) {
                    onError(err);
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            onError(err);
        }
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-popup ${type} show`;
        
        const icon = type === 'success' ? '✨' : '😅';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        
        document.body.appendChild(toast);
        
        // Custom bouncing popup
        if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.fromTo(toast, 
                { y: 100, opacity: 0, scale: 0.8, xPercent: -50, left: '50%' }, 
                { y: 0, opacity: 1, scale: 1, xPercent: -50, left: '50%', duration: 0.7, ease: 'elastic.out(1, 0.5)' }
            );

            setTimeout(() => {
                gsap.to(toast, {
                    y: 100, opacity: 0, scale: 0.8, xPercent: -50, left: '50%', duration: 0.4, ease: 'power2.in',
                    onComplete: () => toast.remove()
                });
            }, 3000);
        } else {
            // Fallback
            toast.style.transform = 'translate(-50%, 0) scale(1)';
            toast.style.opacity = '1';
            setTimeout(() => {
                toast.style.transform = 'translate(-50%, 150px) scale(0.8)';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }
    },

    /**
     * JSON Syntax Highlighting
     */
    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
