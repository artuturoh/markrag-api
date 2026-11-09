/**
 * MarkRAG v2.0 — Live RAG Studio Client Engine
 * 100% External Vanilla JavaScript (No inline script dependencies, strict CSP compliant)
 */

// ~15KB Realistic Technical Article for live 85-90% token reduction demonstration
const SAMPLE_TECH_ARTICLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Architecture of Modern Production RAG Systems: Dense Embeddings, Hierarchical Chunking & Hybrid Search</title>
  <meta name="author" content="Dr. Elena Vance, Staff AI Architect">
  <meta name="description" content="A comprehensive engineering deep dive into high-throughput Retrieval-Augmented Generation (RAG) pipelines, context-aware semantic chunking, and deterministic vector index upserts.">
  <meta property="article:published_time" content="2026-04-12T14:30:00Z">
  <meta property="og:site_name" content="AI Systems & Vector Engineering Review">
  <link rel="canonical" href="https://systems.example.ai/articles/modern-rag-architecture">
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; background: #fafafa; color: #111; }
    .nav-bar { background: #222; color: #fff; padding: 15px 25px; display: flex; justify-content: space-between; }
    .ad-banner { background: #fff8e1; border: 2px dashed #f57f17; padding: 24px; margin: 20px auto; text-align: center; }
    .cookie-modal { position: fixed; bottom: 0; left: 0; right: 0; background: #333; color: #fff; padding: 18px; z-index: 9999; }
    .newsletter-box { background: #e0f2fe; padding: 24px; border-radius: 8px; margin: 30px 0; }
    .footer { background: #18181b; color: #a1a1aa; padding: 40px 20px; font-size: 13px; }
  </style>
</head>
<body>
  <!-- Global Navigation Header (Boilerplate noise to strip) -->
  <header class="nav-bar">
    <div class="logo"><strong>AI Systems Review</strong></div>
    <nav>
      <a href="/">Home</a> | <a href="/blog">Articles</a> | <a href="/benchmarks">Benchmarks</a> | 
      <a href="/pricing">Pricing</a> | <a href="/login">Sign In</a>
    </nav>
  </header>

  <!-- Sponsored Advertisement Banner (Noise to strip) -->
  <aside class="ad-banner">
    <h3>Sponsored Notice</h3>
    <p>Scale your multi-tenant HNSW vector indexes with CloudVector Pro. Get $500 free credits today!</p>
    <a href="https://ad.example.com/click">Claim Credits &rarr;</a>
  </aside>

  <!-- Main Article Body -->
  <main id="content">
    <article>
      <header>
        <h1>Architecture of Modern Production RAG Systems</h1>
        <p class="byline">By <strong>Dr. Elena Vance</strong> &bull; Published April 12, 2026 &bull; 9 min read</p>
      </header>

      <section>
        <p>Retrieval-Augmented Generation (RAG) has transformed from an exploratory experimental pattern into the foundational architecture for enterprise AI systems. By grounding large language model completions in external vector databases, developers eliminate hallucinations while maintaining verifiable source provenance.</p>
        <p>However, real-world knowledge extraction remains fraught with architectural complexity. Ingesting unprocessed HTML containing redundant navigation trees, cookie popups, tracking scripts, and sidebars pollutes context windows and degrades semantic cosine similarity.</p>
      </section>

      <section>
        <h2>1. The Knowledge Ingestion and Chunking Dilemma</h2>
        <p>Before semantic chunking, raw web pages must be parsed into clean GitHub Flavored Markdown. Naive character-boundary splitting truncates code blocks, shatters table structures, and discards document headings essential for hierarchical retrieval.</p>
        <p>Hierarchy-aware semantic chunking tracks active section headings (H1 through H6) to generate dynamic breadcrumb paths. Prepending contextual prefixes (e.g. <code>[Section: Architecture &gt; Ingestion &gt; Semantic Chunking]</code>) directly to chunks preserves document topology during dense vector search.</p>
      </section>

      <section>
        <h2>2. Benchmark Comparison of Production Vector Indexes</h2>
        <p>Vector databases balance retrieval latency against recall accuracy through specialized approximate nearest neighbor (ANN) indexes. The table below compares empirical benchmarks across three production configurations on 1,536-dimensional embeddings:</p>
        
        <table>
          <thead>
            <tr>
              <th>Vector Database</th>
              <th>Index Algorithm</th>
              <th>P99 Query Latency</th>
              <th>Recall @ 10</th>
              <th>Throughput (QPS)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Qdrant Cloud</td>
              <td>HNSW (Cosine)</td>
              <td>2.1 ms</td>
              <td>0.984</td>
              <td>4,250</td>
            </tr>
            <tr>
              <td>Pinecone Serverless</td>
              <td>Proprietary HNSW</td>
              <td>3.4 ms</td>
              <td>0.978</td>
              <td>3,800</td>
            </tr>
            <tr>
              <td>pgvector</td>
              <td>IVF-PQ (Inner Product)</td>
              <td>5.8 ms</td>
              <td>0.952</td>
              <td>1,920</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Idempotent Vector Upsert Implementation</h2>
        <p>Deterministic chunk identification enables efficient differential indexing. Using a 16-character SHA-256 hex digest of the canonical document URL, active section path, and normalized Markdown content guarantees that updates only overwrite modified sections:</p>

        <pre><code class="language-python">import hashlib

def generate_chunk_id(canonical_url: str, heading_path: list[str], content: str) -> str:
    seed = f"{canonical_url}::{' > '.join(heading_path)}::{content}"
    return hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]

def upsert_to_qdrant(client, collection: str, chunks: list[dict]):
    points = []
    for chunk in chunks:
        points.append({
            "id": chunk["chunkId"],
            "vector": chunk["embedding"],
            "payload": {
                "url": chunk["canonicalUrl"],
                "section": " > ".join(chunk["headingPath"]),
                "tokens": chunk["tokenCount"],
                "text": chunk["content"]
            }
        })
    return client.upsert(collection_name=collection, points=points)</code></pre>
      </section>

      <div class="newsletter-box">
        <h3>Subscribe to AI Systems Engineering</h3>
        <p>Join 45,000+ AI engineers receiving our weekly breakdown on retrieval systems and vector architectures.</p>
        <input type="email" placeholder="engineer@company.com" />
        <button type="button">Subscribe Free</button>
      </div>
    </article>
  </main>

  <!-- Cookie Consent Modal (Noise to strip) -->
  <div class="cookie-modal">
    <p>We use cookies to analyze user behavior, personalize content, and serve targeted advertisements. By clicking "Accept All", you consent to our data collection practices.</p>
    <button type="button">Accept All</button> <button type="button">Reject Non-Essential</button>
  </div>

  <!-- Mega Footer (Noise to strip) -->
  <footer class="footer">
    <p>&copy; 2026 AI Systems Engineering Review. All rights reserved. Reproduction without written permission is strictly prohibited.</p>
    <p><a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a> | <a href="/gdpr">GDPR Compliance</a> | <a href="/sitemap.xml">XML Sitemap</a></p>
  </footer>
</body>
</html>`;

// Code integration snippets
const CODE_SNIPPETS = {
  curl: `curl -X POST "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk" \\
  -H "Content-Type: application/json" \\
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \\
  -H "X-RapidAPI-Host: markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com" \\
  -d '{
    "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    "options": {
      "chunkSizeTokens": 512,
      "chunkOverlapTokens": 50,
      "includeLinks": true
    }
  }'`,
  python: `import requests

response = requests.post(
    "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk",
    headers={
        "Content-Type": "application/json",
        "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
        "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
    },
    json={
        "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
        "options": {
            "chunkSizeTokens": 512,
            "chunkOverlapTokens": 50
        }
    }
)

payload = response.json()["data"]
print(f"Extracted: {payload['metadata']['title']}")
print(f"Tokens Saved: {payload['cleaningStats']['compressionRatioPercentage']}%")

# Upsert semantic chunks into your vector database
for chunk in payload["chunks"]:
    print(f"[{chunk['chunkId']}] {' > '.join(chunk['headingPath'])} ({chunk['tokenCount']} tokens)")`,
  node: `const response = await fetch("https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
  },
  body: JSON.stringify({
    url: "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    options: {
      chunkSizeTokens: 512,
      chunkOverlapTokens: 50
    }
  })
});

const { data } = await response.json();
console.log(\`Title: \${data.metadata.title}\`);
console.log(\`Saved \${data.cleaningStats.compressionRatioPercentage}% tokens! Chunks: \${data.chunks.length}\`);`
};

// Studio State
let activeStudioData = null;
let customHtmlPayload = null;
let activeTab = 'chunks';
let activeSnippet = 'curl';

/**
 * Escapes unsafe characters for safe innerHTML injection
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Robust clipboard copy with textarea fallback and 2-second visual feedback
 */
function copyToClipboard(text, buttonEl, successText = '✓ Copied!') {
  if (!buttonEl) return;
  const originalHtml = buttonEl.innerHTML;

  const showSuccess = () => {
    buttonEl.innerHTML = `<span class="text-emerald-400 font-semibold">${successText}</span>`;
    setTimeout(() => {
      buttonEl.innerHTML = originalHtml;
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
      fallbackCopy(text);
      showSuccess();
    });
  } else {
    fallbackCopy(text);
    showSuccess();
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    // ignore
  }
  document.body.removeChild(textArea);
}

/**
 * Switch Studio Output Tab (Chunks, Markdown, JSON)
 */
function switchStudioTab(tab) {
  activeTab = tab;
  const tabs = ['chunks', 'markdown', 'json'];
  tabs.forEach((t) => {
    const btn = document.getElementById('tab-btn-' + t);
    const pane = document.getElementById('pane-' + t);
    if (!btn || !pane) return;

    if (t === tab) {
      btn.className =
        'px-3.5 py-1.5 text-xs font-mono font-medium segmented-pill-active transition-all cursor-pointer';
      pane.classList.remove('hidden');
    } else {
      btn.className =
        'px-3.5 py-1.5 text-xs font-mono font-medium segmented-pill-inactive transition-all cursor-pointer';
      pane.classList.add('hidden');
    }
  });
}

/**
 * Switch Code Integration Language Tab (cURL, Python, Node.js)
 */
function switchCodeTab(lang) {
  activeSnippet = lang;
  const langs = ['curl', 'python', 'node'];
  langs.forEach((l) => {
    const btn = document.getElementById('code-tab-' + l);
    if (!btn) return;

    if (l === lang) {
      btn.className =
        'px-3 py-1 text-xs font-mono font-medium segmented-pill-active transition-all cursor-pointer';
    } else {
      btn.className =
        'px-3 py-1 text-xs font-mono font-medium segmented-pill-inactive transition-all cursor-pointer';
    }
  });

  const codeBlock = document.getElementById('code-block');
  if (codeBlock && codeBlock.firstElementChild) {
    codeBlock.firstElementChild.textContent = CODE_SNIPPETS[lang] || '';
  }
}

/**
 * Preset: Load sample article into state and execute immediately
 */
function loadSampleArticle() {
  customHtmlPayload = SAMPLE_TECH_ARTICLE;
  const urlInput = document.getElementById('studio-url');
  if (urlInput) {
    urlInput.value = 'https://systems.example.ai/articles/modern-rag-architecture';
  }
  const badgeBar = document.getElementById('sample-badge-bar');
  if (badgeBar) {
    badgeBar.classList.remove('hidden');
  }
  runStudioExtraction();
}

/**
 * Preset: Clear sample article and reset URL input
 */
function clearSampleArticle() {
  customHtmlPayload = null;
  const badgeBar = document.getElementById('sample-badge-bar');
  if (badgeBar) {
    badgeBar.classList.add('hidden');
  }
  const urlInput = document.getElementById('studio-url');
  if (urlInput) {
    urlInput.value = 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation';
  }
}

/**
 * Render Friendly Error Card with 1-click fallback to sample tech article
 */
function renderErrorState(errorMessage) {
  const chunksPane = document.getElementById('pane-chunks');
  if (chunksPane) {
    chunksPane.innerHTML = `
      <div class="glass-surface p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-center">
        <div class="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-3">⚠️</div>
        <h3 class="text-white font-bold text-base mb-1">Extraction Blocked or Unreachable</h3>
        <p class="text-slate-300 text-xs font-mono mb-4 max-w-md mx-auto leading-relaxed">${escapeHtml(errorMessage)}</p>
        <button id="error-fallback-sample-btn" type="button" class="px-4 py-2 rounded-xl text-xs font-bold text-obsidian-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/20">
          Run Sample Tech Article Instead ⚡
        </button>
      </div>
    `;

    const fallbackBtn = document.getElementById('error-fallback-sample-btn');
    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', loadSampleArticle);
    }
  }
  switchStudioTab('chunks');
}

/**
 * Render Studio Results dynamically into cards, metrics, and code panes
 */
function renderStudioResults(data) {
  if (!data) return;

  // 1. Metric Cards
  const savings =
    data.cleaningStats?.compressionRatioPercentage ??
    data.tokenMetrics?.compressionRatioPercentage ??
    0;
  const savingsEl = document.getElementById('metric-savings');
  if (savingsEl) savingsEl.textContent = savings + '%';

  const score = data.qualityDiagnostics?.ragReadinessScore ?? 100;
  const scoreEl = document.getElementById('metric-score');
  if (scoreEl) scoreEl.textContent = score + ' / 100';

  const totalChunks = data.totalChunksGenerated || (data.chunks ? data.chunks.length : 0);
  const chunksEl = document.getElementById('metric-chunks');
  if (chunksEl) {
    chunksEl.textContent = totalChunks + (totalChunks === 1 ? ' Chunk' : ' Chunks');
  }

  const latency = data.meta?.execution_time_ms ?? 0;
  const latencyEl = document.getElementById('metric-latency');
  if (latencyEl) latencyEl.textContent = latency + ' ms';

  // 2. Chunks Pane
  const chunksContainer = document.getElementById('pane-chunks');
  if (chunksContainer) {
    chunksContainer.innerHTML = '';

    // Sleek anti-theft preview banner if chunks are capped on /v1/demo
    if (data.demoNotice) {
      const banner = document.createElement('div');
      banner.id = 'demo-cap-banner';
      banner.className =
        'mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-300 font-mono';
      banner.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-base">🔒</span>
          <span>${escapeHtml(data.demoNotice)} (${totalChunks} chunks generated)</span>
        </div>
        <a href="https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser" target="_blank" rel="noopener noreferrer" class="px-3 py-1 rounded-lg bg-amber-400 text-obsidian-950 font-bold hover:bg-amber-300 transition-colors">
          Unlock All Chunks on RapidAPI ⚡
        </a>
      `;
      chunksContainer.appendChild(banner);
    }

    if (data.chunks && data.chunks.length > 0) {
      data.chunks.forEach((chunk) => {
        const card = document.createElement('div');
        card.className =
          'glass-surface p-4 border border-white/[0.08] hover:border-emerald-500/40 transition-all rounded-xl mb-3';

        const breadcrumbs =
          chunk.headingPath && chunk.headingPath.length > 0
            ? chunk.headingPath.join(' › ')
            : 'Root Section';

        let badges = '';
        if (chunk.hasCodeBlock) {
          badges +=
            '<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Code Block</span> ';
        }
        if (chunk.hasTable) {
          badges +=
            '<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30">Table</span> ';
        }

        card.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.06]">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-xs font-semibold">Chunk #${chunk.index}</span>
              <span class="text-xs font-mono font-medium text-slate-300 truncate max-w-sm sm:max-w-md" title="${escapeHtml(breadcrumbs)}">${escapeHtml(breadcrumbs)}</span>
            </div>
            <div class="flex items-center gap-2">
              ${badges}
              <span class="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 font-mono text-[11px] border border-white/[0.08]">${chunk.tokenCount} tokens</span>
              <span class="px-2 py-0.5 rounded-md bg-white/[0.04] text-cyan-400 font-mono text-[11px] border border-white/[0.08]" title="16-char SHA-256 chunkId">${chunk.chunkId}</span>
            </div>
          </div>
          <pre class="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-black/60 p-3 rounded-lg border border-white/[0.04]"><code>${escapeHtml(chunk.content)}</code></pre>
        `;
        chunksContainer.appendChild(card);
      });
    } else {
      chunksContainer.innerHTML =
        '<p class="text-xs text-slate-400 font-mono text-center py-8">No semantic chunks generated.</p>';
    }
  }

  // 3. Markdown Output Pane
  const markdownEl = document.getElementById('markdown-output-text');
  if (markdownEl) {
    markdownEl.textContent = data.markdown || '';
  }

  // 4. JSON Diagnostics Pane
  const jsonEl = document.getElementById('json-output-text');
  if (jsonEl) {
    jsonEl.textContent = JSON.stringify(
      {
        metadata: data.metadata,
        qualityDiagnostics: data.qualityDiagnostics,
        cleaningStats: data.cleaningStats,
        meta: data.meta,
        sampleChunks: (data.chunks || []).slice(0, 2),
      },
      null,
      2
    );
  }
}

/**
 * Execute Studio Extraction via POST /v1/demo
 */
async function runStudioExtraction() {
  const urlEl = document.getElementById('studio-url');
  const urlInput = urlEl ? urlEl.value.trim() : '';
  const chunkSizeEl = document.getElementById('studio-chunk-size');
  const chunkSize = parseInt(chunkSizeEl?.value, 10) || 512;

  const submitBtn = document.getElementById('studio-submit-btn');
  const spinner = document.getElementById('studio-btn-spinner');
  const btnText = document.getElementById('studio-btn-text');

  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Extracting & Chunking...';

  const payload = {
    options: {
      chunkSizeTokens: chunkSize,
      chunkOverlapTokens: 50,
      includeLinks: true,
    },
  };

  if (customHtmlPayload) {
    payload.html = customHtmlPayload;
    payload.url = urlInput || 'https://systems.example.ai/articles/modern-rag-architecture';
  } else {
    payload.url = urlInput || 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation';
  }

  try {
    const response = await fetch('/v1/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(
        json.error?.message || json.message || `Server responded with HTTP ${response.status}`
      );
    }

    activeStudioData = json.data;
    renderStudioResults(json.data);
  } catch (err) {
    renderErrorState(err.message || 'Failed to extract content.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Extract & Chunk for RAG ⚡';
  }
}

/**
 * Initialize all Event Listeners cleanly upon DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Studio Submit button
  const submitBtn = document.getElementById('studio-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', runStudioExtraction);
  }

  // 2. Load Sample button
  const loadSampleBtn = document.getElementById('studio-load-sample-btn');
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', loadSampleArticle);
  }

  // 3. Clear Sample button
  const clearSampleBtn = document.getElementById('studio-clear-sample-btn');
  if (clearSampleBtn) {
    clearSampleBtn.addEventListener('click', clearSampleArticle);
  }

  // 4. URL input typing & Enter key
  const urlInput = document.getElementById('studio-url');
  if (urlInput) {
    urlInput.addEventListener('input', function () {
      if (
        customHtmlPayload &&
        this.value !== 'https://systems.example.ai/articles/modern-rag-architecture'
      ) {
        customHtmlPayload = null;
        const badgeBar = document.getElementById('sample-badge-bar');
        if (badgeBar) badgeBar.classList.add('hidden');
      }
    });

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runStudioExtraction();
      }
    });
  }

  // 5. Studio Output Tabs
  const tabChunks = document.getElementById('tab-btn-chunks');
  if (tabChunks) tabChunks.addEventListener('click', () => switchStudioTab('chunks'));

  const tabMarkdown = document.getElementById('tab-btn-markdown');
  if (tabMarkdown) tabMarkdown.addEventListener('click', () => switchStudioTab('markdown'));

  const tabJson = document.getElementById('tab-btn-json');
  if (tabJson) tabJson.addEventListener('click', () => switchStudioTab('json'));

  // 6. Studio Content Copy Button
  const studioCopyBtn = document.getElementById('studio-copy-btn');
  if (studioCopyBtn) {
    studioCopyBtn.addEventListener('click', function () {
      if (!activeStudioData) {
        alert('Please run an extraction first.');
        return;
      }
      let textToCopy = '';
      if (activeTab === 'markdown') {
        textToCopy = activeStudioData.markdown || '';
      } else if (activeTab === 'json') {
        textToCopy = JSON.stringify(activeStudioData, null, 2);
      } else {
        textToCopy = (activeStudioData.chunks || [])
          .map((c) => `[${c.chunkId}] ${c.headingPath.join(' > ')}\n${c.content}`)
          .join('\n\n---\n\n');
      }
      copyToClipboard(textToCopy, this, '✓ Copied!');
    });
  }

  // 7. Code Snippet Tabs
  const codeCurl = document.getElementById('code-tab-curl');
  if (codeCurl) codeCurl.addEventListener('click', () => switchCodeTab('curl'));

  const codePython = document.getElementById('code-tab-python');
  if (codePython) codePython.addEventListener('click', () => switchCodeTab('python'));

  const codeNode = document.getElementById('code-tab-node');
  if (codeNode) codeNode.addEventListener('click', () => switchCodeTab('node'));

  // 8. Code Copy Button
  const codeCopyBtn = document.getElementById('code-copy-btn');
  if (codeCopyBtn) {
    codeCopyBtn.addEventListener('click', function () {
      copyToClipboard(CODE_SNIPPETS[activeSnippet] || '', this, '✓ Copied!');
    });
  }

  // 9. Auto-Run on Page Load: Automatically trigger sample article run for instant live gratification
  loadSampleArticle();
});
