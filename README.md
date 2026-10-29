# ShopSense AI — E-commerce Recommendation Engine

A full-stack portfolio project built with **React + Vite**, **FastAPI**, **Python**, **scikit-learn**, and **MongoDB**.

## Features
- Product catalog with search and category filters
- Personalized recommendations based on selected interests and purchase history
- Product similarity recommendations using TF-IDF + cosine similarity
- Save preferences and record simulated purchases
- Store-owner dashboard with category/purchase analytics and top products
- Seed/demo products so the app can be explored immediately
- MongoDB persistence when available; in-memory demo mode when MongoDB is not running

> This is a portfolio/demo app. It does not process real payments or connect to a live store.

## Requirements
- Node.js 20+ (recommended)
- Python 3.11–3.13 recommended
- MongoDB Community Server or MongoDB Atlas (optional for demo mode)

## 1. Start the backend (Windows PowerShell)
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```
If `py -3.12` is not installed, use `python -m venv .venv` with an installed supported Python version.



## 2. Start the frontend
Open another terminal:
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```


## MongoDB configuration
The default URI is `mongodb://127.0.0.1:27017` and database is `shopsense_ai`.
If MongoDB is unavailable, the API automatically uses seeded in-memory demo data. Set `MONGODB_URI` in `backend/.env` to your Atlas connection string to use Atlas.

## API overview
- `GET /api/health`
- `GET /api/products`
- `GET /api/recommendations/{user_id}?limit=8`
- `GET /api/recommendations/product/{product_id}?limit=4`
- `PUT /api/users/{user_id}/preferences`
- `POST /api/purchases`
- `GET /api/analytics/overview`
- `GET /api/analytics/categories`
- `GET /api/analytics/top-products`

## Notes
- Demo user ID: `demo-user`
- The recommendation model combines content similarity with preference/category affinity and purchase history.
- Data in in-memory mode resets when the backend restarts.
