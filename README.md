# MarkRAG API ⚡

High-performance REST microservice in Node.js and Express designed to convert any web URL (articles, technical blogs, documentation) into clean, structured Markdown optimized for LLMs (OpenAI, Anthropic, Gemini) and Vector Databases (Pinecone, Qdrant, Milvus, Chroma).

It strips navigation menus, ads, sidebars, cookie banners, and footers using Mozilla Readability (the Firefox Reader View engine), converts the clean DOM into GitHub Flavored Markdown (GFM) with tables and code blocks, and computes RAG token savings metrics.

---

## 🚀 Key Features

- **Mozilla Readability Extraction**: Extracts the true content body, author, publication date, and metadata using the same engine as Firefox Reader View.
- **GFM Markdown Conversion**: Converts HTML to Markdown with support for tables, lists, and fenced code blocks with language tagging via `turndown` and `turndown-plugin-gfm`.
- **Token Efficiency (`strip_links`)**: Option to strip hyperlinks into plain text, reducing LLM token consumption by up to 20-30% additional savings.
- **Resilient Web Fetcher**:
  - Strict **5-second timeout** to prevent hanging requests.
  - Automatic decompression of **gzip, deflate, and brotli**.
  - **User-Agent rotation** mimicking modern Chrome, Safari, and Firefox browsers to prevent basic 403 blocks.
- **In-Memory LRU Cache**: 15-minute RAM cache (`lru-cache`) to instantly serve repeated requests.
- **RAG & Token Metrics**: Calculates word count, estimated reading time, LLM token approximations (~4 chars/token), and savings percentage vs raw HTML.
- **RapidAPI Ready**: Optional proxy secret validation via `X-RapidAPI-Proxy-Secret`.
- **Production Hardened**: Native ES Modules, Express 5, Helmet, CORS, centralized error handling, and graceful shutdown (`SIGTERM`/`SIGINT`).

---

## 📁 Project Structure

```
markrag-api/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── src/
│   ├── app.js                          # Express application configuration
│   ├── server.js                       # Server entry point & graceful shutdown
│   ├── config/
│   │   └── index.js                    # Environment settings and constants
│   ├── controllers/
│   │   ├── extract.controller.js       # Extract endpoint handler
│   │   └── health.controller.js        # Health check handler
│   ├── middlewares/
│   │   ├── error.middleware.js         # Centralized error handler (400, 422, 504, 500)
│   │   ├── security.middleware.js      # X-RapidAPI-Proxy-Secret validator
│   │   └── validation.middleware.js   # Zod request validators
│   ├── routes/
│   │   ├── extract.routes.js           # Routes for /v1/extract
│   │   ├── health.routes.js            # Routes for /health
│   │   └── index.js                    # Route aggregator
│   ├── services/
│   │   ├── cache.service.js            # LRU Cache (15m TTL)
│   │   ├── cleaner.service.js          # Mozilla Readability & JSDOM parser
│   │   ├── fetcher.service.js          # Axios client with UA rotation & timeout
│   │   ├── markdown.service.js         # Turndown + GFM converter
│   │   └── token.service.js            # LLM token & reading metrics estimator
│   └── utils/
│       ├── errors.js                   # Standardized AppError hierarchy
│       └── logger.js                   # Structured logger
└── test/
    ├── api.test.js                     # Endpoint integration tests
    ├── cleaner.service.test.js         # Parser & cleaner unit tests
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
git clone https://github.com/your-username/markrag-api.git
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
| `PORT` | `3000` | Port for the HTTP server |
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

### 1. Extract Article (`POST /v1/extract`)

Main endpoint for extracting clean Markdown and RAG metadata.

#### Request Headers
```http
Content-Type: application/json
X-RapidAPI-Proxy-Secret: <your-secret> (optional, if configured)
```

#### Request Body
```json
{
  "url": "https://example.com/blog/vector-search",
  "options": {
    "strip_links": true,
    "include_html": false,
    "cache": true
  }
}
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | **Yes** | - | Target URL (must use `http://` or `https://`) |
| `options.strip_links` | boolean | No | `false` | When `true`, strips hyperlinks into plain text to save tokens |
| `options.include_html` | boolean | No | `false` | When `true`, includes Readability's clean HTML in the response |
| `options.cache` | boolean | No | `true` | When `true`, checks and populates the 15-minute in-memory cache |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/blog/vector-search",
    "title": "Introduction to Vector Search",
    "byline": "Alice Smith",
    "siteName": "AI Engineering",
    "publishedTime": "2024-04-10T10:00:00Z",
    "lang": "en",
    "dir": null,
    "excerpt": "Vector search is fundamental to semantic search and RAG...",
    "markdown": "# Introduction to Vector Search\n\nVector search is fundamental to semantic search...",
    "metadata": {
      "wordCount": 1250,
      "readingTimeMinutes": 7,
      "characterCount": 7820,
      "estimatedTokens": 1955,
      "rawHtmlCharacterCount": 85400,
      "rawHtmlTokens": 21350,
      "tokensSaved": 19395,
      "savingsPercentage": 90.8,
      "cached": false,
      "responseTimeMs": 142
    }
  }
}
```

---

### 2. Fast Extract (`GET /v1/extract`)

Quick GET endpoint for browsers, simple cURL, or feed readers.

```bash
curl -X GET "http://localhost:3000/v1/extract?url=https://example.com/article&strip_links=true"
```

---

### 3. Health Check (`GET /health`)

Designed for cloud keep-alive (Render, Railway) and uptime monitoring.

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "MarkRAG API",
  "version": "1.0.0",
  "uptimeSeconds": 3600,
  "timestamp": "2024-11-06T04:16:00.000Z",
  "memory": {
    "rssMb": 48,
    "heapTotalMb": 32,
    "heapUsedMb": 24
  },
  "cache": {
    "activeEntries": 42
  }
}
```

---

## 🛡️ Error Handling & Status Codes

All errors follow a standardized JSON format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "URL must use HTTP or HTTPS protocol",
    "details": null
  }
}
```

| HTTP Code | Error Code | Cause |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Missing or invalid URL format / non-http protocol |
| `401` | `UNAUTHORIZED` | Missing or invalid `X-RapidAPI-Proxy-Secret` |
| `422` | `UNPROCESSABLE_CONTENT` | Empty document, pure JS SPA requiring browser rendering, or paywall |
| `502` | `FETCH_ERROR` | DNS resolution failure or target server refused connection |
| `504` | `FETCH_TIMEOUT` | Target URL took longer than 5 seconds to respond |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected internal server exception |

---

## 🧪 Testing

The test suite runs natively on Node.js using `node:test` with zero external test runners:

```bash
npm test
```

Test coverage includes:
- **Clean Service**: Content parsing, metadata extraction, stripping navigation/ads, edge cases.
- **Markdown Service**: GFM tables, fenced code blocks with language annotations, `strip_links` behavior, newline normalization.
- **Token Service**: Word count, reading time estimation, token calculations (~4 chars/token), token savings percentage.
- **Endpoints & Security**: Zod validation, RapidAPI proxy secret verification, LRU caching, POST and GET methods.

---

## 📄 License

MIT
