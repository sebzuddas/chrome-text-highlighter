console.log('Bold Highlighter extension: Content script loaded');

function injectStyles() {
    // Remove any existing style element to prevent duplicates
    const existingStyle = document.getElementById('bold-highlighter-style');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'bold-highlighter-style';
    
    // More aggressive approach to force bold on selection
    style.textContent = `
        /* Base selection styles */
        ::selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -webkit-text-fill-color: currentColor !important;
            background-color: rgba(0, 119, 255, 0.15) !important;
        }
        
        /* Firefox */
        ::-moz-selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -moz-text-fill-color: currentColor !important;
            background-color: rgba(0, 119, 255, 0.15) !important;
        }
        
        /* Force bold on all elements when selected */
        *::selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -webkit-text-fill-color: currentColor !important;
        }
        
        *::-moz-selection {
            font-weight: 900 !important;
            text-shadow: 0.5px 0 0 currentColor !important;
            -moz-text-fill-color: currentColor !important;
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

// Mutation observer to handle dynamic content and style overrides
const observer = new MutationObserver((mutations) => {
    let shouldReinject = false;
    
    mutations.forEach((mutation) => {
        // If our style was removed
        if (mutation.removedNodes) {
            mutation.removedNodes.forEach(node => {
                if (node.id === 'bold-highlighter-style') {
                    shouldReinject = true;
                }
            });
        }
        
        // If attributes of our style were changed
        if (mutation.type === 'attributes' && 
            mutation.target.id === 'bold-highlighter-style') {
            shouldReinject = true;
        }
    });
    
    if (shouldReinject) {
        console.log('Bold Highlighter extension: Styles modified, re-injecting');
        injectStyles();
    }
});

// Initialize the extension
function init() {
    try {
        injectStyles();
        
        // Start observing the document for changes
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
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
    setTimeout(init, 100);
}
