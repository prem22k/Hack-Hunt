# 🚀 HackHunt

**The Ultimate Hackathon Aggregator for Developers**

HackHunt is a centralized platform that aggregates hackathons and coding competitions from multiple sources—**MLH, Devpost, Kaggle, and Devfolio**—into a single, unified interface. Stop searching across ten different tabs; find your next challenge in one place.

![HackHunt Banner](https://images.unsplash.com/photo-1504384308090-c54be3855463?q=80&w=1200&auto=format&fit=crop)

## 🌟 Features

*   **Unified Discovery**: Browse hackathons from MLH, Devpost, Kaggle, and Devfolio in a single list.
*   **Smart Filtering**: Filter by **Mode** (Online/Offline), **Cost** (Free/Paid), **Skills** (Python, React, AI), and **Source**.
*   **Automated Scraping**: Our backend automatically scrapes and updates hackathon data every 24 hours.
*   **Rich Details**: View comprehensive details including prizes, dates, organizers, and registration links.
*   **Responsive Design**: Built with a mobile-first approach using Tailwind CSS and Shadcn UI.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS + Shadcn UI
*   **Deployment**: Vercel

### Backend
*   **Runtime**: Node.js + Express
*   **Database**: Google Firestore (NoSQL)
*   **Scraping**: Playwright (Headless Browser) + Cheerio
*   **Scheduling**: Node-Cron (Daily updates)
*   **Deployment**: Render (Dockerized)

## 🏗️ Architecture

HackHunt uses a decoupled architecture. The **Node.js backend** runs scheduled jobs to scrape data from external platforms, normalizes it, and stores it in **Firestore**. The **React frontend** consumes this data via a REST API.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm
*   Firebase Service Account Credentials

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/prem22k/Hack-Hunt.git
    cd Hack-Hunt
    ```

2.  **Backend Setup**
    ```bash
    cd server
    npm install
    
    # Create a .env file
    # PORT=5000
    # FIREBASE_SERVICE_ACCOUNT='{...your json credentials...}'
    # GROQ_API_KEY='gsk_...' (enables smart search + AI recommendations)
    # GROQ_MODEL (optional) — recommendations model, default: openai/gpt-oss-120b
    # GROQ_INTENT_MODEL (optional) — smart search intent parser model, default: openai/gpt-oss-20b
    
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd ..
    npm install
    npm run dev
    ```

4.  **Visit the App**
    Open `http://localhost:5173` to view the frontend.

## 🚢 Deployment

*   **Frontend**: Deployed on **Vercel**.
*   **Backend**: Deployed on **Render** using Docker to support Playwright browsers.
*   **Automation**: A cron job triggers the scraper daily to ensure fresh data.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
