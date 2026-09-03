```markdown
# Project Setup & Local Development Guide

Follow these step-by-step instructions to clone, configure, and run this project locally on your machine.

---

## Prerequisites

Ensure you have the following installed on your computer before starting:

* **[Node.js](https://nodejs.org/)** (v18.x or higher recommended)
* **[Git](https://git-scm.com/)**
* **[MongoDB](https://www.mongodb.com/)** (Either **MongoDB Community Server** installed locally OR a **MongoDB Atlas** cloud database URI)

---

## 1. Clone the Repository

Open your terminal or command prompt and clone your fork of the repository:

```bash
git clone [https://github.com/YOUR-USERNAME/YOUR-REPOSITORY-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPOSITORY-NAME.git)
cd YOUR-REPOSITORY-NAME

```

---

## 2. Environment Configuration

Create a `.env` file inside the `backend/` directory to store your database connection string and server configuration safely.

1. Navigate to the `backend/` folder:
```bash
cd backend

```


2. Create a `.env` file:
* **Linux/macOS:** `touch .env`
* **Windows (PowerShell):** `New-Item .env`


3. Add the following environment variables to `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your_database_name
# If using MongoDB Atlas, replace MONGO_URI with your cloud connection string:
# MONGO_URI=mongodb+x7017://<username>:<password>@cluster0.mongodb.net/your_database_name

```



---

## 3. Install Backend Dependencies

Inside the `backend/` directory, install all required Node modules:

```bash
npm install

```

---

## 4. Set Up the MongoDB Database

### Option A: Local MongoDB

1. Ensure your local MongoDB daemon service is running:
* **Windows:** Start the service via `services.msc` or run `net start MongoDB`.
* **Linux:** `sudo systemctl start mongod`
* **macOS:** `brew services start mongodb-community`


2. The `Log` and `User` collections defined under `backend/models/` will automatically be created in your database when the backend server initializes and writes data.

### Option B: MongoDB Atlas (Cloud)

1. Log in to [MongoDB Atlas](https://www.google.com/search?q=https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and whitelist your current IP address (or `0.0.0.0/0` for development access).
3. Copy your connection string and paste it as the `MONGO_URI` value in your `backend/.env` file.

---

## 5. Running the Application

### Step 1: Start the Backend Server

From the `backend/` directory, run:

```bash
npm start

```

*(Or `npm run dev` if Nodemon is configured in your `package.json`)*

You should see a confirmation message in the console (e.g., `Server running on port 5000` and `MongoDB connected`).

### Step 2: Serve the Frontend

Because the frontend consists of static HTML, CSS, and JavaScript files:

1. Open a new terminal tab and navigate back to the project root directory:
```bash
cd ..

```


2. Open the frontend:
* **Option 1 (VS Code Live Server):** Right-click `frontend/html/index.html` in VS Code and select **Open with Live Server**.
* **Option 2 (Directly in Browser):** Open `frontend/html/index.html` directly in any standard web browser.
* **Option 3 (HTTP Server via Node/Python):**
```bash
# Using Node's npx serve package
npx serve frontend/html

# OR using Python 3
python -m http.server 8000 --directory frontend/html

```





---

## Troubleshooting & Verification

* **CORS Errors:** If your frontend fetch calls fail due to Cross-Origin Resource Sharing, verify that `cors` middleware is enabled inside `backend/server.js`.
* **Database Connection Issues:** Check your terminal log output when running `npm start`. If the connection times out, double-check your `MONGO_URI` string and firewall settings.

```

---

### Need File Content Review?

To make this README even more accurate for contributors, feel free to share the content of:

1. **`backend/package.json`** — To confirm the exact start scripts (e.g., whether `nodemon` or `dotenv` are configured) and dependent packages.
2. **`backend/server.js`** — To verify the exact PORT variable defaults, API endpoints, and CORS configurations.

```