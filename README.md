# LMS Project - Backend & Frontend Basestep

This project is a boilerplate for a full-stack application using **FastAPI** (Backend) and **React.js** (Frontend).

## Project Structure

- `backend/`: FastAPI application.
- `frontend/`: React application built with Vite.

## Setup & Running

### 1. Backend (FastAPI)

1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the backend server:
    ```bash
    python main.py
    ```
    The API will be available at [http://localhost:8000](http://localhost:8000).

### 2. Frontend (React)

1.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at [http://localhost:5173](http://localhost:5173).

## Features

- **CORS Configured**: The backend allows requests from the frontend.
- **Modern UI**: A premium, responsive dark-themed dashboard.
- **FastAPI Middleware**: Pre-configured for cross-origin resource sharing.
- **Vite Integration**: Fast development server and builds.
