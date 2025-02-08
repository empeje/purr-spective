# Perplexity Related Sites Extension

A browser extension that shows interesting related websites using the Perplexity Sonar API. The extension adds a collapsible sidebar to any webpage, displaying relevant websites based on the current page you're viewing.

## Running Locally

### 1. Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/perplexity-related-sites.git
   cd perplexity-related-sites
   ```

2. Create a `.env` file in the root directory and add your Perplexity API key:
   ```
   PERPLEXITY_API_KEY=your_api_key_here
   ```

### 2. Load in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension directory (where your manifest.json is located)

### 3. Load in Firefox

1. Open Firefox browser
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to your extension directory and select `manifest.json`

### 4. Testing the Extension

1. After loading the extension, visit any website
2. You should see a small arrow button (←) on the right side of the page
3. Click the arrow to open the sidebar
4. The sidebar will show related websites based on your current page
5. Click the arrow again to close the sidebar

### 5. Development

To make changes during development:

1. Edit any file in the extension
2. For Chrome:
   - Click the refresh icon on the extension card in `chrome://extensions/`
3. For Firefox:
   - Click "Reload" next to the extension in `about:debugging`

### 6. Debugging

- Open browser's Developer Tools (F12)
- Check the Console tab for any error messages
- For Chrome, you can inspect the extension's background page from the extensions page

## Features

- 🔍 Uses Perplexity's Sonar-Pro API to find related websites
- 📱 Collapsible sidebar interface
- 🔄 Real-time suggestions based on current URL
- 🌐 Supports both Chrome and Firefox browsers

## Project Structure

```
perplexity-related-sites/
├── manifest.json          # Extension configuration
├── background.js         # Background service worker
├── content.js           # Main content script
├── config.js           # Configuration management
├── .env               # API key configuration (create this)
├── .gitignore        # Git ignore file
└── sidebar/
    ├── sidebar.html  # Sidebar HTML template
    └── sidebar.css   # Sidebar styles
```

## Troubleshooting

1. **API Key Issues**
   - Make sure `.env` file exists and contains your API key
   - Verify the API key is valid at Perplexity dashboard
   - Check console for API-related errors

2. **Extension Not Loading**
   - Verify all files are in the correct location
   - Check manifest.json for syntax errors
   - Make sure Developer mode is enabled (Chrome)

3. **Sidebar Not Appearing**
   - Check if the content script is running (use console.log)
   - Verify the CSS is being injected properly
   - Check for JavaScript errors in the console 