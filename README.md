# Infinite Yatra Website 🏔️

**The official full-stack travel platform for Infinite Yatra.**

This repository contains the source code for the Infinite Yatra web application, a modern, high-performance platform for booking travel packages, reading travel stories, and planning trips with AI.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: React Context API (`AuthContext`, `PackageContext`, `WishlistContext`, `ToastContext`)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Routing**: React Router v7
- **Icons**: Lucide React

### Backend (Serverless)
- **Platform**: [Firebase](https://firebase.google.com/)
- **Authentication**: Firebase Auth (Email/Password, Phone)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage (Images, Documents)
- **Hosting**: Firebase Hosting

### Third-Party Services
- **Payments**: Razorpay Integration
- **AI**: Gemini AI (Trip Planner, Chatbot)
- **Email**: EmailJS

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/thisisparthchauhan/infiniteyatra-website.git
    cd infiniteyatra-website
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You need the following keys (ask the project admin for values):

    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The site will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```
src/
├── assets/          # Static assets (images, logos)
├── components/      # Reusable UI components
│   ├── Admin/       # Admin-specific components
│   ├── Navbar.jsx   # Main navigation
│   └── Footer.jsx   # Site footer
├── context/         # React Contexts (Global State)
│   ├── AuthContext.jsx  # User session, login/signup
│   └── ...
├── data/            # Static data (packages.js, destinations)
├── pages/           # Page components (routed)
│   ├── BookingPage.jsx  # Complex booking flow
│   ├── PackageDetail.jsx
│   └── ...
├── services/        # Service integrations (email.js)
├── App.jsx          # Main App entry & routing
└── main.jsx         # React DOM root
```

---

## 🔑 Key Features & Flows

### 1. Booking System (`/booking/:id`)
*   **Step 1 (Selection)**: Users select dates and traveler count. Availability is checked against Firestore.
*   **Step 2 (Details)**:
    *   **Primary Contact**: Auto-filled from profile.
    *   **Traveler Details**: Supports First/Middle/Last names.
    *   **Emergency Contacts**: Per-traveler management. Can auto-sync from user profile.
    *   **ID Uploads**: Securely uploads documents to Firebase Storage.
*   **Step 3 (Payment)**: Integrates Razorpay. Upon success, creates a confirmed booking in Firestore.

### 2. User Accounts
*   **Profile**: Manages personal details and global emergency contacts.
*   **My Trips**: Displays upcoming and past bookings.
*   **Wishlist**: Saved packages for future reference.

### 3. Admin Dashboard (`/admin`)
*   **Protected Route**: Only accessible to users with `isAdmin: true` in Firestore.
*   **Management**:
    *   **Packages**: Create/Update/Delete travel packages.
    *   **Bookings**: View all bookings, verify documents, download PDFs.
    *   **Users**: Manage registered users.

### 4. Travel Stories
*   A community feature where users can post travel blogs with images.
*   Supports "Hearts" (likes) and views.

---

## 🗄️ Database Schema (Firestore)

*   `users`: Stores user profiles, credits, and role (admin/user).
*   `bookings`: Stores booking details, payment status, traveler lists, and document links.
*   `packages`: Stores travel package data (title, price, itinerary, inclusions).
*   `stories`: Stores user-generated travel stories.
*   `enquiries`: Stores contact form submissions.

---

## 🚢 Deployment

We use a standard workflow to deploy to Firebase Hosting.

**Command:**
```bash
npm run build && firebase deploy
```

> **Note**: For continuous integration, check `.agent/workflows/dagu.md`.

---

## 📚 Detailed Documentation

For specific subsystems, please refer to:
*   [Testing Guide](TESTING_GUIDE.md)
*   [Referral System](REFERRAL_SYSTEM.md)
*   [Deployment Strategy](DEPLOYMENT.md)
