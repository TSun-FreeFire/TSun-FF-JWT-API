// ========================================
// FreeFire JWT API - Client Application
// ========================================

// === DOM Elements ===
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const responseSection = document.getElementById('responseSection');
const statsGrid = document.getElementById('statsGrid');
const jsonOutput = document.getElementById('jsonOutput');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const responseCard = document.querySelector('.response-card');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// === Popup Elements ===
let popupTimeout = null;

// === Show Popup ===
function showPopup(message, type = 'info') {
    // Create popup element if it doesn't exist
    let popup = document.getElementById('popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'popup';
        popup.className = 'popup';
        document.body.appendChild(popup);
    }

    // Set popup content
    popup.innerHTML = `
        <div class="popup-content ${type}">
            <i class="popup-icon ${getPopupIcon(type)}"></i>
            <span class="popup-message">${message}</span>
        </div>
    `;

    // Show popup
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';

    // Clear previous timeout if it exists
    if (popupTimeout) {
        clearTimeout(popupTimeout);
    }

    // Hide popup after 3 seconds
    popupTimeout = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.visibility = 'hidden';
    }, 3000);
}

// === Get Popup Icon ===
function getPopupIcon(type) {
    switch (type) {
        case 'success': return 'icon-check-circle';
        case 'error': return 'icon-alert-circle';
        case 'loading': return 'icon-loader';
        default: return 'icon-info';
    }
}

// === Tab Navigation ===
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show target content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${targetTab}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

// === Form Submission ===
let isSubmitting = false;
const DEFAULT_API_KEY = 'saeed'; // Default API key

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    // Get form values
    const uid = document.getElementById('uid').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate
    if (!uid || !password) {
        showError('All fields are required');
        return;
    }

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    responseSection.style.display = 'none';
    isSubmitting = true;

    // Show loading popup
    showPopup('Fetching token...', 'loading');

    try {
        // API Call with default API key
        const response = await fetch(`/v1/auth/${DEFAULT_API_KEY}?uid=${uid}&password=${password}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
        }

        // Show success
        showSuccess(data);

    } catch (error) {
        showError(error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        isSubmitting = false;
    }
});

// === Show Success ===
function showSuccess(data) {
    // Update response card
    responseCard.classList.remove('error');
    responseCard.querySelector('.response-icon').className = 'response-icon icon-circle-check';
    responseCard.querySelector('.response-title').textContent = 'Success';
    responseCard.querySelector('.response-message').textContent = 'Token generated successfully';

    // Set token values with null checks
    const accessTokenElement = document.getElementById('accessToken');
    if (accessTokenElement) {
        accessTokenElement.textContent = data.accessToken || 'N/A';
    }

    const accountIdElement = document.getElementById('accountId');
    if (accountIdElement) {
        accountIdElement.textContent = data.accountId || 'N/A';
    }

    const tokenElement = document.getElementById('token');
    if (tokenElement) {
        tokenElement.textContent = data.token || 'N/A';
    }

    // Build stats
    const stats = [
        { label: 'IP Region', value: data.ipRegion || 'N/A' },
        { label: 'Lock Region', value: data.lockRegion || 'N/A' },
        { label: 'Environment', value: data.agoraEnvironment || 'N/A' }
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
        </div>
    `).join('');

    // Format JSON response
    const formatted = JSON.stringify(data, null, 2);
    jsonOutput.innerHTML = syntaxHighlight(formatted);
    jsonOutput.dataset.raw = formatted;

    // Show section
    responseSection.style.display = 'block';
    responseSection.scrollIntoView({ behavior: 'auto', block: 'nearest' });
}

// === Copy Access Token ===
function copyAccessToken() {
    // Get the JSON output from the response section
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput) return;

    // Parse the JSON data
    const jsonData = jsonOutput.dataset.raw;
    if (!jsonData) return;

    try {
        const data = JSON.parse(jsonData);
        const accessToken = data.accessToken;

        if (!accessToken) {
            showPopup('No access token available', 'error');
            return;
        }

        navigator.clipboard.writeText(accessToken).then(() => {
            // Visual feedback
            const copyBtn = document.querySelector('.copy-token[data-token="accessToken"]');
            if (!copyBtn) return;

            const icon = copyBtn.querySelector('i');
            const originalClass = icon.className;

            copyBtn.classList.add('copied');
            icon.className = 'icon-check';

            // Show success popup
            showPopup('Access token copied!', 'success');

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                icon.className = originalClass;
            }, 2000);
        }).catch(error => {
            console.error('Copy failed:', error);
            showPopup('Failed to copy access token', 'error');
        });
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        showPopup('Failed to parse token data', 'error');
    }
}

// === Copy Token ===
function copyToken() {
    // Get the JSON output from the response section
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput) return;

    // Parse the JSON data
    const jsonData = jsonOutput.dataset.raw;
    if (!jsonData) return;

    try {
        const data = JSON.parse(jsonData);
        const token = data.token;

        if (!token) {
            showPopup('No token available', 'error');
            return;
        }

        navigator.clipboard.writeText(token).then(() => {
            // Visual feedback
            const copyBtn = document.querySelector('.copy-token[data-token="token"]');
            if (!copyBtn) return;

            const icon = copyBtn.querySelector('i');
            const originalClass = icon.className;

            copyBtn.classList.add('copied');
            icon.className = 'icon-check';

            // Show success popup
            showPopup('Token copied!', 'success');

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                icon.className = originalClass;
            }, 2000);
        }).catch(error => {
            console.error('Copy failed:', error);
            showPopup('Failed to copy token', 'error');
        });
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        showPopup('Failed to parse token data', 'error');
    }
}

// === Initialize Copy Buttons and Handle Auto-fill ===
document.addEventListener('DOMContentLoaded', () => {
    // Throttle scroll events for better performance
    let isScrolling;
    window.addEventListener('scroll', () => {
        clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            // Add any scroll-related logic here
        }, 100);
    }, false);

    // Lazy load images
    const lazyImages = document.querySelectorAll('img.lazy');
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => lazyImageObserver.observe(img));

    // Add event listeners to copy buttons
    const copyAccessTokenBtn = document.querySelector('.copy-token[data-token="accessToken"]');
    if (copyAccessTokenBtn) {
        copyAccessTokenBtn.addEventListener('click', copyAccessToken);
    }

    const copyTokenBtn = document.querySelector('.copy-token[data-token="token"]');
    if (copyTokenBtn) {
        copyTokenBtn.addEventListener('click', copyToken);
    }

    // Remove the old copy button event listener
    const oldCopyBtn = document.getElementById('copyBtn');
    if (oldCopyBtn) {
        oldCopyBtn.removeEventListener('click', copyToken);
    }

    // Handle auto-fill behavior
    const apiKeyInput = document.getElementById('apiKey');
    const uidInput = document.getElementById('uid');
    const passwordInput = document.getElementById('password');

    // Clear auto-filled values
    if (apiKeyInput && apiKeyInput.value) {
        apiKeyInput.value = '';
    }

    if (uidInput && uidInput.value) {
        uidInput.value = '';
    }

    // Set proper attributes to prevent auto-fill
    if (apiKeyInput) {
        apiKeyInput.setAttribute('autocomplete', 'new-password');
    }

    if (uidInput) {
        uidInput.setAttribute('autocomplete', 'new-password');
    }

    if (passwordInput) {
        passwordInput.setAttribute('autocomplete', 'new-password');
    }
});

// === Show Error ===
function showError(message) {
    // Update response card
    responseCard.classList.add('error');
    responseCard.querySelector('.response-icon').className = 'response-icon icon-alert-circle';
    responseCard.querySelector('.response-title').textContent = 'Error';
    responseCard.querySelector('.response-message').textContent = message;

    // Clear stats
    statsGrid.innerHTML = '';

    // Show error JSON
    const errorData = {
        error: message,
        timestamp: new Date().toISOString()
    };
    const formatted = JSON.stringify(errorData, null, 2);
    jsonOutput.innerHTML = syntaxHighlight(formatted);
    jsonOutput.dataset.raw = formatted;

    // Show section
    responseSection.style.display = 'block';
    responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// === JSON Syntax Highlighting ===
function syntaxHighlight(json) {
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

// === Copy to Clipboard (JSON) ===
copyBtn.addEventListener('click', async () => {
    const raw = jsonOutput.dataset.raw;
    if (!raw) return;

    try {
        await navigator.clipboard.writeText(raw);

        // Visual feedback
        const icon = copyBtn.querySelector('i');
        const originalClass = icon.className;

        copyBtn.classList.add('copied');
        icon.className = 'icon-check';

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            icon.className = originalClass;
        }, 2000);

    } catch (error) {
        console.error('Copy failed:', error);
    }
});

// === Reset Form ===
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        responseSection.style.display = 'none';
        authForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// === Performance Optimizations ===
document.addEventListener('DOMContentLoaded', () => {
    // Throttle scroll events for better performance
    let isScrolling;
    window.addEventListener('scroll', () => {
        clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            // Add any scroll-related logic here
        }, 100);
    }, false);

    // Lazy load images
    const lazyImages = document.querySelectorAll('img.lazy');
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => lazyImageObserver.observe(img));
});

// === Form Submission ===
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const apiKey = document.getElementById('apiKey').value.trim();
    const uid = document.getElementById('uid').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate
    if (!apiKey || !uid || !password) {
        showError('All fields are required');
        return;
    }

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    responseSection.style.display = 'none';

    try {
        // API Call
        const response = await fetch(`/v1/auth/${apiKey}?uid=${uid}&password=${password}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
        }

        // Show success
        showSuccess(data);

    } catch (error) {
        showError(error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
