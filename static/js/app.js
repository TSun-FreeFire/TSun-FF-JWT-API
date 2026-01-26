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
        isSubmitting: false,
        defaultApiKey: 'saeed'
    },

    init() {
        this.preventAutofill();
        this.bindEvents();
        this.initTabs();
        this.initCopyButtons();
    },

    /**
     * Prevent Autofill
     */
    preventAutofill() {
        // Remove readonly after a short delay to prevent autofill
        setTimeout(() => {
            const uidInput = document.getElementById('uid');
            const passwordInput = document.getElementById('password');
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
                const targetTab = btn.dataset.tab;

                // Update active states
                this.elements.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show target content
                this.elements.tabContents.forEach(content => {
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.remove('hidden');
                        content.classList.add('active');
                    } else {
                        content.classList.add('hidden');
                        content.classList.remove('active');
                    }
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

        const uid = document.getElementById('uid').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!uid || !password) {
            this.showError('Identification sequence incomplete');
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch(`/v1/auth/${this.state.defaultApiKey}?uid=${uid}&password=${password}`);
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
        responseSection.querySelector('.response-icon').style.color = 'var(--accent-biolume)';

        // Format JSON
        const formatted = JSON.stringify(data, null, 2);
        jsonOutput.innerHTML = this.syntaxHighlight(formatted);
        jsonOutput.dataset.raw = formatted;

        // Show section
        responseSection.style.display = 'block';
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
        try {
            await navigator.clipboard.writeText(text);
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="icon-check"></i><span>Copied</span>';
            btn.style.borderColor = 'var(--accent-biolume)';

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.style.borderColor = '';
            }, 2000);
        } catch (err) {
            console.error('Clipboard error', err);
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
