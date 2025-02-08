const CONFIG = {
    API_ENDPOINT: 'https://api.perplexity.ai/chat/completions',
    MODEL: 'sonar-pro',
    API_KEY: null
};

// Function to load API key from storage
async function initializeConfig() {
    try {
        const result = await chrome.storage.local.get(['perplexityApiKey']);
        if (result.perplexityApiKey) {
            CONFIG.API_KEY = result.perplexityApiKey;
        }
    } catch (error) {
        console.error('Error loading API key:', error);
    }
}

// Initialize config when loaded
initializeConfig(); 