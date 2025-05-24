console.log('Bold Highlighter extension: Content script loaded');

let currentMode = 'normal';
let lastSelection = null;

// Function to apply bionic reading to selected text
function applyBionicToSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    
    // Save the current selection
    lastSelection = {
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
    };
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    if (!selectedText.trim()) return;
    
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
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    // Process each text node in the selection
    textNodes.forEach(textNode => {
        const text = textNode.nodeValue;
        if (!text.trim()) return;
        
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
        textNode.parentNode.replaceChild(fragment, textNode);
    });
    
    // Restore the selection
    restoreSelection();
}

// Function to restore the text selection
function restoreSelection() {
    if (!lastSelection) return;
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    const range = document.createRange();
    range.setStart(lastSelection.anchorNode, lastSelection.anchorOffset);
    range.setEnd(lastSelection.focusNode, lastSelection.focusOffset);
    
    selection.addRange(range);
}

// Clear all bionic spans and restore original text
function clearBionicSpans() {
    // Clean up bionic-selection spans
    document.querySelectorAll('.bionic-selection').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            // Move all children out of the span
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            // Remove the empty span
            parent.removeChild(span);
            // Normalize to merge adjacent text nodes
            parent.normalize();
        }
    });
    
    // Clean up any orphaned bionic-word spans
    document.querySelectorAll('.bionic-word').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            // Move all children out of the span
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            // Remove the empty span
            parent.removeChild(span);
            // Normalize to merge adjacent text nodes
            parent.normalize();
        }
    });
    
    // Normalize the entire document
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

// Handle selection
function handleSelection() {
    const selection = window.getSelection();
    
    if (currentMode === 'bionic') {
        // Clear any existing bionic spans when selection changes
        clearBionicSpans();
        
        // If there's a valid selection, apply bionic reading
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
            applyBionicToSelection();
        }
    }
}

// Add click handler to clear selection when clicking outside
function handleClickOutside(event) {
    // Only handle left mouse button clicks
    if (event.button !== 0) return;
    
    const selection = window.getSelection();
    const clickedElement = event.target;
    
    // Always clear bionic spans on any click when in bionic mode
    if (currentMode === 'bionic') {
        // Small delay to allow the click to be processed by the browser first
        setTimeout(() => {
            // Check if there's no selection or the click is outside the selection
            if (selection.isCollapsed || 
                !clickedElement.closest || 
                !clickedElement.closest('.bionic-selection')) {
                clearBionicSpans();
            }
        }, 0);
    }
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
        
        // Listen for selection changes
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);
        
        // Listen for clicks outside to clear selection
        document.addEventListener('mousedown', handleClickOutside);
        
        console.log('Bold Highlighter extension: Initialized');
    } catch (e) {
        console.error('Bold Highlighter extension error:', e);
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateMode') {
        updateMode(request.mode);
        sendResponse({status: 'success', mode: request.mode});
    }
    return true;
});

// Run when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    setTimeout(init, 100);
}

// Add a test element to verify the script is working
const testElement = document.createElement('div');
testElement.textContent = 'Bold Highlighter: Select text to see it become bold';
testElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: var(--bg-color, #ffffff);
    color: var(--text-color, #000000);
    border: 2px solid #4CAF50;
    padding: 10px;
    z-index: 2147483647;
    max-width: 300px;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
`;

document.body.appendChild(testElement);
console.log('Bold Highlighter extension: Test element added');
