from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def product_text(product):
    return " ".join([
        product.get("name", ""),
        product.get("category", ""),
        product.get("description", ""),
        " ".join(product.get("tags", []))
    ])

def recommend_for_user(products, user, purchases, limit=8):
    if not products:
        return []
    corpus = [product_text(p) for p in products]
    matrix = TfidfVectorizer(stop_words="english").fit_transform(corpus)
    preferences = user.get("preferences", [])
    user_purchases = [x for x in purchases if x.get("user_id") == user.get("id")]
    bought_ids = {x.get("product_id") for x in user_purchases}
    bought_products = [p for p in products if p["id"] in bought_ids]
    query_text = " ".join(preferences + [product_text(p) for p in bought_products])
    query_vec = TfidfVectorizer(stop_words="english", vocabulary=None)
    # Fit product corpus and transform the user profile using the same fitted vectorizer.
    fitted = TfidfVectorizer(stop_words="english")
    matrix = fitted.fit_transform(corpus)
    profile = fitted.transform([query_text]) if query_text.strip() else None
    similarities = cosine_similarity(profile, matrix).flatten() if profile is not None else [0.0] * len(products)
    scored = []
    for idx, p in enumerate(products):
        if p["id"] in bought_ids:
            continue
        category_bonus = 0.25 if p.get("category", "").lower() in {x.lower() for x in preferences} else 0
        tag_bonus = 0.12 if any(tag.lower() in {x.lower() for x in preferences} for tag in p.get("tags", [])) else 0
        popularity = (float(p.get("rating", 0)) / 5) * 0.08
        score = float(similarities[idx]) + category_bonus + tag_bonus + popularity
        scored.append((score, p))
    scored.sort(key=lambda item: item[0], reverse=True)
    result = []
    for score, p in scored[:max(1, min(limit, 20))]:
        item = dict(p)
        item["recommendation_score"] = round(score, 3)
        item["recommendation_reason"] = "Matches your interests and browsing profile" if score > 0.15 else "Popular with store customers"
        result.append(item)
    return result

def similar_products(products, product_id, limit=4):
    if not products:
        return []
    corpus = [product_text(p) for p in products]
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus)
    index = next((i for i, p in enumerate(products) if p["id"] == product_id), None)
    if index is None:
        return []
    scores = cosine_similarity(matrix[index:index+1], matrix).flatten()
    ranked = sorted([(float(score), p) for score, p in zip(scores, products) if p["id"] != product_id], reverse=True, key=lambda x: x[0])
    return [{**p, "similarity_score": round(score, 3)} for score, p in ranked[:limit]]
