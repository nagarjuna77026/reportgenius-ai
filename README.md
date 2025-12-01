
# ReportGenius AI 📊

**Autonomous Enterprise Business Intelligence Agent**

ReportGenius AI is a professional-grade agentic application designed to automate the lifecycle of business reporting. It acts as an on-demand data analyst that collects raw data from various sources, performs reasoning-heavy analysis using **Google Gemini 2.5**, and generates interactive, boardroom-ready dashboards.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/frontend-React_18-61DAFB) ![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-8E44AD)

## 🚀 Features

*   **Sequential Multi-Agent Architecture**: A deterministic pipeline where specialized agents handle Data Collection, Analysis, Visualization, and Report Assembly independently.
*   **Deep Reasoning Engine**: Utilizes Chain-of-Thought (CoT) prompting with a defined thinking budget to ensure mathematical accuracy and deep insights when analyzing raw financial data.
*   **Interactive Dashboards**: Features dynamic charts (Recharts), drill-down capabilities, and predictive "What-If" modeling.
*   **Multi-Persona Executive Briefs**: Automatically generates distinct summaries tailored for CFOs (Financial), CROs (Revenue), and COOs (Operations).
*   **AI Data Assistant**: A built-in chat interface ("Chat with your Data") allowing users to query specific metrics and benchmarks using Google Search grounding.
*   **Enterprise Grade**: Includes session persistence, version history, dark mode, and role-based access simulation.

## 🏗️ Architecture

The application is built on a client-side Orchestrator pattern:

1.  **Data Collection Agent**: Ingests data from CSV uploads, REST APIs, or SQL/Mongo mocks.
2.  **Analysis Agent**: The "Brain" of the system. It sanitizes data and uses Gemini 2.5 Flash to generate a structured JSON analysis.
3.  **Visualization Agent**: Transforms analytical data into React-friendly structures for rendering.
4.  **Report Generation Agent**: Assembles the final artifacts, manages versioning, and applies templates.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: TailwindCSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Visualization**: Recharts
*   **Icons**: Lucide React

## 💻 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   A Google Cloud Project with the **Gemini API** enabled.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/report-genius-ai.git
    cd report-genius-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_gemini_api_key_here
    ```
    *(Alternatively, you can enter your API Key directly in the application Settings modal).*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Build for Production**
    ```bash
    npm run build
    ```

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

