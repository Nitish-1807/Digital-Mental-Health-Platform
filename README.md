# Digital Mental Health Platform

A multi-tenant peer support and clinical platform designed for educational institutions. The platform bridges the gap between students, peer-support communities, and clinical counselors by providing a safe, structured space for mental wellbeing.

## Features

**Currently Implemented:**
- **Multi-Tenant Architecture:** Secure isolation between different colleges. Students only interact with peers and counselors from their own institution.
- **Role-Based Access Control:** Distinct roles for Students, Counselors, and System Admins.
- **Structured Community Groups:** Students can discover, join, and create specific support groups (e.g., "Exam Stress", "LGBTQ+ Support"). Supports private groups, moderation, community guidelines, and real-time joining.
- **Trigger Warnings & Content Cloaking:** Posts can be marked with trigger warnings, requiring explicit user consent to reveal the content.
- **Anonymous Posting:** Students can toggle an anonymous mode that hides their real name in discussions while still maintaining auditability for admins.
- **AI Risk Detection:** Automated content scanning (via Groq/LLaMA3) that intercepts and flags high-risk or crisis-related keywords.
- **Counselor Scheduling & Video Meetings:** Students can book 1:1 sessions with verified counselors and join via in-app WebRTC video conferencing.
- **Clinical Check-Ins:** Structured onboarding assessments and regular mental health check-ins (PHQ-9/GAD-7 formats) providing actionable analytics for counselors.
- **Real-Time Notifications:** In-app notifications for mentions, appointment updates, and community activity.
- **Admin Dashboard:** Full system overview for managing resources, reviewing flagged content, and moderating users.

**Planned/Future Features:**
- AI Chatbot for 24/7 CBT-based coping strategies (currently placeholder).
- Parent/Guardian portal.
- Advanced institution-wide analytics.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, Framer Motion, `@react-oauth/google`
- **Backend:** Node.js, Express.js, Mongoose, Socket.io
- **Database:** MongoDB
- **Authentication:** Custom JWT-based auth + Google OAuth (via `google-auth-library`)
- **AI Services:** Groq SDK (LLaMA3 8b) for rapid crisis scanning
- **Real-Time Communication:** WebRTC (peer-to-peer video) & Socket.io (signaling and notifications)

## Project Structure

```text
├── backend/
│   ├── controllers/      # Request handlers & business logic
│   ├── middleware/       # Auth (JWT & Role checking), Security (Helmet/Limiting)
│   ├── models/           # Mongoose schemas (User, Post, CommunityGroup, etc.)
│   ├── routes/           # Express API endpoints
│   ├── scripts/          # Database seeding scripts (e.g. seed.js)
│   ├── services/         # External integrations (Groq AI, Socket.io)
│   └── server.js         # Backend entry point
│
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI elements (Navbar, Cards, Modals)
    │   ├── context/      # React Context (AuthContext)
    │   ├── pages/        # Main route views (Dashboard, Community, VideoMeet)
    │   ├── services/     # API Axios configurations and endpoints
    │   └── utils/        # Helper functions
    ├── package.json      # Vite configuration & dependencies
    └── tailwind.config.js# Design system tokens and styling
```

## Prerequisites

- **Node.js**: v18+ or v20+ recommended
- **npm**: v9+ or v10+
- **MongoDB**: A running local instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

## Environment Variables

The project requires environment variables for both the backend and frontend. You must create a `.env` file in **both** directories using the provided `.env.example` files as templates.

### Backend (`backend/.env`)
- `PORT`: (Optional) Defaults to 5000.
- `MONGODB_URI`: (Required) Connection string for MongoDB.
- `JWT_SECRET`: (Required) A secure random string for signing auth tokens.
- `GROQ_API_KEY`: (Required) API key for the Groq platform to run the LLaMA3 risk detection.
- `FRONTEND_URL`: (Optional) Used for CORS configuration. Defaults to `http://localhost:5173`.
- `GOOGLE_CLIENT_ID`: (Optional) The Web Client ID from Google Cloud Console if you wish to enable Google Login.

### Frontend (`frontend/.env`)
- `VITE_API_URL`: (Optional) Defaults to `http://localhost:5000/api`.
- `VITE_GOOGLE_CLIENT_ID`: (Optional) Must match the backend's Client ID to render the Google Login buttons.

> ⚠️ **SECURITY WARNING:** Never commit your actual `.env` files or hardcode API keys/secrets into the repository. The `.gitignore` is already configured to prevent `.env` files from being tracked.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Digital-Mental-Health-Platform
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Database Setup

Make sure your MongoDB server is running. Then, populate the database with the initial required data (such as the default college, an admin account, mock resources, and community groups):

```bash
cd backend
npm run seed:all
```

This will create a default administrator account:
- **Email:** `admin@default.com`
- **Password:** `admin123`

*(Note: Change this immediately in a production environment!)*

## Running the Project

You must start both the backend and frontend development servers. 

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*Runs the Express server with Nodemon on port 5000.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Runs the Vite React application on port 5173.*

Access the platform at `http://localhost:5173`.

## Google Authentication

To enable "Continue with Google":
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth 2.0 Client IDs (Web application).
3. Add `http://localhost:5173` to the Authorized JavaScript origins.
4. Copy the Client ID and paste it into both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`).

If these variables are omitted, the platform will gracefully hide the Google login buttons and rely solely on standard email/password authentication.

## Security Notes

- **Multi-Tenant Data:** The `enforceCollegeAccess` middleware guarantees that database queries are automatically scoped by `collegeId` so users cannot query information belonging to another institution.
- **Risk Detection:** The Groq AI risk scanner runs strictly on the backend so API keys are never exposed to the client.
- **Passwords:** All passwords are mathematically hashed with bcrypt prior to database storage.

## Known Limitations

- The **AI Chatbot** page is currently a frontend placeholder. Integrating the actual conversational agent logic is a planned future milestone.
- **Video Conferencing** relies on basic WebRTC and a custom signaling server via Socket.io. It may not reliably bypass strict enterprise NAT/Firewalls since TURN server configuration is not yet implemented.

## License

This project currently has no associated license. All rights are reserved until an open-source license (such as MIT or Apache 2.0) is officially applied.
