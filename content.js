class PurrSpectiveSidebar {
  constructor() {
    this.sidebarVisible = true;
    this.isCompact = true;  // Start in compact mode
    this.activeTab = 'summary';  // Default tab
    this.initialize();
  }

  async initialize() {
    // Create sidebar container
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'perplexity-sidebar';
    this.sidebar.className = 'perplexity-sidebar';

    // Create hide button
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'perplexity-toggle';
    this.toggleButton.innerHTML = '→';
    this.toggleButton.onclick = () => this.toggleSidebar();

    // Make the header also clickable for toggling
    const handleHeaderClick = (e) => {
      // Only toggle if clicking the header area, not its children
      if (e.target.closest('.refresh-button')) return;
      this.toggleSidebar();
    };

    // Add click handler after content is loaded
    const observer = new MutationObserver((mutations) => {
      const header = this.sidebar.querySelector('.sidebar-header');
      if (header && !header.onclick) {
        header.onclick = handleHeaderClick;
      }
    });

    observer.observe(this.sidebar, { childList: true, subtree: true });

    // Add elements to page
    document.body.appendChild(this.sidebar);
    document.body.appendChild(this.toggleButton);

    // Check for API key and show appropriate content
    await this.checkApiKeyAndLoad();

    // Add size toggle button
    this.sizeToggle = document.createElement('button');
    this.sizeToggle.id = 'size-toggle';
    this.sizeToggle.innerHTML = '⇄';
    this.sizeToggle.onclick = () => this.toggleSize();

    this.addAnalysisStyles();
  }

  async checkApiKeyAndLoad() {
    await initializeConfig();
    
    if (!CONFIG.API_KEY) {
      this.showApiKeyPrompt();
    } else {
      await this.loadRelatedSites();
    }
  }

  showApiKeyPrompt() {
    this.sidebar.innerHTML = `
      <div class="api-key-prompt">
        <h3>Welcome! 👋</h3>
        <p>To get started, you'll need to add your Perplexity API key.</p>
        <p>Click the extension icon in your browser toolbar to set up your API key.</p>
        <div class="steps">
          <p>1. Click the extension icon (🔍) in the toolbar</p>
          <p>2. Enter your Perplexity API key</p>
          <p>3. Click Save</p>
        </div>
        <button onclick="window.location.reload()" class="retry-button">
          I've added my API key
        </button>
      </div>
    `;
  }

  showLoading() {
    this.sidebar.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Finding related sites...</p>
      </div>
    `;
  }

  async loadRelatedSites() {
    const currentUrl = window.location.href;
    const pageTitle = document.title;
    const prompt = `For the webpage "${pageTitle}" at ${currentUrl}, provide:
1. A brief summary of what this page is about (2-3 sentences)
2. A critical analysis of the content (key points, potential biases, credibility)
3. Then find 5 most interesting related websites.

Return the response in this markdown format:

Summary
---
[Your 2-3 sentence summary here]

Analysis
---
[Critical analysis of the content, including:
- Key points
- Potential biases
- Credibility assessment
- Notable observations]

Related Sites
---

▸ [Site Title](URL)
Brief description of why this site is relevant.

Make sure each site has a clear title, working URL, and concise explanation of its relevance.`;

    try {
      this.showLoading();

      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.displayResults(data.choices[0].message.content);
    } catch (error) {
      console.error('Error fetching related sites:', error);
      this.sidebar.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error</h3>
          <p>Could not load related sites. Please check your API key or try again later.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  displayResults(markdownContent) {
    const htmlContent = this.markdownToHtml(markdownContent);
    
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="header-left">
          <h2>PurrSpective</h2>
          <button id="size-toggle" onclick="document.querySelector('#size-toggle').click()">⇄</button>
        </div>
        <div class="header-right">
          <button onclick="window.location.reload()" class="refresh-button">🔄</button>
          ${this.toggleButton.outerHTML}
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="summary">
          <span>📝</span> Summary
        </button>
        <button class="tab-btn" data-tab="analysis">
          <span>🤔</span> Analysis
        </button>
        <button class="tab-btn" data-tab="related">
          <span>🔗</span> Related
        </button>
      </div>
      <div class="tab-content">
        <div id="summary" class="tab-pane active">
          ${this.getSummaryContent(htmlContent)}
        </div>
        <div id="analysis" class="tab-pane">
          ${this.getAnalysisContent(htmlContent)}
        </div>
        <div id="related" class="tab-pane">
          ${this.getRelatedContent(htmlContent)}
        </div>
      </div>
    `;

    // Add tab switching functionality
    this.sidebar.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button.dataset.tab);
      });
    });
  }

  markdownToHtml(markdown) {
    // First clean up the markdown text
    const cleanMarkdown = markdown
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\s+$/gm, ''); // Remove trailing spaces from each line

    return cleanMarkdown
      // Convert section titles and horizontal rules
      .replace(/^(.*)\n---$/gm, '<h1>$1</h1>')
      // Convert bullet points
      .replace(/^- (.*)/gm, '<li>$1</li>')
      // Wrap consecutive list items in ul
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // Convert list items with arrow
      .replace(/^▸ (.*)/gm, '<h2>$1</h2>')
      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Convert paragraphs, filtering out empty ones
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => {
        // Remove empty paragraphs and standalone whitespace
        return para.length > 0 && !/^[\s\n]*$/.test(para);
      })
      .map(para => {
        // Only wrap in <p> if it's not a header or list
        if (!para.includes('</h1>') && 
            !para.includes('</h2>') && 
            !para.includes('</li>') &&
            !para.includes('</ul>')) {
          return `<p>${para}</p>`;
        }
        return para;
      })
      .join('\n');
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    this.sidebar.classList.toggle('hidden');
    this.toggleButton.innerHTML = this.sidebarVisible ? '→' : '←';
  }

  toggleSize() {
    this.isCompact = !this.isCompact;
    this.sidebar.classList.toggle('expanded');
    this.sizeToggle.innerHTML = this.isCompact ? '⇄' : '⇆';
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.sidebar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    this.sidebar.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  getSummaryContent(htmlContent) {
    // Extract content between Summary and Analysis
    const summaryMatch = htmlContent.match(/<h1>Summary<\/h1>(.*?)<h1>Analysis<\/h1>/s);
    if (!summaryMatch) return 'No summary available.';
    
    return `
      <div class="summary-content">
        ${summaryMatch[1].trim()}
      </div>
    `;
  }

  getAnalysisContent(htmlContent) {
    // Extract content between Analysis and Related Sites
    const analysisMatch = htmlContent.match(/<h1>Analysis<\/h1>(.*?)<h1>Related Sites<\/h1>/s);
    const analysisContent = analysisMatch ? analysisMatch[1].trim() : '';
    
    return `
      <div class="analysis-content">
        ${analysisContent}
        <div class="page-stats">
          <h3>Page Statistics</h3>
          <ul>
            <li>Content Type: ${document.contentType || 'Web Page'}</li>
            <li>Last Modified: ${document.lastModified}</li>
            <li>Language: ${document.documentElement.lang || 'Not specified'}</li>
            <li>Title: ${document.title}</li>
            <li>Headers: ${document.querySelectorAll('h1, h2, h3').length} headers found</li>
            <li>Links: ${document.querySelectorAll('a').length} links found</li>
          </ul>
        </div>
      </div>
    `;
  }

  getRelatedContent(htmlContent) {
    // Extract content after Related Sites
    const relatedMatch = htmlContent.match(/<h1>Related Sites<\/h1>(.*?)$/s);
    if (!relatedMatch) return 'No related sites found.';
    
    return `
      <div class="related-content">
        ${relatedMatch[1].trim()}
      </div>
    `;
  }

  addAnalysisStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .summary-content,
      .analysis-content,
      .related-content {
        padding: 15px;
        background: rgba(144, 180, 197, 0.08);
        border-radius: 10px;
        margin-bottom: 15px;
      }

      .analysis-content h3,
      .page-stats h3 {
        color: #2c4a5e;
        margin: 15px 0 10px;
        font-size: 16px;
      }

      .analysis-content ul,
      .page-stats ul {
        list-style: none;
        padding: 0;
        margin: 0 0 20px;
      }

      .analysis-content li,
      .page-stats li {
        padding: 5px 0;
        color: #4a5567;
        font-size: 14px;
        line-height: 1.5;
      }

      .tab-content {
        padding: 10px;
      }

      .tab-pane {
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .tab-pane.active {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize sidebar when page loads
new PurrSpectiveSidebar(); 