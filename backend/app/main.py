from datetime import datetime, timezone
from uuid import uuid4
from collections import Counter, defaultdict
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .config import FRONTEND_ORIGIN
from .store import store
from .schemas import PreferencesIn, PurchaseIn
from .recommender import recommend_for_user, similar_products

app = FastAPI(title="ShopSense AI API", version="1.0.0", description="Personalized product recommendations and store analytics.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    store.connect()

@app.get("/")
def root():
    return {"name": "ShopSense AI API", "docs": "/docs", "health": "/api/health"}

@app.get("/api/health")
def health():
    return {"status": "ok", "database": store.mode, "recommendation_engine": "scikit-learn TF-IDF + cosine similarity"}

@app.get("/api/products")
def products(category: str | None = None, search: str | None = None):
    result = store.list_products()
    if category and category.lower() != "all":
        result = [p for p in result if p.get("category", "").lower() == category.lower()]
    if search:
        term = search.lower()
        result = [p for p in result if term in (p.get("name", "") + " " + p.get("description", "") + " " + " ".join(p.get("tags", []))).lower()]
    return result

@app.get("/api/products/{product_id}")
def product_detail(product_id: str):
    product = next((p for p in store.list_products() if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/recommendations/{user_id}")
def recommendations(user_id: str, limit: int = Query(default=8, ge=1, le=20)):
    return recommend_for_user(store.list_products(), store.get_user(user_id), store.list_purchases(), limit)

@app.get("/api/recommendations/product/{product_id}")
def product_recommendations(product_id: str, limit: int = Query(default=4, ge=1, le=12)):
    return similar_products(store.list_products(), product_id, limit)

@app.put("/api/users/{user_id}/preferences")
def update_preferences(user_id: str, payload: PreferencesIn):
    valid_categories = {p["category"] for p in store.list_products()}
    clean = list(dict.fromkeys(x.strip() for x in payload.preferences if x.strip()))
    if len(clean) > 20:
        raise HTTPException(status_code=400, detail="Choose no more than 20 interests")
    user = store.save_preferences(user_id, clean)
    return {"message": "Preferences saved", "user": user}

@app.post("/api/purchases", status_code=201)
def create_purchase(payload: PurchaseIn):
    product = next((p for p in store.list_products() if p["id"] == payload.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    purchase = {
        "id": str(uuid4()),
        "user_id": payload.user_id,
        "product_id": payload.product_id,
        "quantity": payload.quantity,
        "total": round(float(product["price"]) * payload.quantity, 2),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    store.add_purchase(purchase)
    return {"message": "Demo purchase recorded", "purchase": purchase}

@app.get("/api/analytics/overview")
def analytics_overview():
    products = store.list_products()
    purchases = store.list_purchases()
    revenue = sum(float(p.get("total", 0)) for p in purchases)
    units = sum(int(p.get("quantity", 1)) for p in purchases)
    return {"products": len(products), "orders": len(purchases), "units_sold": units, "revenue": round(revenue, 2), "avg_order_value": round(revenue / len(purchases), 2) if purchases else 0}

@app.get("/api/analytics/categories")
def analytics_categories():
    products = store.list_products()
    purchases = store.list_purchases()
    product_by_id = {p["id"]: p for p in products}
    counts = Counter()
    revenue = defaultdict(float)
    for purchase in purchases:
        product = product_by_id.get(purchase.get("product_id"))
        if product:
            category = product.get("category", "Other")
            counts[category] += int(purchase.get("quantity", 1))
            revenue[category] += float(purchase.get("total", 0))
    all_categories = sorted({p["category"] for p in products})
    return [{"category": c, "units_sold": counts[c], "revenue": round(revenue[c], 2)} for c in all_categories]

@app.get("/api/analytics/top-products")
def analytics_top_products():
    products = store.list_products()
    purchases = store.list_purchases()
    metrics = defaultdict(lambda: {"units_sold": 0, "revenue": 0.0})
    for purchase in purchases:
        m = metrics[purchase.get("product_id")]
        m["units_sold"] += int(purchase.get("quantity", 1))
        m["revenue"] += float(purchase.get("total", 0))
    rows = [{**p, **metrics[p["id"]]} for p in products]
    rows.sort(key=lambda p: (p["units_sold"], p["revenue"]), reverse=True)
    return rows[:8]
