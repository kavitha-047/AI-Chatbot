# AI ChatBot - Professional AI Assistant

A modern, responsive AI chatbot built with React, Vite, Supabase, and Gemini AI.

## 🚀 Setup Instructions

If you are running this on a new system, follow these steps:

1.  **Clone the repository.**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure environment variables**:
    - Copy `.env.example` to a new file named `.env`.
    - Fill in your credentials:
        - `VITE_SUPABASE_URL`: Your Supabase project URL.
        - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
        - `VITE_GEMINI_API_KEY`: Your Google Gemini API key.
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 📱 Features

- **Mobile Friendly**: Fully responsive design with a toggleable sidebar for mobile devices.
- **Persistent Conversations**: Save and resume chats using Supabase.
- **AI Powered**: Leveraging Gemini 1.5 Flash for fast and accurate responses.
- **Modern UI**: Clean, glassmorphism-inspired design with smooth transitions.

## 🛠️ Tech Stack

- **Frontend**: React, Lucide React, Framer Motion
- **Backend/Database**: Supabase
- **AI Model**: Google Gemini (gemini-flash-latest)
- **Build Tool**: Vite
