# AdaptTutor

AdaptTutor is an emotion-aware adaptive coding tutoring system that monitors student behavior, infers their cognitive-emotional state, and dynamically adapts its pedagogical strategy using generative AI. 

## How to Run the Project Locally

### Prerequisites

Ensure you have the following installed on your machine:
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (For PostgreSQL)
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js & npm](https://nodejs.org/en/download/)
- A Google Gemini API Key

### 1. Start the Database
From the root directory of the project, start the PostgreSQL database container via Docker Compose:
```bash
docker compose up -d
```
*(This will pull the Postgres 15 image and bind it to localhost:5432).*

### 2. Run the Backend API
In a new terminal window, navigate to the `backend/` directory, create your virtual environment, install dependencies, and start the FastAPI server:
```bash
cd backend

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Set your Gemini API key
export GEMINI_API_KEY="your_api_key_here"

# Start the server
uvicorn main:app --reload
```
*Note: Make sure your `GEMINI_API_KEY` is exported for the LLM to generate adaptive hints. If left blank, it will provide a hardcoded fallback mock message.*

### 3. Run the Frontend Application
In a third terminal window, navigate to the `frontend/` directory, install the React dependencies, and start the Vite development server:
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Access the Application
Open your browser and navigate to the local Vite URL, typically:
[http://localhost:5173](http://localhost:5173)

## System Architecture Overview

- **Frontend**: React.js, Vite, TailwindCSS, Monaco Code Editor
- **Backend**: Python FastAPI, SQLAlchemy
- **Execution Engine**: Proxying code payloads to Judge0 over HTTP.
- **Database**: PostgreSQL
- **LLM Engine**: Google Gemini 2.5 Flash via `google-genai` SDK over WebSockets for state inference prompts.