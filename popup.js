document.addEventListener('DOMContentLoaded', function() {
    const normalOption = document.getElementById('option-normal');
    const bionicOption = document.getElementById('option-bionic');
    const statusElement = document.getElementById('status');
    
    // Load saved mode or default to 'normal'
    chrome.storage.sync.get(['highlightMode'], function(result) {
        const mode = result.highlightMode || 'normal';
        updateUI(mode);
    });
    
    // Add event listeners
    normalOption.addEventListener('click', () => setMode('normal'));
    bionicOption.addEventListener('click', () => setMode('bionic'));
    
    function setMode(mode) {
        // Save the mode
        chrome.storage.sync.set({ highlightMode: mode }, function() {
            updateUI(mode);
            
            // Send message to content script to update the highlighting
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'updateMode', mode: mode});
            });
        });
    }
    
    function updateUI(mode) {
        // Update radio buttons
        document.querySelector(`input[value="${mode}"]`).checked = true;
        
        // Update active state
        normalOption.classList.toggle('active', mode === 'normal');
        bionicOption.classList.toggle('active', mode === 'bionic');
        
        // Update status text
        const modeText = mode === 'normal' ? 'Normal Mode' : 'Bionic Reading';
        statusElement.textContent = `Active: ${modeText}`;
    }
});
