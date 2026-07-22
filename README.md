# Enterprise AI Dashboard (EPC AI Assistant)

## Overview
The **Enterprise AI Dashboard** is a full-stack web application tailored for Engineering, Procurement, and Construction (EPC) projects. It enables users to upload project-related PDF documents (like schedules, risk reports, and commissioning data) and leverages an AI assistant to analyze project health, schedule delays, risks, commissioning status, and shipment tracking. 

## Features
- **AI-Powered Analysis:** Upload PDFs to extract insights regarding schedule adherence, budget performance, and active risks.
- **Interactive Dashboard:** Visualizes project health, completion forecast, and timeline trends via intuitive widgets.
- **Document Management:** Upload, parse, and analyze PDF documents seamlessly.
- **Real-time AI Chat:** Ask the AI assistant specific questions about schedule slip days, critical paths, and procurement progress.
- **Modern UI:** Built with React, TailwindCSS, and Lucide Icons for a sleek, responsive experience.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express.js, Multer (for file uploads), pdf-parse
- **AI Integration:** Google Gemini API
- **Environment:** TypeScript/JavaScript (ESM Modules)

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

## Getting Started

### 1. Install Dependencies
Install all required npm packages for both the client and server:
```bash
npm install
```

### 2. Environment Variables
Ensure you have a `.env` file in the root directory with your required API keys. For example:
```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the Development Server
The project uses `concurrently` to run both the Vite frontend and Express backend simultaneously.
```bash
npm run dev
```
- The Vite frontend will typically be accessible at `http://localhost:5173/`.
- The Express backend server handles API requests and PDF parsing concurrently.

### 4. Build for Production
To build the React app for production:
```bash
npm run build
```

## Folder Structure
- `/src`: Contains the React frontend components, styles, and assets.
- `server.mjs`: The Express.js backend application handling API routes, file uploads, and Gemini AI integration.
- `/data`: Directory where application state (`state.json`) and uploaded data are stored locally.
- `/sample-pdfs`: Sample documents for testing the dashboard.
- `/dist`: The output directory for the compiled production build.

## License
MIT
