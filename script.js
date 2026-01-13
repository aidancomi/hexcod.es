// State management
let currentColor = '#000000';
let isFullscreen = false;

// DOM elements
const colorDisplay = document.getElementById('color-display');
const colorPicker = document.getElementById('color-picker');
const hexInput = document.getElementById('hex-input');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const toast = document.getElementById('toast');

// Initialize
function init() {
    // Parse URL on load
    const urlHex = parseHexFromURL();
    if (urlHex) {
        setColor(urlHex);
    } else {
        // Default to black if no hex in URL
        setColor('#000000');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
    
    // Handle hash changes (for URLs like hexcod.es/#000000)
    window.addEventListener('hashchange', () => {
        const urlHex = parseHexFromURL();
        if (urlHex) {
            setColor(urlHex);
        }
    });
    
    // Handle query parameters
    handleQueryParameters();
}

// Parse hex code from URL pathname or hash
function parseHexFromURL() {
    // Check hash first (e.g., hexcod.es/#000000)
    let hex = window.location.hash.slice(1).toLowerCase();
    
    // If no hash, check pathname (e.g., hexcod.es/000000)
    if (!hex) {
        const pathname = window.location.pathname;
        hex = pathname.slice(1).toLowerCase();
    }
    
    if (!hex) {
        return null;
    }
    
    // Remove # if present (shouldn't happen, but just in case)
    hex = hex.replace(/^#/, '');
    
    // Validate and normalize hex
    return normalizeHex(hex);
}

// Normalize hex code (3-digit to 6-digit, add #)
function normalizeHex(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Validate hex format
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) {
        return null;
    }
    
    // Convert 3-digit to 6-digit
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    return '#' + hex;
}

// Set color and update UI
function setColor(hex) {
    if (!hex || !normalizeHex(hex.replace(/^#/, ''))) {
        showToast('Invalid hex code');
        return;
    }
    
    const normalized = normalizeHex(hex.replace(/^#/, ''));
    currentColor = normalized;
    
    // Update background
    colorDisplay.style.backgroundColor = normalized;
    
    // Update color picker
    colorPicker.value = normalized;
    
    // Update hex input (without #)
    hexInput.value = normalized.slice(1).toUpperCase();
    
    // Update URL without reload (preserve query parameters)
    const hexWithoutHash = normalized.slice(1);
    const newPath = '/' + hexWithoutHash;
    const params = new URLSearchParams(window.location.search);
    const queryString = params.toString() ? '?' + params.toString() : '';
    const hash = window.location.hash;
    const newURL = newPath + queryString + hash;
    
    if (window.location.pathname + window.location.search + window.location.hash !== newURL) {
        window.history.pushState({ color: normalized }, '', newURL);
    }
    
    // Update control styling based on color brightness
    updateControlStyling(normalized);
}

// Check if color is light (for UI contrast)
function isLightColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// Update control styling based on background color
function updateControlStyling(hex) {
    if (isLightColor(hex)) {
        colorDisplay.setAttribute('data-is-light', 'true');
    } else {
        colorDisplay.setAttribute('data-is-light', 'false');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Color picker change
    colorPicker.addEventListener('input', (e) => {
        setColor(e.target.value);
    });
    
    // Hex input (allow manual entry and typing)
    hexInput.addEventListener('input', (e) => {
        // Allow typing hex codes
        let value = e.target.value.trim();
        // Remove # if user types it (we'll add it back)
        value = value.replace(/^#/, '');
        
        // Limit to 6 characters for hex code
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        
        // Only allow hex characters
        value = value.replace(/[^0-9a-f]/gi, '');
        
        // Update input value (without #)
        if (e.target.value !== value) {
            e.target.value = value;
        }
    });
    
    // Handle Enter key to apply color
    hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.target.value.trim();
            if (value) {
                setColor(value);
            }
        }
    });
    
    // Handle paste event
    hexInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
        // Remove # if present in pasted text
        const cleaned = pastedText.replace(/^#/, '');
        if (cleaned) {
            hexInput.value = cleaned.replace(/[^0-9a-f]/gi, '').slice(0, 6);
            setColor(cleaned);
        }
    });
    
    // Handle blur to apply color when user leaves input
    hexInput.addEventListener('blur', (e) => {
        const value = e.target.value.trim();
        if (value) {
            setColor(value);
        } else {
            // Restore current color if input is empty
            hexInput.value = currentColor.slice(1).toUpperCase();
        }
    });
    
    // Copy button
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Download button
    downloadBtn.addEventListener('click', downloadColor);
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Handle keyboard shortcuts
function handleKeyboard(e) {
    // F key for fullscreen
    if (e.key === 'f' || e.key === 'F') {
        if (!e.target.matches('input')) {
            e.preventDefault();
            toggleFullscreen();
        }
    }
    
    // Escape to exit fullscreen
    if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
    }
}

// Copy hex code to clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(currentColor);
        showToast('Copied to clipboard!');
        
        // Visual feedback on button
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentColor;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!');
        } catch (fallbackErr) {
            showToast('Failed to copy');
        }
        document.body.removeChild(textArea);
    }
}

// Download color as PNG image
function downloadColor() {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    // Fill with color
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const hexWithoutHash = currentColor.slice(1);
        a.download = `hex-${hexWithoutHash}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Download started!');
    }, 'image/png');
}

// Toggle fullscreen mode
function toggleFullscreen() {
    if (isFullscreen) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// Enter fullscreen
function enterFullscreen(addToURL = false) {
    document.body.classList.add('fullscreen');
    isFullscreen = true;
    fullscreenBtn.setAttribute('aria-label', 'Exit fullscreen mode');
    
    // Try native fullscreen API
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
            // Ignore errors (user might have denied)
        });
    }
    
    // Only update URL if explicitly requested (e.g., from query parameter)
    if (addToURL) {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('fullscreen')) {
            params.set('fullscreen', '');
            updateURLWithParams(params);
        }
    }
}

// Exit fullscreen
function exitFullscreen() {
    document.body.classList.remove('fullscreen');
    isFullscreen = false;
    fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen mode');
    
    // Exit native fullscreen if active
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
            // Ignore errors
        });
    }
    
    // Remove fullscreen parameter from URL
    removeQueryParameter('fullscreen');
}

// Update URL with query parameters while preserving pathname and hash
function updateURLWithParams(params) {
    const url = new URL(window.location);
    // Preserve pathname and hash, update search params
    const newURL = url.pathname + (params.toString() ? '?' + params.toString() : '') + url.hash;
    window.history.replaceState({}, '', newURL);
}

// Handle browser back/forward
function handlePopState(e) {
    const urlHex = parseHexFromURL();
    if (urlHex) {
        setColor(urlHex);
    }
    // Re-check query parameters on navigation
    handleQueryParameters();
}

// Parse and handle query parameters
function handleQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    
    // Handle fullscreen parameter
    if (params.has('fullscreen')) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            enterFullscreen(true);
            // Keep parameter in URL to reflect fullscreen state
        }, 100);
    }
    
    // Handle download parameter
    if (params.has('download')) {
        // Small delay to ensure color is set
        setTimeout(() => {
            downloadColor();
            // Remove parameter from URL after download
            removeQueryParameter('download');
        }, 100);
    }
}

// Remove query parameter from URL
function removeQueryParameter(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

// Show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Handle native fullscreen changes
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isFullscreen) {
        exitFullscreen();
    }
});

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
