# Day Drive 🌤️

> **"Get everything done, calmly."**

Day Drive is a premium, full-stack productivity web application designed to help users manage their projects, track deep work sessions, and maintain a calm, focused workflow. It features a stunning, minimalist UI paired with a robust backend architecture.

---

##  Key Features

- **Intuitive Dashboard**: Effortlessly track daily tasks, upcoming deadlines, and recent completions.
- **Project Management**: Organize tasks into dedicated projects with real-time completion tracking.
- **Focus Timer**: A beautifully crafted, cyclic wheel timer designed for the Pomodoro technique. Directly logs your actual focus minutes into the database.
- **Advanced Analytics**: Visualize your productivity with interactive charts, completion rates, and daily streak tracking.
- **Activity Log**: An immutable audit log tracking your accomplishments and interactions.
- **Profile & Customization**: Complete profile management with Base64 Avatar uploads, password security, and account settings.
- **Push Notifications**: Real-time browser push notifications powered by Service Workers and `web-push`.

##  Technology Stack

### Frontend (Client)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **State/Routing**: React Router DOM, React Context
- **Notifications**: React Hot Toast

### Backend (Server)
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: MongoDB (via MongoDB Atlas)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Background Jobs**: BullMQ & Redis
- **Security**: Helmet, Express Rate Limit, CORS

---

##  Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Redis](https://redis.io/) (Must be running locally or via Docker for BullMQ queues)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB instance)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd DayDrive
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file based on the provided configuration variables:
# DATABASE_URL="..."
# REDIS_URL="redis://127.0.0.1:6379"
# PORT=3000
# JWT_SECRET="..."
# VAPID_PUBLIC_KEY="..."
# VAPID_PRIVATE_KEY="..."
# VAPID_SUBJECT="mailto:your-email@example.com"

# Sync Prisma Schema
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```
*The backend runs on `http://localhost:3000`.*

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend runs on `http://localhost:5173`.*

---

##  Folder Structure

```text
/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios API interceptors
│   │   ├── components/     # Reusable UI components & Modals
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks (e.g., Push Notifications)
│   │   └── pages/          # Full page views (Dashboard, Analytics, etc.)
│   └── public/             # Service workers and static assets
│
└── server/                 # Express Backend
    ├── src/
    │   ├── controllers/    # Route logic (Tasks, Projects, Auth)
    │   ├── middleware/     # JWT verification & Error handlers
    │   ├── prisma/         # Prisma DB Client instantiation
    │   ├── queues/         # BullMQ queue initialization
    │   └── routes/         # Express API routing definitions
    └── prisma/
        └── schema.prisma   # MongoDB Database Schema
```

##  Security Practices
- **Password Hashing**: Utilizing `bcryptjs` before persisting credentials.
- **Route Protection**: JWT token authorization required across all private endpoints.
- **Rate Limiting**: `express-rate-limit` prevents brute-force DOS attacks.
- **Payload Restrictions**: Enforced JSON payload limits block oversized Base64 attacks.

---

##  License

This project is licensed under the MIT License. 

*Designed and Developed for productivity enthusiasts.*
