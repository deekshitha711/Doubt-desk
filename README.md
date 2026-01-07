# Doubt Desk

**Doubt Desk** is a real-time academic communication platform designed to bridge the gap between students and faculty. It allows students to post doubts anonymously, ensuring a judgment-free learning environment, while providing faculty with organized tools to manage and answer queries by subject and semester.



## Key Features

* **Anonymous Identity:** Students are assigned a unique anonymous ID, hiding their real identity from faculty and peers.
* **Media Support:** Students and Faculty can upload images and videos directly to doubts/answers.
* **Role-Based Dashboards:**
    * **Students:** Filter doubts by subject and track the status of personal queries.
    * **Faculty:** View doubts filtered automatically by their assigned subjects and semesters.
    * **Admins:** Manage faculty-to-subject assignments and monitor all platform activity.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | Google Cloud Firestore (NoSQL) |
| **Storage** | Google Firebase Storage |
| **Deployment** | Render, Netlify |
| **Version Control** | Git, GitHub |


---

## API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users` | Registers a new student or faculty profile. |
| `GET` | `/api/users/:uid` | Retrieves profile data (Role/Subject) for the session. |
| `POST` | `/api/doubts` | Submits a new doubt to the Firestore database. |
| `GET` | `/api/doubts/filter/:subject` | Fetches doubts specific to a faculty member's expertise. |
| `PATCH` | `/api/doubts/:id` | Updates a doubt's status from `open` to `answered`. |
| `POST` | `/api/answers` | Submits a faculty response linked to a specific doubt ID. |

---

## Installation & Setup

### 1. Backend Setup
1. Navigate to the `/backend` folder.
2. Install dependencies:
   ```bash
   npm install
3. Create a `.env` file with your Firebase credentials:
   ```env
   FIREBASE_PROJECT_ID=your-id
   FIREBASE_CLIENT_EMAIL=your-email
   FIREBASE_PRIVATE_KEY="your-key"
   PORT=5000
4. Run the server:
   ```bash
   npm start
### 2. Frontend Setup
1. Navigate to the `/frontend` folder.
2. Open `script.js` and ensure the `firebaseConfig` matches your Firebase Console settings.
3. Update the `BACKEND_URL` variable to your deployed API address.
4. Launch `index.html`.

---

## Team Members & Contributions
* **Y.Hari Priya:** Frontend Developer 
* **A.Siri Vyshnavi:** Backend Developer
* **K.Vineetha:** Firebase and Database
* **E.K.Deekshitha:** Integration & Deployment
 ##  GitHub Repository
https://github.com/deekshitha711/Doubt-desk
