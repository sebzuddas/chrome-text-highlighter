console.log('Bold Highlighter extension: Content script loaded');

let currentMode = 'normal';
let isSelecting = false;

// Function to apply bionic reading to selected text
function applyBionicToSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    if (!selectedText.trim()) return;
    
    try {
        // Create a temporary span to hold our selection
        const tempSpan = document.createElement('span');
        tempSpan.className = 'bionic-selection';
        
        // Apply the selection to the span
        range.surroundContents(tempSpan);
        
        // Process the text nodes within our selection
        const walker = document.createTreeWalker(
            tempSpan,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        const textNodes = [];
        while (node = walker.nextNode()) {
            if (node.nodeValue.trim()) {
                textNodes.push(node);
            }
        }
        
        // Process each text node
        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            const words = text.split(/(\s+)/);
            const fragment = document.createDocumentFragment();
            
            words.forEach(word => {
                if (!word.trim()) {
                    fragment.appendChild(document.createTextNode(word));
                    return;
                }
                
                const wordSpan = document.createElement('span');
                wordSpan.className = 'bionic-word';
                
                // Calculate how many characters to bold (first half, at least 1)
                const boldLength = Math.max(1, Math.ceil(word.length / 2));
                const boldPart = word.substring(0, boldLength);
                const normalPart = word.substring(boldLength);
                
                // Create bold and normal spans
                const boldSpan = document.createElement('span');
                boldSpan.className = 'bionic-bold';
                boldSpan.textContent = boldPart;
                
                const normalSpan = document.createElement('span');
                normalSpan.className = 'bionic-normal';
                normalSpan.textContent = normalPart;
                
                wordSpan.appendChild(boldSpan);
                wordSpan.appendChild(normalSpan);
                fragment.appendChild(wordSpan);
            });
            
            // Replace the original text node with our processed content
            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
        
    } catch (e) {
        console.error('Error applying bionic reading:', e);
    }
}

// Clear all bionic spans and restore original text
function clearBionicSpans() {
    // Clean up bionic-selection spans
    document.querySelectorAll('.bionic-selection').forEach(span => {
        const parent = span.parentNode;
        if (!parent) return;
        
        // Replace with text content
        parent.replaceChild(document.createTextNode(span.textContent), span);
    });
    
    // Clean up any remaining bionic spans
    document.querySelectorAll('.bionic-word, .bionic-bold, .bionic-normal').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(span.textContent), span);
        }
    });
    
    // Normalize to merge adjacent text nodes
    document.normalize();
}

// Function to inject styles
function injectStyles() {
    // Remove any existing style element to prevent duplicates
    const existingStyle = document.getElementById('bold-highlighter-style');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'bold-highlighter-style';
    
    style.textContent = `
        /* Normal mode selection */
        .normal-mode ::selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -webkit-text-fill-color: currentColor !important;
            background-color: rgba(0, 119, 255, 0.15) !important;
        }
        
        .normal-mode ::-moz-selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -moz-text-fill-color: currentColor !important;
            background-color: rgba(0, 119, 255, 0.15) !important;
        }
        
        /* Bionic reading styles */
        .bionic-mode .bionic-selection {
            background-color: rgba(0, 119, 255, 0.15) !important;
        }
        
        .bionic-mode .bionic-bold {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -webkit-text-fill-color: currentColor !important;
        }
        
        .bionic-mode .bionic-normal {
            font-weight: normal !important;
        }
        
        /* For elements that might be blocking selection */
        * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    
    // Add to head with high priority
    (document.head || document.documentElement).prepend(style);
    console.log('Bold Highlighter extension: Styles injected');
}

// Function to update the mode
function updateMode(mode) {
    console.log('Updating mode to:', mode);
    
    // Clear any existing bionic spans when switching modes
    if (currentMode === 'bionic' && mode !== 'bionic') {
        clearBionicSpans();
    }
    
    // Remove any existing mode classes
    document.documentElement.classList.remove('normal-mode', 'bionic-mode');
    
    // Add the new mode class
    document.documentElement.classList.add(`${mode}-mode`);
    
    currentMode = mode;
}

// Handle mouse events for selection
function handleMouseDown() {
    isSelecting = true;
}

function handleMouseUp() {
    if (currentMode === 'bionic' && isSelecting) {
        setTimeout(() => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                applyBionicToSelection();
            } else {
                clearBionicSpans();
            }
        }, 10);
    }
    isSelecting = false;
}

// Initialize the extension
function init() {
    try {
        injectStyles();
        
        // Load the saved mode
        chrome.storage.sync.get(['highlightMode'], function(result) {
            const mode = result.highlightMode || 'normal';
            updateMode(mode);
        });
        
        // Listen for mouse events
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Listen for mode changes from the popup
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === 'updateMode') {
                updateMode(request.mode);
                sendResponse({status: 'success', mode: request.mode});
            }
            return true;
        });
        
        console.log('Bold Highlighter extension: Initialized');
    } catch (e) {
        console.error('Bold Highlighter extension error:', e);
    }
}

// Run when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    setTimeout(init, 10);
}
