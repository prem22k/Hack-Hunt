# HackHunt Technical Documentation

## 1. Executive Summary
**HackHunt** is a centralized aggregation platform designed to streamline the discovery of hackathons and coding competitions. By unifying data from fragmented sources—Major League Hacking (MLH), Devpost, Kaggle, and Devfolio—into a single, normalized interface, HackHunt significantly reduces the search friction for developers and students.

## 2. System Architecture

The application follows a decoupled **Client-Server architecture**, leveraging cloud-native services for scalability and maintenance.

### 2.1 High-Level Diagram
```mermaid
graph TD
    User[User Client] -->|HTTPS| Frontend[React SPA (Vercel)]
    Frontend -->|REST API| Backend[Node.js API (Render)]
    Backend -->|Read/Write| DB[(Firestore NoSQL)]
    
    subgraph "Data Ingestion Layer"
        Cron[Node-Cron Scheduler] -->|Trigger| Scrapers
        Scrapers -->|Playwright/Axios| Sources
        Sources --> MLH[MLH]
        Sources --> Devpost[Devpost]
        Sources --> Kaggle[Kaggle]
        Sources --> Devfolio[Devfolio]
    end
    
    Scrapers -->|Normalize & Upsert| DB
```

## 3. Technology Stack

### 3.1 Frontend (`/src`)
*   **Framework**: React 18 with TypeScript
*   **Build Tool**: Vite (for high-performance HMR and bundling)
*   **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
*   **State Management**: React Query (Server state), React Context (Client state)
*   **Routing**: React Router DOM v6
*   **Deployment**: Vercel (Edge Network)

### 3.2 Backend (`/server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: Google Firestore (via `firebase-admin`)
*   **Scraping Engine**: 
    *   **Playwright**: For dynamic, JavaScript-heavy sites (MLH, Devfolio).
    *   **Axios/Cheerio**: For static HTML parsing and API consumption (MLH, Kaggle, Devpost's public JSON endpoint).
*   **Scheduling**: `node-cron` for internal job scheduling.
*   **Deployment**: Render (Docker Container).

## 4. Data Ingestion & Scraping Strategy

The core value of HackHunt lies in its robust data ingestion pipeline.

### 4.1 Scraper Implementation
Each source has a dedicated service module implementing a standardized `NormalizedHackathon` interface.

| Source | Method | Strategy |
| :--- | :--- | :--- |
| **MLH** | API/Static | Direct HTTP requests to MLH public endpoints. |
| **Kaggle** | API | Consumes Kaggle's public API for competitions. |
| **Devpost** | JSON API | Reads Devpost's public `devpost.com/api/hackathons` endpoint with Axios (pages 1–3, `status[]=upcoming&status[]=open`); no headless browser needed. |
| **Devfolio** | Playwright | Headless browser automation to bypass client-side rendering. |

### 4.2 Data Normalization
Raw data from disparate sources is mapped to a unified schema before storage:
```typescript
interface NormalizedHackathon {
  title: string;
  organizer: string;
  startDate: Date;
  endDate: Date;
  mode: 'online' | 'offline' | 'hybrid';
  isPaid: boolean;
  source: 'mlh' | 'kaggle' | 'devpost' | 'devfolio';
  // ...
}
```

### 4.3 Scheduling & Persistence
*   **Frequency**: Data is refreshed every 24 hours (00:00 UTC).
*   **Persistence**: Data is stored in Firestore. We use an **upsert** strategy based on a composite key (`source` + `slug`) to prevent duplicates while updating existing entries.
*   **Keep-Alive**: An external cron service (cron-job.org) hits the `/api/hackathons/scrape` endpoint to prevent the Render free-tier instance from sleeping through its scheduled jobs.

## 5. API Reference

### Base URL
`https://hackhunt-api.onrender.com/api`

### Endpoints

#### `GET /hackathons`
Retrieves a paginated list of hackathons.
*   **Query Params**:
    *   `mode`: `online` | `offline` | `hybrid`
    *   `isPaid`: `true` | `false`
    *   `skills`: Comma-separated list (e.g., `python,react`)
    *   `source`: Filter by origin platform.

#### `GET /hackathons/:id`
Retrieves detailed metadata for a specific hackathon.

#### `POST /hackathons/scrape`
Manually triggers the background scraping job.
*   **Response**: `200 OK` (Async operation started).

## 6. Deployment & DevOps

### 6.1 Docker Configuration
The backend is containerized to ensure a consistent environment for Playwright, which requires specific system dependencies (browsers, libraries).

**Dockerfile Highlights**:
*   Base Image: `mcr.microsoft.com/playwright:v1.40.0-jammy`
*   Ensures all browser binaries are pre-installed.
*   Exposes port 5000.

### 6.2 CI/CD Pipeline
*   **Frontend**: Automatic deployments via Vercel upon push to `main`.
*   **Backend**: Automatic builds and deployments via Render upon push to `main`.

## 7. Local Development Setup

1.  **Clone Repository**:
    ```bash
    git clone https://github.com/prem22k/Hack-Hunt.git
    cd Hack-Hunt
    ```

2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create .env file with the credentials from the table below
    npm run dev
    ```

    #### 7.1 Environment Variables (`.env`)

    | Variable | Required | Default | Description |
    | :--- | :--- | :--- | :--- |
    | `PORT` | No | `5000` | Port the Express server binds to. |
    | `FIREBASE_SERVICE_ACCOUNT` | Yes (prod) | – | Serialized Firebase service-account JSON; falls back to `server/service-account.json` locally. |
    | `KAGGLE_USERNAME` / `KAGGLE_KEY` | No | – | Kaggle API credentials (falls back to `kaggle.json`). Without them the Kaggle scraper is skipped. |
    | `GROQ_API_KEY` | No | – | Groq API key. Enables smart-search intent parsing and AI recommendations; without it smart search falls back to unparsed queries and recommendations returns an empty list. |
    | `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Groq model powering AI recommendations. |
    | `GROQ_INTENT_MODEL` | No | `openai/gpt-oss-20b` | Groq model powering smart-search intent parsing. |

    > Both Groq overrides are `text` models that support `response_format: { type: "json_object" }`. The gpt-oss models spend tokens on reasoning before answering, so any `max_tokens` / `max_completion_tokens` set for these requests must be ≥ 2048 to avoid truncating the JSON response.

3.  **Frontend Setup**:
    ```bash
    cd ..
    npm install
    npm run dev
    ```

## 8. Future Roadmap
*   **User Authentication**: Personalized bookmarks and alerts.
*   **AI Recommendations**: Vector search based on user skills.
*   **Team Formation**: Real-time chat for finding teammates.
