# 🏙️ CitiAssist - Your Smart City Companion

![CitiAssist Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Tech](https://img.shields.io/badge/AI-Powered-purple) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

**CitiAssist** is an intelligent, AI-powered smart city guide designed to bridge the gap between citizens and urban infrastructure. Built with accessibility at its core, it helps users navigate city services, report civic issues, and understand complex government paperwork using advanced Generative AI.

---

## 🚀 Key Features

### 🤖 AI-Powered City Guide
*   **Context-Aware Chat**: Ask about hospitals, public transport, electricity, water, waste management, and government services.
*   **Hyper-Local Knowledge**: Provides specific details, map links, and official portal URLs.
*   **Scope Protection**: Strictly tailored to civic needs, filtering out irrelevant queries.
*   **Streaming Responses**: Enjoy a natural, typewriter-style conversational interface.

### 📸 Snap & Solve (AI Civic Reporter)
*   **Visual Complaint Drafting**: Spot a pothole or uncollected trash? Just snap a photo.
*   **Auto-Drafting**: The AI analyzes the image and instantly drafts a formal, polite complaint letter to the Municipal Commissioner, tailored for your location.

### 📄 Paperwork Simplifier
*   **Document Decoder**: Confused by a government form? Upload a photo of it.
*   **Step-by-Step Guides**: The AI identifies the document and explains exactly how to fill it out in simple language.

### 👴 Senior Citizen Mode
*   **Accessibility First**: A dedicated mode with high-contrast large text, simplified UI, and slower speech rates.
*   **Voice-First Interface**: Full voice command support and Text-to-Speech responses for users who prefer listening over reading.

### 🌏 Multilingual Support
*   **Language Detection**: Automatically detects and responds in **English, Hindi, and Telugu**.
*   **Localized Context**: optimized for Indian cities context.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS (Glassmorphism design)
*   **Speech**: Web Speech API (Recognition & Synthesis)
*   **Deployment**: Docker / Static Hosting

### Backend
*   **Server**: Flask (Python) with Gunicorn
*   **AI Model**: Google Gemini 2.5 Flash (via `google-generativeai`)
*   **Image Processing**: Pillow (PIL)
*   **Analysis**: Gemini Vision (Multimodal)

---

## 🏗️ Local Installation

### Prerequisites
*   Node.js & npm
*   Python 3.8+
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CitiAssist.git
cd CitiAssist
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up Environment Variables
# Create a .env file in the root directory
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the Server
python main.py
```

### 3. Frontend Setup
```bash
# Install Node dependencies
npm install

# Run the Development Server
npm run dev
```

Visit `http://localhost:5173` to view the application.

---

## 🐳 Docker Support (Recommended)

Run the entire stack in isolated containers with a single command.

1.  Ensure **Docker Desktop** is running.
2.  Make sure your `.env` file exists.
3.  Run:
    ```bash
    docker-compose up --build
    ```
4.  Access the app at `http://localhost:5173`.

---

## ☁️ Deployment (Render)

This project is configured for **Zero-Config Deployment** on Render.

1.  Push your code to GitHub.
2.  Log in to [Render](https://render.com).
3.  Create a new **Blueprint Instance**.
4.  Select your repository.
5.  Enter your `GEMINI_API_KEY` when prompted.
6.  Render will automatically deploy the Backend (Python/Gunicorn) and Frontend (React/Static) and link them together.

---

## 💡 Usage Examples

*   **Public Transport**: "What is the timing for the last metro from Hitech City?"
*   **Government Services**: "How do I apply for a PAN card?"
*   **Snap & Solve**: Upload a photo of a broken street light -> Get a complaint letter.
*   **Paperwork**: Upload a Driving License form -> Get filling instructions.

---

## 🤝 Contributing
Contributions are welcome! Please fork the repo and submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

**Made with ❤️ for Smart Cities.**
