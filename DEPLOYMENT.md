# Deployment Guide

This guide explains how to deploy the Semantic Search Engine to production environments using free services.

## Backend Deployment (Render)

[Render](https://render.com/) offers a free tier for web services, which is sufficient for deploying the backend API.

### Steps to deploy on Render:

1. Create a [Render account](https://dashboard.render.com/register)

2. Create a new Web Service:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository or upload the code directly
   - Configure the service:
     - Name: `semantic-search-api` (or your preferred name)
     - Environment: Python 3
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Select the free plan

3. Add environment variables:
   - MONGODB_URI: Connection string for your MongoDB database
   - API_KEY: Generate a secure API key
   - MODEL_NAME: `all-MiniLM-L6-v2` (or your preferred model)
   - EMBEDDING_DIMENSION: `384`
   - INDEX_TYPE: `Flat`
   - ALLOWED_ORIGINS: Your frontend URL (e.g., `https://your-app.vercel.app`)

4. Deploy the service and wait for the build to complete

## MongoDB Setup

For the database, you can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), which offers a free tier.

### Steps to set up MongoDB Atlas:

1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register)

2. Create a new cluster:
   - Select the free M0 Sandbox tier
   - Choose a cloud provider and region closest to your users

3. Set up database access:
   - Create a database user with password authentication
   - Note down the username and password for your connection string

4. Set up network access:
   - Add your IP address to the IP access list
   - Or set it to allow access from anywhere (0.0.0.0/0)

5. Get your connection string:
   - Go to "Connect" > "Connect your application"
   - Select the appropriate driver version
   - Copy the connection string and replace `<password>` with your database user's password
   - Use this string as the `MONGODB_URI` environment variable

## Frontend Deployment (Vercel)

[Vercel](https://vercel.com/) is ideal for deploying React applications and offers a generous free tier.

### Steps to deploy on Vercel:

1. Create a [Vercel account](https://vercel.com/signup)

2. Import your repository:
   - Click "Add New..." > "Project"
   - Import your GitHub repository or upload the code directly

3. Configure the project:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. Add environment variables:
   - REACT_APP_API_URL: URL of your Render backend (e.g., `https://semantic-search-api.onrender.com`)
   - REACT_APP_API_KEY: The same API key used in your backend
   - REACT_APP_THEME: `light` (or `dark`)

5. Deploy the project and wait for the build to complete

## Alternative Frontend Deployment (Netlify)

You can also use [Netlify](https://www.netlify.com/) for deploying the frontend, which offers similar features to Vercel.

### Steps to deploy on Netlify:

1. Create a [Netlify account](https://app.netlify.com/signup)

2. Add a new site:
   - Click "New site from Git"
   - Connect to your Git provider and select your repository

3. Configure the build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

4. Add environment variables:
   - Same as for Vercel deployment

5. Deploy the site and wait for the build to complete

## Environment Configuration

### Backend (.env file in the backend directory)

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/semantic_search
API_KEY=your_generated_api_key
MODEL_NAME=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
INDEX_TYPE=Flat
PORT=8000
HOST=0.0.0.0
DEBUG=false
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
MAX_FILE_SIZE=10
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CHUNKS_PER_DOC=100
```

### Frontend (.env file in the frontend directory)

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_API_KEY=your_generated_api_key
REACT_APP_THEME=light
```

## Additional Deployment Options

### Hugging Face Spaces

[Hugging Face Spaces](https://huggingface.co/spaces) is another free option that's especially good for ML-based applications.

1. Create a Hugging Face account
2. Create a new Space with the Streamlit, Gradio, or Docker template
3. Upload your code and configure the deployment

### Railway

[Railway](https://railway.app/) offers a simple deployment platform with a free tier.

1. Create a Railway account
2. Create a new project and connect your GitHub repository
3. Configure the deployment settings similar to Render
4. Add the necessary environment variables

### Cloudflare Workers

For advanced users, [Cloudflare Workers](https://workers.cloudflare.com/) can be used to deploy the frontend, with some limitations on the backend.

## Production Considerations

- **Scaling**: Both Render and Vercel offer paid tiers with increased resources if your application grows
- **Custom Domain**: You can add a custom domain to both services
- **Monitoring**: Set up monitoring to track your application's performance
- **Backup**: Regularly backup your MongoDB database

## Troubleshooting

- **CORS Issues**: Make sure your `ALLOWED_ORIGINS` includes the frontend URL
- **API Key Errors**: Ensure the API key matches between frontend and backend
- **MongoDB Connection Errors**: Check your network access settings in MongoDB Atlas
- **Build Failures**: Review the build logs for specific errors
- **Model Loading Errors**: Some models might be too large for free tiers, consider using a smaller model