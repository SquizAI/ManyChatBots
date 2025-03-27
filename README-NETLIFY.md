# ManyChatBot Platform Netlify Deployment

This repository contains the ManyChatBot platform, which includes:
- Main marketing website
- Client dashboard
- Admin dashboard
- Backend API server

## Deployment Instructions

### Netlify Deployment

1. Connect this repository to your Netlify account
2. Use the following build settings:
   - Build command: `echo 'No build required'`
   - Publish directory: `website`
   - Base directory: `/`

3. The provided `netlify.toml` file includes all necessary configuration for:
   - Static file serving
   - Redirects for SPA routing
   - CORS headers for cross-domain functionality

### Environment Setup

For full functionality, update the following files with your API keys:
- `/server/.env` - Backend API keys for OpenAI and Google Gemini

## Local Development

To run the project locally:

```bash
# For the main website
cd website
python -m http.server 9000

# For the client dashboard
cd dashboard
python -m http.server 9001

# For the admin dashboard
cd admin
python -m http.server 9002

# For the backend API server
cd server
npm install
npm run dev
```

## Features

- Interactive AI chatbot demo
- Responsive design for all devices
- Dashboard interfaces for clients and administrators
- Complete API integration with OpenAI and Gemini

## Netlify Deploy Button

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/ManyChatBot_website_V1)
