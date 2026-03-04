# 🏙️ CitiAssist - AI-Powered Smart City Companion

<div align="center">
  <img src="public/logo.svg" alt="CitiAssist Logo" width="120" height="120" />
  <br />
  <br />

  [![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)](https://github.com/teja16asv/CitiAssist-Final)
  [![Tech](https://img.shields.io/badge/AI-Gemini%202.5-purple?style=for-the-badge)](https://deepmind.google/technologies/gemini/)
  [![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Python-blue?style=for-the-badge)](https://react.dev/)
  [![Platform](https://img.shields.io/badge/Platform-PWA%20%7C%20Web-green?style=for-the-badge)](https://web.dev/progressive-web-apps/)

  <p align="center">
    <b>Bridging the gap between citizens and urban infrastructure through Generative AI.</b>
    <br />
    <i>Accessible • Multilingual • Action-Oriented</i>
  </p>
</div>

---

## 📖 Overview

**CitiAssist** is a next-generation civic engagement platform designed to simplify urban living. It leverages **Multimodal AI** (Vision + Text + Voice) to help citizens navigate government services, report civic issues instantly, and understand complex paperwork. 

Unlike traditional grievance portals, CitiAssist is **proactive and accessible**, featuring a dedicated **Senior Mode** for elderly citizens and **Multilingual Support** (English, Hindi, Telugu) to cater to diverse demographics.

---

## 🔬 Research Basis

This project is grounded in cutting-edge research on **AI in Governance** and **Inclusive Smart Cities**.

*   **Core Framework**: Based on *"Artificial Intelligence in Smart Cities: A Systematic Review"*, utilizing AI to enhance citizen engagement and service delivery efficiency.
*   **Civic Issue Detection**: Implements concepts from *"Deep Learning for Automatic Detection and Classification of Urban Defects"*, using Computer Vision to analyze user-uploaded photos of potholes, waste, and infrastructure damage.
*   **Accessibility**: Adheres to principles from *"Designing Inclusive Smart Cities: Accessibility for the Elderly"*, featuring high-contrast UIs, simplified navigation, and voice-first interactions.

---

## 🚀 Key Features

### 1. 🤖 Context-Aware City Guide
*   **Intelligent Chatbot**: Answers queries about hospitals, metros, electricity bills, and more using real-time context.
*   **Hyper-Local**: tailored for Indian cities (e.g., Hyderabad), providing relevant location-based data.
*   **Streaming Responses**: Delivers information in a natural, conversational typewriter style.

### 2. 📸 Snap & Solve (AI Civic Reporter)
*   **Visual Complaint Drafting**: Users can upload a photo of a civic issue (e.g., a broken streetlight).
*   **Auto-Location**: Automatically captures GPS coordinates to pinpoint the issue.
*   **Formal Letter Generation**: The AI analyzes the image and drafts a perfectly formatted, polite complaint letter to the relevant authority (e.g., Municipal Commissioner).

### 3. 📄 Paperwork Simplifier
*   **Document Analysis**: Upload a photo of any confusing government form or notice.
*   **Step-by-Step Guidance**: The AI decodes the document and explains exactly how to fill it out or respond to it in simple language.

### 4. 👴 Senior Citizen Mode
*   **Accessible UI**: One-tap toggle for larger text, high-contrast buttons, and simplified layouts.
*   **Slow-Speech TTS**: Text-to-Speech engine optimized for seniors with slower, clearer articulation.
*   **Voice Commands**: Full hands-free operation supports "near me" voice searches.

### 5. 🌏 Multilingual & PWA Ready
*   **Language Support**: Seamlessly switches between **English, Hindi, and Telugu**.
*   **Installable App**: Fully functional **Progressive Web App (PWA)** that works offline and can be installed on mobile home screens.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Glassmorphism & Neumorphism)
- **State Management**: React Hooks & Context API
- **PWA**: Service Workers & Manifest for native-like experience

### Backend
- **Server**: Python (Flask)
- **WSGI**: Gunicorn for production-grade performance
- **AI Core**: Google **Gemini 2.5 Flash** (via `google-generativeai` SDK)
- **Image Processing**: Pillow (PIL)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Hosting**: Render (Web Service)

---

## 🏗️ Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.8+)
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/teja16asv/CitiAssist-Final.git
cd CitiAssist-Final
```

### 2. Backend Setup
```bash
# Navigate to root (or backend folder if separated)
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run Server
python main.py
```

### 3. Frontend Setup
```bash
# Setup dependencies and start dev server
npm install
npm run dev
```
Visit `http://localhost:5173` to explore the app.

### 🐳 Docker Setup (Recommended)
Run the entire stack with a single command:
```bash
docker-compose up --build
```

---

## 📂 Project Structure

```bash
CitiAssist/
├── public/              # Static assets (Manifest, Logos, Service Worker)
├── src/
│   ├── components/      # Reusable UI components (Header, Logo, Splash)
│   ├── pages/           # Main Views (LandingPage.jsx)
│   ├── App.jsx          # Root Component & Routing
│   └── main.jsx         # Entry Point
├── main.py              # Flask Backend API
├── requirements.txt     # Python Dependencies
├── package.json         # Node Dependencies
├── docker-compose.yml   # Container Orchestration
└── Dockerfile           # Build Instructions
```

---
