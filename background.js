chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle messages from content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getRelatedSites') {
    // Handle API calls if needed
    sendResponse({success: true});
  }
}); 