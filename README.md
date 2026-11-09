# MarkRAG v2.0 ⚡

> **Intelligent RAG Knowledge Preprocessor, Semantic Chunker & Web-to-Markdown Engine**  
> High-performance REST microservice in Node.js and Express designed to convert any web URL or raw HTML into clean, structured Markdown and pre-chunked semantic vectors for LLMs (OpenAI, Anthropic, Gemini) and Vector Databases (Pinecone, Qdrant, Milvus, Chroma, pgvector).

---

## 🚀 Key Features in v2.0

- **Hierarchy-Aware Semantic Chunking**: Respects `# H1`, `## H2`, `### H3` section trees. Never cuts across fenced code blocks (```` ``` ````) or markdown table rows. Every chunk includes parent section breadcrumbs (`headingPath`), contextual embedding prefix (`contextHeader`), and deterministic 16-character SHA-256 `chunkId`.
- **Metadata Intelligence**: Automatically infers title, author, canonical URL, publication/modification timestamps, domain, content type, markdown citations, and internal/external link breakdowns.
- **Content Quality Diagnostics**: Evaluates RAG readiness score (0–100), detects SPA JavaScript hydration shells, flags paywalls/login walls, and warns about thin content.
- **Mozilla Readability Extraction**: Extracts the true content body, author, publication date, and metadata using the same engine as Firefox Reader View (`@mozilla/readability`).
- **GFM Markdown Conversion**: Converts HTML to Markdown with support for tables, lists, and fenced code blocks with language tagging via `turndown` and `turndown-plugin-gfm`.
- **Token Efficiency (`strip_links` / `includeLinks`)**: Option to strip hyperlinks into plain text, reducing LLM token consumption by up to 20-30% additional savings.
- **Resilient Web Fetcher**:
  - Strict **5-second timeout** to prevent hanging requests.
  - Automatic decompression of **gzip, deflate, and brotli**.
  - **User-Agent rotation** mimicking modern Chrome, Safari, and Firefox browsers to prevent basic 403 blocks.
- **In-Memory LRU Cache**: 15-minute RAM cache (`lru-cache`) to instantly serve repeated requests in sub-2ms.
- **Dual Ingestion Paths**: Fetches any URL directly or parses user-supplied raw HTML strings.
- **Interactive Live RAG Studio**: Modern dark-mode SaaS UI (`GET /`) allowing live extraction, chunk inspection, and code generation.
- **RapidAPI Ready**: Proxy secret validation via `X-RapidAPI-Proxy-Secret` with free rate-limited demo endpoint (`POST /v1/demo`).

---

## 📁 Project Structure

```
markrag-api/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── docs.md                             # RapidAPI Technical Documentation
├── docs/
│   └── RAPIDAPI_STUDIO_DOCS.md         # Comprehensive RapidAPI Studio Documentation
├── public/
│   └── index.html                      # Interactive Live RAG Studio & Landing Page
├── src/
│   ├── app.js                          # Express application configuration
│   ├── server.js                       # Server entry point & graceful shutdown
│   ├── config/
│   │   └── index.js                    # Environment settings and constants
│   ├── controllers/
│   │   ├── chunk.controller.js         # Flagship extract-and-chunk handler
│   │   ├── extract.controller.js       # V1 extract endpoint handler
│   │   └── health.controller.js        # Health check handler
│   ├── middleware/
│   │   └── rapidapiAuth.js             # RapidAPI Proxy Secret auth & demo rate limiter
│   ├── middlewares/
│   │   ├── error.middleware.js         # Centralized error handler (400, 401, 422, 504, 500)
│   │   ├── security.middleware.js      # Re-export for backward compatibility
│   │   └── validation.middleware.js   # Zod request validators
│   ├── routes/
│   │   ├── extract.routes.js           # Routes for /v1/extract, /v1/extract-and-chunk, /v1/demo
│   │   ├── health.routes.js            # Routes for /health
│   │   ├── root.routes.js              # Landing page & JSON content negotiation
│   │   └── index.js                    # Route aggregator
│   ├── services/
│   │   ├── cache.service.js            # LRU Cache (15m TTL)
│   │   ├── chunker.service.js          # Hierarchy-aware semantic chunker
│   │   ├── cleaner.service.js          # Mozilla Readability & JSDOM parser
│   │   ├── fetcher.service.js          # Axios client with UA rotation & timeout
│   │   ├── intelligence.service.js     # Content intelligence & RAG diagnostics
│   │   ├── markdown.service.js         # Turndown + GFM converter
│   │   └── token.service.js            # LLM token & reading metrics estimator
│   └── utils/
│       ├── errors.js                   # Standardized AppError hierarchy
│       └── logger.js                   # Structured logger
└── test/
    ├── api.test.js                     # Root, health, and v1 endpoints integration tests
    ├── chunker.service.test.js         # Semantic chunking & breadcrumb tests
    ├── cleaner.service.test.js         # Parser & cleaner unit tests
    ├── extract-and-chunk.api.test.js   # Flagship v2 endpoint & studio tests
    ├── markdown.service.test.js        # Markdown conversion & GFM tests
    └── token.service.test.js           # Token calculations & metrics tests
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0 (Recommended: Node 20+)
- **npm**: >= 9.0.0

### Installation

```bash
git clone https://github.com/artuturoh/markrag-api.git
cd markrag-api
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for HTTP server |
| `NODE_ENV` | `development` | `development` or `production` |
| `RAPIDAPI_PROXY_SECRET` | *(empty)* | Optional. When defined, enforces `X-RapidAPI-Proxy-Secret` |
| `FETCH_TIMEOUT_MS` | `5000` | Strict timeout in milliseconds (5s) |
| `CACHE_TTL_MS` | `900000` | Cache time-to-live (15 minutes in ms) |
| `CACHE_MAX_ITEMS` | `1000` | Maximum items stored in LRU RAM cache |

---

## 🚦 Available Scripts

```bash
# Start server in development mode (hot reloading)
npm run dev

# Start server in production mode
npm start

# Run comprehensive test suite
npm test
```

---

## 📖 API Documentation

### Flagship Endpoint: `POST /v1/extract-and-chunk`

Extracts clean Markdown and computes hierarchy-aware semantic chunks with breadcrumbs and diagnostics.

#### Request Body
```json
{
  "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
  "options": {
    "chunkSizeTokens": 512,
    "chunkOverlapTokens": 50,
    "includeLinks": true,
    "includeImages": false,
    "stripBoilerplate": true
  }
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "markdown": "# Retrieval-augmented generation\n\nRetrieval-augmented generation (RAG)...",
    "metadata": {
      "title": "Retrieval-augmented generation",
      "author": null,
      "canonicalUrl": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
      "citation": {
        "markdown": "[Retrieval-augmented generation](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)",
        "text": "Retrieval-augmented generation - Wikipedia"
      },
      "linksSummary": { "internalCount": 24, "externalCount": 6, "sampleLinks": [...] }
    },
    "chunks": [
      {
        "index": 0,
        "chunkId": "4c9e8b1d2f0a5e73",
        "headingPath": ["Retrieval-augmented generation"],
        "contextHeader": "[Section: Retrieval-augmented generation]\n",
        "content": "# Retrieval-augmented generation\n\n...",
        "tokenCount": 185,
        "charCount": 740,
        "hasCodeBlock": false,
        "hasTable": false
      }
    ],
    "cleaningStats": {
      "rawHtmlBytes": 84250,
      "cleanMarkdownBytes": 3810,
      "tokensSaved": 20110,
      "compressionRatioPercentage": 95.5
    },
    "qualityDiagnostics": {
      "ragReadinessScore": 95,
      "status": "optimal",
      "flags": {
        "isEmptyOrThinContent": false,
        "requiresJavaScriptSpaShell": false,
        "possiblePaywallOrLoginWall": false,
        "hasStructuredHeadings": true
      },
      "warnings": []
    },
    "meta": {
      "execution_time_ms": 115,
      "timestamp": "2026-11-09T05:45:00.000Z",
      "version": "2.0.0"
    }
  }
}
```

---

## 🧪 Testing

The comprehensive test suite runs natively on Node.js using `node:test` and `supertest`:

```bash
npm test
```

Test coverage includes:
- **Root & Content Negotiation**: HTML landing page vs. JSON service descriptors.
- **Health & Monitoring**: System uptime, memory, and cache statistics.
- **Extraction & Parser**: Mozilla Readability, GFM table conversion, code blocks, boilerplate removal.
- **Semantic Chunker**: Section hierarchies (`H1 > H2 > H3`), code block and table atomic preservation, deterministic chunkId hashes.
- **Content Intelligence**: Quality diagnostics, SPA shell warnings, paywall flags.
- **Security & Rate Limiting**: `RAPIDAPI_PROXY_SECRET` enforcement on `/v1/*` while allowing `/v1/demo` with 15 req/min rate limit.

---

## 📄 License

MIT
