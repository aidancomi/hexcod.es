// State management
let currentColor = '#000000';
let isFullscreen = false;

// Cookie utilities
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Generate random hex color
function generateRandomColor() {
    const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return '#' + hex;
}

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
        // Check for saved color in cookie
        const savedColor = getCookie('lastColor');
        if (savedColor && normalizeHex(savedColor.replace(/^#/, ''))) {
            setColor(savedColor);
        } else {
            // Generate random color if no cookie
            const randomColor = generateRandomColor();
            setColor(randomColor);
        }
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
    const pathnameHex = window.location.pathname.slice(1).toLowerCase();
    const hashHex = window.location.hash.slice(1).toLowerCase();

    // Try pathname first
    const normalizedPath = normalizeHex(pathnameHex);
    if (normalizedPath) {
        return normalizedPath;
    }

    // Fallback to hash
    const normalizedHash = normalizeHex(hashHex);
    if (normalizedHash) {
        return normalizedHash;
    }

    return null;
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
    
    // Update URL without reload (preserve query parameters, drop hash color)
    const hexWithoutHash = normalized.slice(1);
    const newPath = '/' + hexWithoutHash;
    const params = new URLSearchParams(window.location.search);
    const queryString = params.toString() ? '?' + params.toString() : '';
    const newURL = newPath + queryString;
    
    if (window.location.pathname + window.location.search !== newURL) {
        window.history.pushState({ color: normalized }, '', newURL);
    }
    // Clear hash if present to avoid duplicate hex in URL
    clearHash();
    
    // Update control styling based on color brightness
    updateControlStyling(normalized);
    
    // Save color to cookie
    setCookie('lastColor', normalized);
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
    
    // Download button and menu
    const downloadMenu = document.getElementById('download-menu');
    const downloadContainer = downloadBtn.parentElement;
    
    // Detect if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let closeTimeout = null;
    let isMenuOpen = false;
    
    // Show menu
    const showMenu = () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        downloadMenu.classList.add('show');
        isMenuOpen = true;
    };
    
    // Hide menu with delay (desktop only)
    const hideMenu = () => {
        if (isTouchDevice) return; // Don't auto-hide on touch devices
        closeTimeout = setTimeout(() => {
            downloadMenu.classList.remove('show');
            isMenuOpen = false;
            closeTimeout = null;
        }, 200); // 200ms delay before closing
    };
    
    // Toggle menu (mobile/touch devices)
    const toggleMenu = (e) => {
        e.stopPropagation();
        if (isMenuOpen) {
            downloadMenu.classList.remove('show');
            isMenuOpen = false;
        } else {
            showMenu();
        }
    };
    
    if (isTouchDevice) {
        // Mobile: tap to toggle menu, or download default if menu is open
        downloadBtn.addEventListener('click', (e) => {
            if (isMenuOpen) {
                // Menu is open: download at default 1080p
                e.stopPropagation();
                downloadColor('1080p');
                downloadMenu.classList.remove('show');
                isMenuOpen = false;
            } else {
                // Menu is closed: open menu
                toggleMenu(e);
            }
        });
    } else {
        // Desktop: hover to show menu
        downloadContainer.addEventListener('mouseenter', showMenu);
        downloadMenu.addEventListener('mouseenter', showMenu);
        downloadContainer.addEventListener('mouseleave', hideMenu);
        downloadMenu.addEventListener('mouseleave', hideMenu);
        
        // Click button directly = default 1080p (desktop)
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadColor('1080p');
            downloadMenu.classList.remove('show');
            isMenuOpen = false;
        });
    }
    
    // Click menu option
    const downloadOptions = document.querySelectorAll('.download-option');
    downloadOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const resolution = option.getAttribute('data-resolution');
            downloadColor(resolution);
            downloadMenu.classList.remove('show');
            isMenuOpen = false;
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!downloadContainer.contains(e.target)) {
            downloadMenu.classList.remove('show');
            isMenuOpen = false;
        }
    });
    
    // On mobile, also close menu when tapping outside (touch events)
    if (isTouchDevice) {
        document.addEventListener('touchstart', (e) => {
            if (!downloadContainer.contains(e.target)) {
                downloadMenu.classList.remove('show');
                isMenuOpen = false;
            }
        });
    }
    
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

// Parse resolution string to width and height
function parseResolution(resolution) {
    if (!resolution) {
        return { width: 1920, height: 1080, name: '1080p' }; // Default
    }
    
    resolution = resolution.toLowerCase().trim();
    
    // Standard resolutions
    const resolutions = {
        '1080p': { width: 1920, height: 1080, name: '1080p' },
        '1080': { width: 1920, height: 1080, name: '1080p' },
        '1440p': { width: 2560, height: 1440, name: '1440p' },
        '1440': { width: 2560, height: 1440, name: '1440p' },
        '4k': { width: 3840, height: 2160, name: '4K' },
        '4K': { width: 3840, height: 2160, name: '4K' },
        '6k': { width: 6144, height: 3456, name: '6K' },
        '6K': { width: 6144, height: 3456, name: '6K' },
        '8k': { width: 7680, height: 4320, name: '8K' },
        '8K': { width: 7680, height: 4320, name: '8K' }
    };
    
    if (resolutions[resolution]) {
        return resolutions[resolution];
    }
    
    // Custom resolution format: widthxheight (e.g., 10x15, 1920x1080)
    const customMatch = resolution.match(/^(\d+)x(\d+)$/);
    if (customMatch) {
        const width = parseInt(customMatch[1], 10);
        const height = parseInt(customMatch[2], 10);
        if (width > 0 && height > 0 && width <= 16384 && height <= 16384) {
            return { width, height, name: `${width}×${height}` };
        }
    }
    
    // Default to 1080p if invalid
    return { width: 1920, height: 1080, name: '1080p' };
}

// Download color as PNG image
function downloadColor(resolution = '1080p') {
    const res = parseResolution(resolution);
    
    const canvas = document.createElement('canvas');
    canvas.width = res.width;
    canvas.height = res.height;
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
        a.download = `hex-${hexWithoutHash}-${res.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Download started! (${res.name})`);
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
            const downloadValue = params.get('download');
            // Support download=1080p, download=4k, download=10x15, etc.
            downloadColor(downloadValue || '1080p');
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

// Clear hash fragment from URL
function clearHash() {
    if (!window.location.hash) {
        return;
    }
    const url = new URL(window.location);
    url.hash = '';
    window.history.replaceState({}, '', url.pathname + url.search);
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
