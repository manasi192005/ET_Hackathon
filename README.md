# ProjectMind - Enterprise AI Dashboard

A comprehensive AI-powered dashboard tailored for **Engineering, Procurement, and Construction (EPC)** projects. It analyzes project-related PDF documents to track **schedule delays**, extract **critical risks**, monitor **procurement progress**, and provide **real-time chat interactions** through intelligent insights.

📸 **Demo**
*(Add ProjectMind Demo Screenshot/Video here)*

🌟 **Features**

**1. AI-Powered Document Analysis**
- Upload project-related PDF documents (schedules, risk reports, commissioning data).
- Automatic text extraction using `pdf-parse` (up to 3000 characters per document for thorough context).
- Deep contextual analysis via **Google Gemini API** with high token limits (up to 4096 output tokens).
- Generates comprehensive insights on schedule slip days, risks, and health status.
- **Session Isolation:** Automatic state clearing on server startup and page refresh to ensure no stale data persists.
*(Image Placeholder: Analysis Overview)*

**2. Interactive Dashboard**
- Visualizes **project health**, **completion forecast**, and **timeline** via intuitive widgets.
- Enhanced visual differentiation using **Emerald Green** and **Dark Slate** for progress indicators.
- Smart placeholders ("—") for dynamic fields when no documents are loaded.
- Dynamic 7-month timeline showing planned vs. actual progress.
*(Image Placeholder: Real-time Dashboard)*

**3. Real-Time AI Chat Assistant**
- Ask the EPC AI assistant specific questions regarding uploaded documents.
- **Advanced Markdown Rendering:** Chat responses are formatted cleanly with bolding, lists, and headers instead of raw text.
- **No-Filler Output:** The AI relies on strict system prompts to provide precise, actionable, and structured data, omitting unnecessary greetings.
*(Image Placeholder: Chat Interface)*

**4. Risk & Procurement Tracking**
- Identifies and categorizes risks (**Critical, High, Medium, Low**).
- Maps risks to specific owners and milestones.
- Tracks **long-lead shipments** and highlights delayed equipment.

**5. Commissioning Status Tracking**
- Extracts test steps, expected outcomes, and current issues from PDFs.
- Flags commissioning items as **Pass, At Risk, or Watch**.

**6. Intuitive User Interface & Notifications**
- **Streamlined UI:** Removed all filler text, verbose status messages, and unnecessary badges for a clean, professional command center experience.
- **Notification Center:** Interactive bell dropdown with unread indicators and "Mark all read" functionality.
- **User Profile:** Full PM profile dropdown for settings, projects, and sign-out capabilities.
- **Clean Sidebar:** Streamlined navigation, maximizing the central dashboard space.

**7. Report Export**
- One-click **PDF generation** of the project summary, uploaded documents, and recent AI chat interactions using `pdfkit`.

🏗️ **Technology Stack**

**Frontend**
- **Framework:** React 18, Vite
- **Language:** TypeScript/JavaScript
- **Styling:** Tailwind CSS 3
- **UI Components:** Custom component library
- **Icons:** Lucide React

**Backend**
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 5
- **File Handling:** Multer, pdf-parse
- **PDF Generation:** pdfkit
- **AI Integration:** Google Gemini API

📊 **User Flow**

**Project Journey**
- **Login/Access** → User opens the dashboard.
- **Upload Documents** → Upload PDFs related to EPC schedules and risk reports.
- **AI Analysis** → System parses text and sends a structured prompt to Gemini.
- **Review Dashboard** → User reviews the parsed insights: schedule slip days, overall completion, and active risks.
- **Interact** → User asks specific questions via the Chat Assistant.
- **Export** → User exports the synthesized report as a PDF for stakeholders.

🚀 **Setup Instructions**

**Prerequisites**
- Node.js: v18 or higher
- npm or yarn
- Google Gemini API Key

**1. Clone Repository**
```bash
git clone <repository-url>
cd ET_Hackathon
```

**2. Environment Setup**
Create a `.env` file in the root directory and configure your keys:
```env
# Server Port (Default is 8787 if not set)
PORT=8787

# Gemini API Key (Required for AI Analysis and Chat)
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**3. Install Dependencies**
```bash
npm install
```

**4. Run the Development Server**
```bash
npm run dev
```
The application uses `concurrently` to run both the frontend (Vite) and backend (Express).
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:8787`

**5. Build for Production**
```bash
npm run build
```

📁 **Project Structure**
```text
ET_Hackathon/
├── data/                         # Local storage for state.json and parsed data
├── dist/                         # Compiled production build
├── sample-pdfs/                  # Sample documents for testing
├── scripts/                      # Utility scripts
├── src/                          # React frontend source code
├── server.mjs                    # Main Express server and AI integration
├── package.json                  # Dependencies and scripts
├── .env                          # Environment variables
└── README.md                     # This file
```

🔌 **API Endpoints**

**Document Management**
- `GET /api/documents` - Fetch all uploaded documents.
- `POST /api/upload` - Upload new PDF documents (uses `multer`).

**AI & Analysis**
- `POST /api/analyze` - Trigger deep Gemini AI analysis on uploaded documents.
- `POST /api/chat` - Send a message to the context-aware AI assistant.

**Export**
- `POST /api/export/pdf` - Generate and download a PDF summary report.

🧪 **Testing the System**

**1. Test Backend Health**
- Open `http://localhost:8787` to verify the backend is running.
- Check server console logs for `Gemini API key → LOADED ✓`.

**2. Test Frontend**
- Open `http://localhost:5173`.
- Upload a sample PDF from the `/sample-pdfs` directory.
- Click "Analyze" to populate the dashboard.
- Interact with the Chat widget on the right panel.

🎨 **Theme Customization**
- Configured via `tailwind.config.ts`.
- Supports rapid UI updates via standard Tailwind utility classes.

🔐 **Security Features**
- **CORS** configuration for frontend-backend communication.
- **Environment variable protection** for API Keys.
- **No database exposure** (relies on local `state.json` for lightweight persistence).

🐛 **Troubleshooting**

**Backend won't start:**
- Check if port 8787 is in use.
- Ensure Node version is v18+.

**Gemini Analysis Failed:**
- Check backend console for `[AI ENGINE] ✗ Gemini returned null`.
- Verify your `GEMINI_API_KEY` is correct and has quota remaining.

**PDF Extraction Skipped:**
- Ensure uploaded files are strictly `.pdf`. The system relies on `pdf-parse`.

🚀 **Deployment**
- Ensure to set `GEMINI_API_KEY` in your hosting provider's environment settings.
- Run `npm run build` for the frontend build.

👥 **Contributors**
- **Manasi Ghalsasi**
- **Rushil Patil**
- **Chaitanya Medidar**

📝 **License**
This project is created for educational purposes (ET Hackathon).
