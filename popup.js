document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleBold');
    
    // Load the saved state
    chrome.storage.sync.get(['boldEnabled'], function(result) {
        const isEnabled = result.boldEnabled !== undefined ? result.boldEnabled : true;
        toggleSwitch.checked = isEnabled;
        updateExtensionState(isEnabled);
    });
    
    // Toggle the extension on/off
    toggleSwitch.addEventListener('change', function() {
        const isEnabled = this.checked;
        updateExtensionState(isEnabled);
        
        // Save the state
        chrome.storage.sync.set({ boldEnabled: isEnabled });
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleBold',
                enabled: isEnabled
            });
        });
    });
});

function updateExtensionState(isEnabled) {
    const statusText = isEnabled ? 'ON' : 'OFF';
    console.log(`Bold Highlighter is now ${statusText}`);
}
