document.addEventListener('DOMContentLoaded', async () => {
    // Load existing API key
    const result = await chrome.storage.local.get(['perplexityApiKey']);
    if (result.perplexityApiKey) {
        document.getElementById('apiKey').value = result.perplexityApiKey;
    }

    // Handle save button click
    document.getElementById('saveButton').addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            await chrome.storage.local.set({ perplexityApiKey: apiKey });
            document.getElementById('status').textContent = 'API key saved!';
            
            // Reload all tabs to apply new API key
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.reload(tab.id);
                });
            });
        } else {
            document.getElementById('status').textContent = 'Please enter an API key';
        }
    });
}); 