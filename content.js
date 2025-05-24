// Add a style element for our selection
const style = document.createElement('style');
style.textContent = `
  .bold-selection {
    font-weight: bold !important;
  }
`;
document.head.appendChild(style);

let currentSelection = null;

function updateSelection() {
    // Remove previous selection
    if (currentSelection) {
        currentSelection.classList.remove('bold-selection');
        currentSelection = null;
    }

    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    try {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        if (!selectedText) return;

        // Create a span to wrap the selection
        const span = document.createElement('span');
        span.className = 'bold-selection';
        
        // Try to surround the selection with our span
        try {
            range.surroundContents(span);
            currentSelection = span;
        } catch (e) {
            // If surrounding fails, try a different approach
            const content = range.extractContents();
            span.appendChild(content);
            range.insertNode(span);
            currentSelection = span;
        }
    } catch (e) {
        console.log('Error updating selection:', e);
    }
}

// Listen for selection changes
document.addEventListener('mouseup', updateSelection);
document.addEventListener('selectionchange', updateSelection);

// Clear selection when clicking elsewhere
document.addEventListener('mousedown', (e) => {
    if (currentSelection && !currentSelection.contains(e.target)) {
        currentSelection.classList.remove('bold-selection');
        currentSelection = null;
    }
});

// Also clear on scroll
window.addEventListener('scroll', () => {
    if (currentSelection) {
        currentSelection.classList.remove('bold-selection');
        currentSelection = null;
    }
});

console.log('Bold Highlighter extension loaded');
