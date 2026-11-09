# MarkRAG API — Technical Documentation

> **Web to Clean Markdown & RAG Parser for AI Agents and Vector Databases**  
> RapidAPI Marketplace: [MarkRAG Web to Clean Markdown and RAG Parser](https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser)

---

## 1. Overview

**MarkRAG API** is a high-performance REST microservice designed specifically for AI engineers, autonomous agents, and Retrieval-Augmented Generation (RAG) pipelines.

When feeding web pages (articles, technical blogs, API documentation) into Large Language Models (OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini 1.5/2.0) or Vector Databases (Pinecone, Qdrant, Milvus, Chroma, Weaviate), raw HTML introduces massive noise:
- Navigation bars, sidebars, cookie banners, tracking scripts, and footer links waste up to **80%–95% of your token budget**.
- Broken formatting degrades embedding quality and semantic similarity scores.
- Basic scrapers frequently hit HTTP `403 Forbidden` anti-bot walls.

**MarkRAG API solves this at scale:**
1. **Mozilla Readability Engine**: Uses the battle-tested Firefox Reader View parsing engine (`@mozilla/readability`) to isolate the true core article content.
2. **GitHub Flavored Markdown (GFM)**: Converts the clean DOM into clean GFM Markdown via `turndown` and `turndown-plugin-gfm`, preserving tables, task lists, and fenced code blocks with language tagging (e.g. ` ```python `, ` ```sql `).
3. **Token Minimizer (`strip_links`)**: Strips hyperlinks into plain text to save an additional 15%–30% in prompt token consumption.
4. **Anti-Bot Browser Emulation**: Uses real User-Agent rotation (Chrome, Safari, Firefox), full modern browser request headers, and native `brotli`/`gzip` decompression.
5. **Ultra-Low Latency In-Memory Cache**: Built-in 15-minute LRU Cache (`lru-cache`) delivering sub-2ms response times for repeated URLs.
6. **Built-in RAG Metrics**: Returns word counts, estimated reading time, approximate LLM tokens (~4 chars/token), and exact token savings percentages.

---

## 2. Authentication & Headers

All requests made through RapidAPI require authentication via the standard RapidAPI gateway headers:

| Header | Type | Required | Description |
|---|---|---|---|
| `X-RapidAPI-Key` | String | **Yes** | Your unique RapidAPI API key. |
| `X-RapidAPI-Host` | String | **Yes** | `markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com` |
| `Content-Type` | String | **Yes** (POST) | `application/json` |

---

## 3. API Endpoints

### 3.1. Primary Endpoint: `POST /v1/extract`

Extracts any web URL into clean, structured Markdown and calculates LLM token efficiency metrics.

#### Request URL
```http
POST https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract
```

#### Request Headers
```http
Content-Type: application/json
X-RapidAPI-Key: YOUR_RAPIDAPI_KEY
X-RapidAPI-Host: markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com
```

#### Request Body Schema (JSON)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | **Yes** | — | Target webpage URL. Must be a valid URL with `http://` or `https://` protocol. |
| `options` | object | No | `{}` | Optional extraction configuration settings. |
| `options.strip_links` | boolean | No | `false` | When `true`, converts `<a>` tags into plain text (e.g., `[text](url)` $\to$ `text`). Highly recommended for RAG pipelines to save tokens. |
| `options.include_html` | boolean | No | `false` | When `true`, includes the sanitized HTML produced by Mozilla Readability in `data.content`. |
| `options.cache` | boolean | No | `true` | When `true`, checks and populates the 15-minute in-memory LRU cache. |
| `options.user_agent` | string | No | *(auto)* | Custom User-Agent string to override the automated browser rotation pool. |

#### Request Body Example
```json
{
  "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
  "options": {
    "strip_links": true,
    "include_html": false,
    "cache": true
  }
}
```

---

#### Response Schema (`200 OK`)

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Indicates if the extraction was successful (`true`). |
| `data.url` | string | The final canonical URL (after following redirects). |
| `data.title` | string | Article or document title. |
| `data.byline` | string \| null | Author or publisher name. |
| `data.siteName` | string \| null | Website brand name (e.g., "Wikipedia", "TechCrunch"). |
| `data.publishedTime` | string \| null | ISO 8601 publication date extracted from OpenGraph, schema.org, or time tags. |
| `data.lang` | string \| null | Language code of the document (e.g., `en`, `es`). |
| `data.dir` | string \| null | Text directionality (`ltr` or `rtl`). |
| `data.excerpt` | string \| null | Short summary or description of the article. |
| `data.markdown` | string | Clean, structured GitHub Flavored Markdown (GFM). |
| `data.content` | string | Clean sanitized HTML (only present if `options.include_html` is `true`). |
| `data.metadata` | object | RAG & token optimization metrics. |
| `data.metadata.wordCount` | number | Total word count of the cleaned text. |
| `data.metadata.readingTimeMinutes` | number | Estimated reading time in minutes (based on 200 WPM). |
| `data.metadata.characterCount` | number | Character count of the final Markdown. |
| `data.metadata.estimatedTokens` | number | Estimated LLM tokens of the clean Markdown (~4 characters/token). |
| `data.metadata.rawHtmlCharacterCount` | number | Character count of the original raw HTML. |
| `data.metadata.rawHtmlTokens` | number | Estimated tokens of the original raw HTML. |
| `data.metadata.tokensSaved` | number | Raw tokens saved (`rawHtmlTokens - estimatedTokens`). |
| `data.metadata.savingsPercentage` | number | Percentage of tokens saved (e.g., `91.4`). |
| `data.metadata.cached` | boolean | `true` if served from the 15-minute RAM cache, `false` if freshly fetched. |
| `data.metadata.responseTimeMs` | number | Processing time in milliseconds. |

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    "title": "Retrieval-augmented generation",
    "byline": null,
    "siteName": "Wikipedia",
    "publishedTime": "2024-03-15T08:30:00Z",
    "lang": "en",
    "dir": "ltr",
    "excerpt": "Retrieval-augmented generation (RAG) is a technique for enhancing LLMs with external knowledge.",
    "markdown": "# Retrieval-augmented generation\n\n**Retrieval-augmented generation (RAG)** is a technique for enhancing the accuracy and reliability of generative AI models with information fetched from external knowledge sources.\n\n## Architecture Overview\n\nRAG architectures consist of two primary phases:\n\n1. **Retrieval**: Querying a dense vector index for top-k semantically relevant chunks.\n2. **Generation**: Injecting retrieved chunks into the LLM prompt context.\n\n### Model Comparison\n\n| Model Type | Hallucination Rate | Knowledge Freshness |\n| --- | --- | --- |\n| Pure LLM | Higher | Static (Training Cutoff) |\n| RAG-Augmented | Lower | Real-Time Dynamic |\n",
    "metadata": {
      "wordCount": 850,
      "readingTimeMinutes": 5,
      "characterCount": 5420,
      "estimatedTokens": 1355,
      "rawHtmlCharacterCount": 88400,
      "rawHtmlTokens": 22100,
      "tokensSaved": 20745,
      "savingsPercentage": 93.9,
      "cached": false,
      "responseTimeMs": 182
    }
  }
}
```

---

### 3.2. Fast Query Endpoint: `GET /v1/extract`

Ideal for quick browser testing, cURL queries, RSS aggregators, or read-it-later utilities.

#### Request URL
```http
GET https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract?url=https%3A%2F%2Fexample.com%2Farticle&strip_links=true
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | **Yes** | — | Target URL (URL-encoded). |
| `strip_links` | boolean | No | `false` | Pass `true` or `1` to strip links to plain text. |
| `include_html` | boolean | No | `false` | Pass `true` or `1` to include clean HTML in output. |
| `cache` | boolean | No | `true` | Pass `false` or `0` to bypass the cache. |

---

### 3.3. Health Check: `GET /health`

Public endpoint designed for uptime monitoring, heartbeat checks, and cloud keep-alive pingers.

#### Request URL
```http
GET https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/health
```

#### Response Example (`200 OK`)
```json
{
  "status": "ok",
  "service": "MarkRAG API",
  "version": "1.0.0",
  "uptimeSeconds": 14520,
  "timestamp": "2024-11-06T18:00:00.000Z",
  "memory": {
    "rssMb": 52,
    "heapTotalMb": 34,
    "heapUsedMb": 24
  },
  "cache": {
    "activeEntries": 87
  }
}
```

---

## 4. Code Examples

### 4.1. Python (`requests`)

```python
import os
import requests

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY")
ENDPOINT = "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract"

headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
}

payload = {
    "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    "options": {
        "strip_links": True,     # Recommended: save LLM tokens
        "include_html": False,
        "cache": True
    }
}

response = requests.post(ENDPOINT, json=payload, headers=headers, timeout=10)

if response.status_code == 200:
    res_data = response.json()
    data = res_data["data"]
    metrics = data["metadata"]
    
    print(f"Title: {data['title']}")
    print(f"Estimated Tokens: {metrics['estimatedTokens']} (Saved: {metrics['savingsPercentage']}%)")
    print(f"Latency: {metrics['responseTimeMs']}ms (Cached: {metrics['cached']})\n")
    print("--- Markdown Content Preview ---")
    print(data["markdown"][:500] + "...")
else:
    print(f"Error {response.status_code}: {response.text}")
```

---

### 4.2. Node.js (Modern Native `fetch`)

```javascript
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "YOUR_RAPIDAPI_KEY";
const ENDPOINT = "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract";

async function extractWebpage(url) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
    },
    body: JSON.stringify({
      url,
      options: {
        strip_links: true,
        include_html: false,
        cache: true
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`API Error [${result.error?.code}]: ${result.error?.message}`);
  }

  const { title, markdown, metadata } = result.data;
  console.log(`Extracted: "${title}"`);
  console.log(`Tokens: ${metadata.estimatedTokens} (Savings: ${metadata.savingsPercentage}%)`);
  return markdown;
}

extractWebpage("https://en.wikipedia.org/wiki/Retrieval-augmented_generation")
  .then((md) => console.log(md.slice(0, 300) + "..."))
  .catch(console.error);
```

---

### 4.3. Node.js (`axios`)

```javascript
import axios from "axios";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "YOUR_RAPIDAPI_KEY";

const client = axios.create({
  baseURL: "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com",
  headers: {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
  },
  timeout: 10000
});

async function run() {
  try {
    const res = await client.post("/v1/extract", {
      url: "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
      options: { strip_links: true }
    });

    console.log("Success:", res.data.data.title);
    console.log("Tokens saved:", res.data.data.metadata.tokensSaved);
  } catch (err) {
    console.error("Failed:", err.response?.data || err.message);
  }
}

run();
```

---

### 4.4. cURL

```bash
curl -X POST "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com" \
  -d '{
    "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    "options": {
      "strip_links": true,
      "cache": true
    }
  }'
```

---

## 5. Error Handling & HTTP Status Codes

MarkRAG API follows standard REST principles and returns uniform JSON error payloads for all non-2xx responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "URL must use HTTP or HTTPS protocol",
    "details": [
      {
        "field": "url",
        "message": "URL must use HTTP or HTTPS protocol"
      }
    ]
  }
}
```

### HTTP Status Code Reference

| Status Code | Error Code (`code`) | Cause | How to Resolve |
|---|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Missing `url` parameter, malformed URL, or unsupported protocol (e.g. `ftp://`). | Ensure the `url` string begins with `http://` or `https://` and is properly formatted. |
| `400 Bad Request` | `INVALID_JSON` | Malformed JSON in the request body. | Validate your JSON syntax before sending the request. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing or invalid `X-RapidAPI-Key`. | Check your RapidAPI subscription and verify that your API key is correctly passed. |
| `422 Unprocessable` | `UNPROCESSABLE_CONTENT` | The target page loaded, but contains no extractable article text (e.g., pure JavaScript SPAs without SSR, captcha challenge pages, or empty documents). | Verify that the target URL serves server-rendered HTML or plain article content. |
| `502 Bad Gateway` | `FETCH_ERROR` | Upstream target domain could not be resolved (DNS failure) or target server refused the connection. | Check if the target site is online and publicly accessible over the public internet. |
| `504 Gateway Timeout`| `FETCH_TIMEOUT` | The target server took longer than 5,000ms to respond. | The target server is either overloaded, geo-blocking, or hanging. Retry or inspect the URL. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | An unexpected internal error occurred. | Contact support with the timestamp and requested URL. |

---

## 6. RAG & LLM Best Practices

### 1. Always set `options.strip_links = true` for LLM Prompts
Hyperlinks in web documents often contain long tracking parameters (`utm_source`, query strings) and URLs. In a 2,000-word article, links can account for **500 to 1,500 extra tokens**. Unless your AI agent specifically needs to crawl referenced links, strip them to save costs and reduce latency.

### 2. Leverage Heading-Based Chunking
MarkRAG outputs consistent ATX-style Markdown headings (`#`, `##`, `###`). When chunking documents for embedding models (e.g. OpenAI `text-embedding-3-small`, Cohere `embed-v3`, Voyage AI):
- Use markdown header splitters (such as LangChain's `MarkdownHeaderTextSplitter` or LlamaIndex `MarkdownNodeParser`) to ensure each vector chunk retains semantic section context.

### 3. Use Metadata for Vector Pre-Filtering
Use `data.publishedTime`, `data.siteName`, and `data.byline` as vector metadata payload attributes. This enables hybrid search queries like:
> *"Retrieve articles from techcrunch.com published after January 2024 about quantum computing."*

### 4. Cache Behavior
By default, identical requests within a 15-minute window are served directly from RAM cache (`metadata.cached: true`), responding in `< 2ms` with zero upstream network overhead.

---

## 7. Support & Feedback

- **RapidAPI Page**: [MarkRAG on RapidAPI](https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser)
- **Status Endpoint**: Check uptime anytime at `GET /health`.
