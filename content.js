class PurrSpectiveSidebar {
  constructor() {
    this.state = 'small'; // 'logo', 'small', or 'large'
    this.activeTab = 'summary';
    this.currentContent = null; // Store current content for state changes
    this.initialize();
  }

  async initialize() {
    // Create cat logo button (shown when sidebar is hidden)
    this.logoButton = document.createElement('button');
    this.logoButton.id = 'purr-logo';
    this.logoButton.className = 'logo-button';
    this.logoButton.innerHTML = `<span class="logo">😺</span>`;
    this.logoButton.onclick = () => this.setState('small');

    // Create sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'perplexity-sidebar';
    this.sidebar.className = 'perplexity-sidebar';

    // Add to page
    document.body.appendChild(this.logoButton);
    document.body.appendChild(this.sidebar);

    // Check if we're on a search engine
    const isSearchEngine = this.isSearchEngineSite();
    
    // Start with logo only if on search engine
    this.setState(isSearchEngine ? 'logo' : 'small');

    await this.checkApiKeyAndLoad();
    this.addStyles();
  }

  isSearchEngineSite() {
    const searchEngines = [
      'google.com',
      'bing.com',
      'duckduckgo.com',
      'yahoo.com',
      'baidu.com',
      'yandex.com'
    ];
    return searchEngines.some(engine => window.location.hostname.includes(engine));
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
        <h3>Meow! 😺</h3>
        <p>To get started, you'll need to add your Perplexity API key.</p>
        <p>Click the extension icon in your browser toolbar to set up your API key.</p>
        <div class="steps">
          <p>1. Click the extension icon (😺) in the toolbar</p>
          <p>2. Enter your Perplexity API key</p>
          <p>3. Click Save</p>
        </div>
        <button onclick="window.location.reload()" class="retry-button">
          I've added my API key 😸
        </button>
      </div>
    `;
  }

  showLoading() {
    this.sidebar.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner">😺</div>
        <p>Purr-cessing your request...</p>
      </div>
    `;
  }

  async loadRelatedSites() {
    const currentUrl = window.location.href;
    const pageTitle = document.title;
    const pageContent = document.body.innerText.substring(0, 2000); // Get first 2000 chars of content

    const prompt = `Analyze this webpage:
Title: "${pageTitle}"
URL: ${currentUrl}
Content excerpt: "${pageContent}"

Provide:
1. A brief summary (2-3 sentences)
2. Hoax Analysis:
   - Credibility score (0-100%)
   - Potential misinformation flags
   - Source reputation
   - Fact-checking status
3. Trust Assessment:
   - Domain authority
   - Content quality indicators
   - Citation/reference quality
   - Transparency factors
4. Critical analysis (biases, credibility)
5. Related trustworthy sources

Return in this format:

Summary
---
[Summary here]

Hoax Analysis
---
Credibility Score: [X]%
[Detailed hoax analysis]

Trust Assessment
---
Trust Score: [X]%
[Detailed trust analysis]

Analysis
---
[Critical analysis]

Related Sites
---
▸ [Site Title](URL)
[Why this source is reliable + relevance]`;

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
    this.currentContent = markdownContent; // Store for state changes
    const htmlContent = this.markdownToHtml(markdownContent);
    
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="header-left">
          <span class="logo">😺</span><h2>PurrSpective</h2>
        </div>
        <div class="header-controls">
          ${this.state === 'small' ? 
            `<button class="control-button" id="maximize-btn" title="Maximize">+</button>` :
            `<button class="control-button" id="minimize-btn" title="Minimize">−</button>`
          }
          <button class="control-button" id="hide-btn" title="Hide">×</button>
        </div>
      </div>
      <div class="trust-meters">
        <div class="meter credibility">
          <div class="meter-label">Credibility</div>
          <div class="meter-bar">
            <div class="meter-fill" id="credibility-fill"></div>
          </div>
          <div class="meter-value" id="credibility-value">--</div>
        </div>
        <div class="meter trust">
          <div class="meter-label">Trust</div>
          <div class="meter-bar">
            <div class="meter-fill" id="trust-fill"></div>
          </div>
          <div class="meter-value" id="trust-value">--</div>
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="summary">
          <span>😺</span> Summary
        </button>
        <button class="tab-btn" data-tab="analysis">
          <span>🐱</span> Analysis
        </button>
        <button class="tab-btn" data-tab="related">
          <span>😸</span> Related
        </button>
        <button class="tab-btn" data-tab="hoax">
          <span>🔍</span> Fact Check
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

    this.setupEventListeners();
    this.updateTrustMeters(htmlContent);
  }

  setupEventListeners() {
    // Maximize button (in small mode)
    const maximizeBtn = document.getElementById('maximize-btn');
    if (maximizeBtn) {
      maximizeBtn.onclick = () => this.setState('large');
    }

    // Minimize button (in large mode)
    const minimizeBtn = document.getElementById('minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.onclick = () => this.setState('small');
    }

    // Hide button (in both modes)
    const hideBtn = document.getElementById('hide-btn');
    if (hideBtn) {
      hideBtn.onclick = () => this.setState('logo');
    }

    // Tab switching
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

  setState(newState) {
    this.state = newState;
    
    // Update classes and visibility
    switch (newState) {
      case 'logo':
        this.sidebar.classList.add('hidden');
        this.logoButton.classList.remove('hidden');
        break;
      case 'small':
        this.sidebar.classList.remove('hidden', 'expanded');
        this.logoButton.classList.add('hidden');
        if (this.currentContent) {
          this.displayResults(this.currentContent);
        }
        break;
      case 'large':
        this.sidebar.classList.remove('hidden');
        this.sidebar.classList.add('expanded');
        this.logoButton.classList.add('hidden');
        if (this.currentContent) {
          this.displayResults(this.currentContent);
        }
        break;
    }
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

  addStyles() {
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

  switchTab(tabId) {
    this.activeTab = tabId;
    this.sidebar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    this.sidebar.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  updateTrustMeters(htmlContent) {
    // Extract scores from content
    const credibilityMatch = htmlContent.match(/Credibility Score: (\d+)%/);
    const trustMatch = htmlContent.match(/Trust Score: (\d+)%/);

    const credibilityScore = credibilityMatch ? parseInt(credibilityMatch[1]) : 0;
    const trustScore = trustMatch ? parseInt(trustMatch[1]) : 0;

    // Update UI
    const credFill = document.getElementById('credibility-fill');
    const credValue = document.getElementById('credibility-value');
    const trustFill = document.getElementById('trust-fill');
    const trustValue = document.getElementById('trust-value');

    if (credFill && credValue) {
      credFill.style.width = `${credibilityScore}%`;
      credValue.textContent = `${credibilityScore}%`;
      credFill.className = `meter-fill ${this.getScoreClass(credibilityScore)}`;
    }

    if (trustFill && trustValue) {
      trustFill.style.width = `${trustScore}%`;
      trustValue.textContent = `${trustScore}%`;
      trustFill.className = `meter-fill ${this.getScoreClass(trustScore)}`;
    }
  }

  getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}

// Initialize sidebar when page loads
new PurrSpectiveSidebar(); 