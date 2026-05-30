// CodeDiffer Animated Dashboard – Integrated with FastAPI backend
// ---------------------------------------------------------------
// This version wires the UI to the backend we just built.
// It uses:
//   • HTTP POST /analyze for raw code strings
//   • POST /analyze-file for file uploads
//   • WebSocket /ws for live streaming (optional, demonstrated).
// ---------------------------------------------------------------

class CodeDifferDashboard {
  constructor() {
    this.state = {
      repoUrl: '',
      file: null,
      analysis: null,
      loading: false,
      ws: null // WebSocket connection (if we use live streaming)
    };
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.animateElements();
    this.setupWebSocket();
  }

  // ----------------------------------------------------------------
  // Rendering – re‑creates the whole UI on every state change.
  // ----------------------------------------------------------------
  render() {
    const root = document.getElementById('root');
    root.innerHTML = `
      <div class="container">
        <header class="app-header">
          <h1>🚀 CodeDiffer</h1>
          <p class="subtitle">AI‑Powered Code Review & Optimization</p>
        </header>

        <section class="upload-section">
          <div class="input-group">
            <textarea id="code-input" placeholder="Paste code here…" rows="8" style="width:100%;font-family:monospace;"></textarea>
            <button id="analyze-btn" class="action-btn">Analyze Code</button>
          </div>
          <div class="or-divider">or</div>
          <input type="file" id="file-input" accept=".js,.py,.java,.ts,.cpp,.c,.go,.rs" />
          <label for="file-input" class="action-btn">Upload Code File</label>
        </section>

        <section class="diff-preview" id="diff-preview" style="display:none;">
          <h2>✨ Before vs After Preview</h2>
          <div class="code-container">
            <div class="code-block code-remove" id="before-code"></div>
            <div class="code-block code-add" id="after-code"></div>
          </div>
        </section>

        <section class="insights-section" id="insights-section" style="display:none;">
          <h2>📊 Key Insights</h2>
          <div class="insights-grid" id="insights-grid"></div>
        </section>

        <section class="results-section" id="results-section" style="display:none;"></section>
      </div>
    `;
  }

  // ----------------------------------------------------------------
  // Event binding
  // ----------------------------------------------------------------
  bindEvents() {
    document.getElementById('analyze-btn').addEventListener('click', () => this.handleAnalyze());
    document.getElementById('file-input').addEventListener('change', e => this.handleFileInput(e));
  }

  // ----------------------------------------------------------------
  // Handlers – decide whether to POST JSON or multipart.
  // ----------------------------------------------------------------
  async handleAnalyze() {
    const code = document.getElementById('code-input').value.trim();
    if (!code) { alert('Please paste code or select a file.'); return; }
    this.setState({ loading: true, analysis: null });
    try {
     const response = await fetch('https://the-autonomous-code-reviewer-optimi.vercel.app/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'python' }) // language could be inferred later
      });
      const data = await response.json();
      this.setState({ loading: false, analysis: data });
      this.showResults();
    } catch (err) {
      console.error(err);
      alert('Failed to analyze – make sure the backend is running.');
      this.setState({ loading: false });
    }
  }

  async handleFileInput(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.setState({ loading: true, file });
    const form = new FormData();
    form.append('file', file);
    try {
     const response = await fetch('https://the-autonomous-code-reviewer-optimi.vercel.app/analyze-file', {
        method: 'POST',
        body: form
      });
      const data = await response.json();
      this.setState({ loading: false, analysis: data });
      this.showResults();
    } catch (err) {
      console.error(err);
      alert('File analysis failed – check backend.');
      this.setState({ loading: false });
    }
  }

  // ----------------------------------------------------------------
  // Show results – diff preview, insights, and suggestion cards.
  // ----------------------------------------------------------------
  showResults() {
    const { analysis } = this.state;
    if (!analysis) return;

    // Show diff preview (simple before/after display)
    document.getElementById('diff-preview').style.display = 'block';
    document.getElementById('before-code').textContent = analysis.original_code;
    document.getElementById('after-code').textContent = analysis.optimized_code || analysis.original_code;

    // Build insights from issues, suggestions, security risks, etc.
    const insights = [];
    if (analysis.issues && analysis.issues.length) {
      insights.push({icon: '⚠️', title: 'Issues', detail: analysis.issues.join('\n')});
    }
    if (analysis.suggestions && analysis.suggestions.length) {
      insights.push({icon: '💡', title: 'Suggestions', detail: analysis.suggestions.join('\n')});
    }
    if (analysis.security_risks && analysis.security_risks.length) {
      insights.push({icon: '🔐', title: 'Security', detail: analysis.security_risks.join('\n')});
    }
    if (analysis.performance_impact) {
      insights.push({icon: '🚀', title: 'Performance', detail: analysis.performance_impact});
    }
    // AI engine info
    if (analysis.ai_analysis && analysis.ai_analysis.engine) {
      insights.push({icon: '🧠', title: 'AI Engine', detail: `Used ${analysis.ai_analysis.engine}`});
    }

    const grid = document.getElementById('insights-grid');
    grid.innerHTML = insights.map(i => `
      <div class="insight-card">
        <span class="insight-icon">${i.icon}</span>
        <h3>${i.title}</h3>
        <p>${i.detail.replace(/\n/g, '<br/>')}</p>
      </div>
    `).join('');
    document.getElementById('insights-section').style.display = 'block';

    // Optional: show raw JSON result for debugging
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = `<pre style="background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;overflow:auto;">${JSON.stringify(analysis, null, 2)}</pre>`;
  }

  // ----------------------------------------------------------------
  // State handling – simple merge & re‑render.
  // ----------------------------------------------------------------
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
    this.bindEvents(); // re‑attach after render
    this.animateElements();
  }

  // ----------------------------------------------------------------
  // Simple UI animations – keep what we had before.
  // ----------------------------------------------------------------
  animateElements() {
    const cards = document.querySelectorAll('.insight-card');
    cards.forEach((c, i) => { c.style.animationDelay = `${i * 0.2}s`; });
  }

  // ----------------------------------------------------------------
  // WebSocket – optional live streaming; we keep it ready for future use.
  // ----------------------------------------------------------------
  setupWebSocket() {
    try {
   const ws = new WebSocket('wss://the-autonomous-code-reviewer-optimi.vercel.app/ws');
      ws.onopen = () => console.log('WebSocket connected');
      ws.onmessage = ev => {
        try {
          const data = JSON.parse(ev.data);
          console.log('Live analysis result via WS:', data);
          this.setState({ loading: false, analysis: data });
          this.showResults();
        } catch (e) { console.error('WS parse error', e); }
      };
      ws.onerror = err => console.error('WebSocket error', err);
      ws.onclose = () => console.log('WebSocket closed');
      this.state.ws = ws;
    } catch (e) { console.warn('WebSocket not supported or backend not reachable'); }
  }
}

// Initialize the dashboard when the page loads.
window.addEventListener('DOMContentLoaded', () => new CodeDifferDashboard());

// Dynamically inject additional CSS needed for new elements.
const extraStyle = document.createElement('style');
extraStyle.textContent = `
  .insight-card { background: var(--bg-secondary); padding:1rem; border-radius:var(--border-radius); text-align:center; }
  .insight-icon { font-size:2rem; display:block; margin-bottom:0.5rem; }
  #code-input { font-size:0.9rem; padding:0.5rem; border-radius:6px; border:1px solid #334155; background:#1e293b; color:#e2e8f0; }
  .action-btn { margin-top:0.5rem; }
`;
document.head.appendChild(extraStyle);
