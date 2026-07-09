# EventFlow College Event Portal - Backend API

The backend API for **EventFlow**, a comprehensive college event management platform. It handles user authentication, event registration, automated QR attendance verification, and AI-powered event generation using Mongoose and MongoDB Atlas.

---

## Tech Stack
* **Runtime Environment**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB Atlas
* **Object Data Modeling (ODM)**: Mongoose
* **Authentication**: JSON Web Tokens (JWT) & bcryptjs
* **AI Engine**: Google Gemini API (with OpenAI fallback)

---

## Features
1. **Dynamic Authentication**: Standard JWT authorization for student profiles and admin roles.
2. **AI-Powered Event Generation**: Generates structured description, agenda, requirements, and benefits from Google Gemini API.
3. **Automated Attendance Verification**: Generates dynamic QR code sessions on the admin panel, verifying student check-ins and logging entries.
4. **Resilient DNS Override**: Configured to use public Google DNS resolvers on startup to bypass local DNS SRV resolution bugs.

---

## Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **MongoDB Atlas** database cluster
* **Gemini API Key** (or OpenAI API Key)

---
## Link 
https://eventflow-frontend.netlify.app
## Installation Steps

1. Clone or download the repository.
2. Open a terminal in the `/backend` directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
5. Configure your environmental values in `.env` (details below).

---

## Environment Variables
Create a `.env` file in the root of the `/backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventflow
JWT_SECRET=your_jwt_signature_secret_key
GEMINI_API_KEY=your_gemini_or_openai_api_key
```

*Note: If you provide an OpenAI API key (starting with `sk-`), the backend automatically routes generation calls to OpenAI (`gpt-4o-mini`).*

---

## Run Commands
* Run server in development mode (with hot-reloading):
  ```bash
  npm run dev
  ```
* Start server in production mode:
  ```bash
  npm start
  ```

---

## API Routes

### Authentication (`/api/auth`)
* `POST /signup` - Register a new user profile
* `POST /login` - Log in a user and issue a JWT token
* `POST /forgot-password` - Request a password reset link
* `GET /profile` - Retrieve logged-in user profile details (JWT Protected)
* `PUT /profile` - Update logged-in user profile details (JWT Protected)

### Events (`/api/events`)
* `GET /` - Retrieve all events with categories/search filter
* `GET /:id` - Get details of a specific event by ID
* `POST /` - Create a new event (Admin only)
* `PUT /:id` - Update event details (Admin only)
* `DELETE /:id` - Remove an event and all registrations (Admin only)

### Registrations (`/api/register`)
* `POST /` - Register student for an event (Student only)
* `GET /my` - List all registered events of the current student (Student only)

### Attendance (`/api/attendance`)
* `POST /session` - Generate dynamic QR session (Admin only)
* `POST /verify` - Scanned check-in verification & logging (Student only)
* `GET /event/:eventId` - Get event attendance lists (Admin only)

### Admin Management (`/api/admin`)
* `GET /students` - Query and filter student registration demographic logs (Admin only)
* `GET /analytics` - Fetch global dashboard statistics (Admin only)

### AI Generators (`/api/ai`)
* `POST /generate-event` - Generate event descriptions, agendas, requirements, and benefits using Gemini AI (Admin only)
