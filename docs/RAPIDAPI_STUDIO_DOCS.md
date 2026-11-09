# MarkRAG v2.0 — Intelligent RAG Knowledge Preprocessor, Semantic Chunker & Web-to-Markdown Engine

> **The Developer-First Web Extraction & RAG Pipeline Engine**  
> RapidAPI Marketplace: [MarkRAG on RapidAPI](https://rapidapi.com/artuturoh/api/markrag-web-to-clean-markdown-and-rag-parser)  
> Host: `markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com`

---

## 1. Overview & Architecture

**MarkRAG v2.0** transforms unorganized, noisy web pages (articles, technical documentation, blogs, API references) into deterministic GitHub Flavored Markdown and pre-chunked semantic knowledge units ready for direct upsert into Vector Databases (**Pinecone, Qdrant, Milvus, Chroma, pgvector**).

### Key Upgrades in v2.0:
1. **Hierarchy-Aware Semantic Chunking**: Respects `# H1`, `## H2`, `### H3` section trees. Never cuts across fenced code blocks (```` ``` ````) or markdown table rows. Every chunk includes parent section breadcrumbs (`headingPath`), a contextual embedding prefix (`contextHeader`), and a deterministic 16-character SHA-256 `chunkId`.
2. **Metadata Intelligence**: Automatically infers title, author, canonical URL, publication/modification timestamps, domain, content type, markdown citations, and internal/external link breakdowns.
3. **Content Quality Diagnostics**: Evaluates RAG readiness score (0–100), detects SPA JavaScript hydration shells, flags paywalls/login walls, and warns about thin content.
4. **Token Optimization Analytics**: Compares raw HTML vs. clean Markdown bytes, estimating token savings and compression ratio (typically **85%–95% savings**).
5. **Anti-Bot & Stealth Engine**: Rotates real User-Agents (Chrome, Safari, Firefox), applies modern browser client headers, and handles `brotli`/`gzip` transparently with strict 5s timeout protection.
6. **Dual Ingestion Paths**: Fetches any URL directly or parses user-supplied raw HTML strings.

---

## 2. Authentication & Gateway Headers

Every request through RapidAPI must include your account's subscription headers:

| Header | Type | Required | Description |
|---|---|---|---|
| `X-RapidAPI-Key` | String | **Yes** | Your RapidAPI application key. |
| `X-RapidAPI-Host` | String | **Yes** | `markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com` |
| `Content-Type` | String | **Yes** | `application/json` |

---

## 3. Flagship Endpoint: `POST /v1/extract-and-chunk`

Extracts web content into structured GFM Markdown and pre-calculates semantic chunks with breadcrumb hierarchies.

### Request Body Schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | **Yes\*** | — | Target webpage URL. Required unless `html` is provided. |
| `html` | string | **Yes\*** | — | Raw HTML content string. Optional if `url` is provided. |
| `options` | object | No | `{}` | Pipeline configuration parameters. |
| `options.chunkSizeTokens` | integer | No | `512` | Target chunk token budget (min: 64, max: 4096). |
| `options.chunkOverlapTokens` | integer | No | `50` | Overlap token budget carried across adjacent chunks (min: 0, max: 500). |
| `options.includeLinks` | boolean | No | `true` | When `false`, converts markdown links to plain text to save tokens. |
| `options.includeImages` | boolean | No | `false` | When `false`, strips markdown images. |
| `options.stripBoilerplate` | boolean | No | `true` | Strips navigation menus, footers, ads, tracking pixels, and cookie popups. |

*\* Either `url` or `html` must be supplied in the request body.*

#### Request Example (`POST /v1/extract-and-chunk`)
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

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "markdown": "# Retrieval-augmented generation\n\nRetrieval-augmented generation (RAG) is a technique for enhancing the accuracy and reliability of generative AI models with facts fetched from external knowledge sources.\n\n## Architecture\n\nRAG architectures combine a dense vector search retriever with an autoregressive language model.\n\n### Vector Indexing\n\n| Engine | Vector Metric | Max QPS |\n| --- | --- | --- |\n| Qdrant | Cosine / Dot | 4,500 |\n| Pinecone | Cosine / Euclidean | 3,800 |\n",
    "metadata": {
      "title": "Retrieval-augmented generation",
      "description": "Overview of RAG systems, architecture, and dense vector retrieval.",
      "author": null,
      "publishedDate": "2024-03-15T08:30:00Z",
      "modifiedDate": null,
      "canonicalUrl": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
      "language": "en",
      "siteName": "Wikipedia",
      "domain": "en.wikipedia.org",
      "contentType": "article",
      "citation": {
        "markdown": "[Retrieval-augmented generation](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)",
        "text": "Retrieval-augmented generation - Wikipedia (2024-03-15)"
      },
      "linksSummary": {
        "internalCount": 24,
        "externalCount": 6,
        "sampleLinks": [
          "https://en.wikipedia.org/wiki/Language_model",
          "https://en.wikipedia.org/wiki/Cosine_similarity"
        ]
      }
    },
    "chunks": [
      {
        "index": 0,
        "chunkId": "4c9e8b1d2f0a5e73",
        "headingPath": ["Retrieval-augmented generation"],
        "contextHeader": "[Section: Retrieval-augmented generation]\n",
        "content": "# Retrieval-augmented generation\n\nRetrieval-augmented generation (RAG) is a technique for enhancing the accuracy and reliability of generative AI models with facts fetched from external knowledge sources.",
        "tokenCount": 54,
        "charCount": 216,
        "hasCodeBlock": false,
        "hasTable": false
      },
      {
        "index": 1,
        "chunkId": "9b1a4f8e2c0d3a56",
        "headingPath": ["Retrieval-augmented generation", "Architecture", "Vector Indexing"],
        "contextHeader": "[Section: Retrieval-augmented generation > Architecture > Vector Indexing]\n",
        "content": "### Vector Indexing\n\n| Engine | Vector Metric | Max QPS |\n| --- | --- | --- |\n| Qdrant | Cosine / Dot | 4,500 |\n| Pinecone | Cosine / Euclidean | 3,800 |",
        "tokenCount": 58,
        "charCount": 232,
        "hasCodeBlock": false,
        "hasTable": true
      }
    ],
    "cleaningStats": {
      "rawHtmlBytes": 84250,
      "cleanMarkdownBytes": 3810,
      "rawEstimatedTokens": 21062,
      "cleanEstimatedTokens": 952,
      "tokensSaved": 20110,
      "compressionRatioPercentage": 95.5,
      "removedElements": {
        "scripts": 22,
        "styles": 9,
        "navs": 3,
        "footers": 2,
        "adsAndTrackers": 6,
        "svgs": 14,
        "hiddenNodes": 5
      }
    },
    "tokenMetrics": {
      "rawHtmlBytes": 84250,
      "cleanMarkdownBytes": 3810,
      "rawEstimatedTokens": 21062,
      "cleanEstimatedTokens": 952,
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
      "execution_time_ms": 138,
      "timestamp": "2026-11-09T05:45:00.000Z",
      "version": "2.0.0"
    }
  }
}
```

---

## 4. Standard Extraction Endpoint: `POST /v1/parse` (or `POST /v1/extract`)

Returns standard clean Markdown without pre-splitting into chunk arrays.

#### Request Example (`POST /v1/parse`)
```json
{
  "url": "https://example.com/blog/rag-pipeline",
  "options": {
    "strip_links": true,
    "include_html": false,
    "cache": true
  }
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/blog/rag-pipeline",
    "title": "Building Production RAG Pipelines",
    "byline": "Jane Doe",
    "siteName": "Tech Engineering",
    "publishedTime": "2026-04-10T12:00:00Z",
    "excerpt": "Architecting resilient RAG systems with dense vector retrieval.",
    "markdown": "# Building Production RAG Pipelines\n\nVector databases index document chunks...",
    "metadata": {
      "wordCount": 1420,
      "readingTimeMinutes": 8,
      "characterCount": 8920,
      "estimatedTokens": 2230,
      "rawHtmlTokens": 28400,
      "tokensSaved": 26170,
      "savingsPercentage": 92.1,
      "cached": false,
      "responseTimeMs": 145
    }
  }
}
```

---

## 5. Enterprise Vector DB & LangChain Integrations

### 5.1. Python: LangChain & Qdrant Upsert Pipeline

```python
import os
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from langchain_core.documents import Document

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Step 1: Preprocess webpage with MarkRAG v2.0
response = requests.post(
    "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk",
    headers={
        "Content-Type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
    },
    json={
        "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
        "options": {"chunkSizeTokens": 512, "chunkOverlapTokens": 50}
    }
)
data = response.json()["data"]
metadata = data["metadata"]
chunks = data["chunks"]

print(f"RAG Readiness: {data['qualityDiagnostics']['ragReadinessScore']}/100")
print(f"Generated {len(chunks)} chunks from: {metadata['title']}")

# Step 2: Convert to LangChain Document format
documents = []
for chunk in chunks:
    doc = Document(
        page_content=chunk["contextHeader"] + chunk["content"],
        metadata={
            "chunkId": chunk["chunkId"],
            "url": metadata["canonicalUrl"],
            "title": metadata["title"],
            "headingPath": " > ".join(chunk["headingPath"]),
            "tokenCount": chunk["tokenCount"],
            "hasCodeBlock": chunk["hasCodeBlock"],
            "hasTable": chunk["hasTable"]
        }
    )
    documents.append(doc)

# Step 3: Upsert into Qdrant Vector DB
qdrant = QdrantClient(url="http://localhost:6333")
# Assuming embeddings are generated via your embedding model (e.g. OpenAI / Cohere)
# qdrant.upsert(collection_name="rag_kb", points=[...])
```

---

### 5.2. Python: Pinecone Serverless Upsert

```python
import os
import requests
from pinecone import Pinecone

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

res = requests.post(
    "https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk",
    headers={
        "Content-Type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com"
    },
    json={"url": "https://docs.pinecone.io/guides/get-started/overview"}
)
payload = res.json()["data"]

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("markrag-knowledge")

# Iterate over chunks and prepare vectors
vectors_to_upsert = []
for chunk in payload["chunks"]:
    # vector_embedding = embed_model.embed(chunk["content"])
    dummy_vector = [0.05] * 1536
    vectors_to_upsert.append({
        "id": chunk["chunkId"],
        "values": dummy_vector,
        "metadata": {
            "title": payload["metadata"]["title"],
            "url": payload["metadata"]["canonicalUrl"],
            "section": " > ".join(chunk["headingPath"]),
            "text": chunk["content"]
        }
    })

index.upsert(vectors=vectors_to_upsert, namespace="documentation")
print(f"Successfully upserted {len(vectors_to_upsert)} chunks to Pinecone!")
```

---

### 5.3. Node.js: Native Fetch & Vector DB Ingestion

```javascript
import { QdrantClient } from '@qdrant/js-client-rest';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function ingestWebpage(url) {
  // 1. Fetch clean Markdown and semantic chunks
  const res = await fetch(
    'https://markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com/v1/extract-and-chunk',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'markrag-web-to-clean-markdown-and-rag-parser.p.rapidapi.com'
      },
      body: JSON.stringify({
        url,
        options: { chunkSizeTokens: 512, includeLinks: true }
      })
    }
  );

  const { data } = await res.json();
  console.log(`Document: ${data.metadata.title}`);
  console.log(`Compression: ${data.cleaningStats.compressionRatioPercentage}% tokens saved`);
  console.log(`Semantic Chunks: ${data.chunks.length}`);

  // 2. Prepare payload for Qdrant or Pinecone
  const points = data.chunks.map((chunk) => ({
    id: chunk.chunkId,
    payload: {
      url: data.metadata.canonicalUrl,
      title: data.metadata.title,
      headingBreadcrumbs: chunk.headingPath,
      contextHeader: chunk.contextHeader,
      content: chunk.content,
      tokenCount: chunk.tokenCount
    }
  }));

  return points;
}

ingestWebpage('https://en.wikipedia.org/wiki/Retrieval-augmented_generation')
  .then((pts) => console.log(`Ready to upsert ${pts.length} vector points!`))
  .catch(console.error);
```

---

## 6. HTTP Error Handling & Diagnostics Codes

All errors return uniform JSON payloads:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Either url or html must be provided",
    "details": null
  }
}
```

| HTTP Status | Error Code (`code`) | Cause | Resolution |
|---|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Missing `url` and `html`, malformed URL, or unsupported protocol. | Ensure valid HTTP/HTTPS URL or non-empty HTML string is passed. |
| `400 Bad Request` | `INVALID_JSON` | Malformed JSON in request payload. | Check JSON syntax before sending request. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing or invalid RapidAPI key. | Check your RapidAPI subscription and `X-RapidAPI-Key` header. |
| `422 Unprocessable`| `UNPROCESSABLE_CONTENT` | Empty document, pure JS SPA shell, or aggressive bot challenge wall. | Ensure the target URL serves server-rendered HTML or use `html` parameter. |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED` | Exceeded limit on free `/v1/demo` endpoint (max 15 req/min). | Subscribe on RapidAPI for unrestricted production quota. |
| `502 Bad Gateway` | `FETCH_ERROR` | Upstream target domain DNS failure or target connection refused. | Verify target site is online and publicly accessible. |
| `504 Timeout` | `FETCH_TIMEOUT` | Upstream site took longer than 5,000ms to respond. | Upstream server is hanging or throttled. Retry or inspect URL. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected internal exception. | Contact support with timestamp and requested URL. |
