# AI-Powered Semantic Search Engine

A full-stack, production-ready semantic search engine for websites and web applications, built with modern NLP and vector search capabilities.

## Features

- **Semantic search** using state-of-the-art NLP models (sentence-transformers)
- **Vector search** with FAISS for efficient similarity retrieval
- **Document processing** for PDFs, text files, and HTML content
- **Web crawler** to automatically index websites and pages
- **Multilingual support** for global content search
- **Fuzzy matching** for handling typos and variations
- **Real-time search suggestions** as you type
- **Filter system** for refined search results
- **Highlighted results** showing matching content
- **Modern, responsive UI** built with React and TailwindCSS
- **Chatbot interface** for conversational search (RAG-style)
- **API-only mode** for integration with existing applications
- **Customizable themes and branding**

## Tech Stack

### Backend
- Python with FastAPI
- FAISS for vector database
- MongoDB for metadata storage
- Sentence-transformers for NLP embeddings
- PyPDF2 and BeautifulSoup for document processing

### Frontend
- React for UI components
- TailwindCSS for styling
- React Query for data fetching
- React Router for navigation
- Context API for state management

## Getting Started

### Prerequisites

- Python 3.8+ 
- Node.js 16+
- MongoDB (local installation or MongoDB Atlas account)

### Installation

#### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/SirCodeKnight/semantic-search-engine.git
   cd semantic-search-engine/backend
   ```

2. Create a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/semantic_search
   API_KEY=your_generated_api_key
   MODEL_NAME=all-MiniLM-L6-v2
   OPENAI_API_KEY=sk-your_openai_key  # Optional, for OpenAI embeddings
   ```

5. Start the backend server
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_API_KEY=your_generated_api_key
   ```

4. Start the frontend development server
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from your `.env` file

### Frontend Deployment (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the root directory to `/frontend`
4. Add environment variables from your `.env` file
5. Deploy

## Customization

### Branding

Modify the `frontend/src/styles/variables.css` file to change colors, fonts, and other styling elements.

### API-Only Mode

Set `API_ONLY_MODE=true` in your backend `.env` file to disable the web UI and only expose the API endpoints.

### Theme Changes

Multiple themes are available by changing the `THEME` value in the frontend environment variables:
- `light` (default)
- `dark`
- `blue`
- `green`



## Acknowledgements

- [Sentence-Transformers](https://www.sbert.net/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
