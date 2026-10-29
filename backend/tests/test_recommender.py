from app.data import seed_products
from app.recommender import recommend_for_user, similar_products

def test_recommendations_return_unpurchased_products():
    products = seed_products()
    user = {"id": "u1", "preferences": ["Electronics"]}
    purchases = [{"user_id": "u1", "product_id": "p2", "quantity": 1, "total": 129}]
    result = recommend_for_user(products, user, purchases, limit=5)
    assert len(result) == 5
    assert all(item["id"] != "p2" for item in result)
    assert all("recommendation_score" in item for item in result)

def test_similar_products_excludes_source_product():
    result = similar_products(seed_products(), "p1", 4)
    assert len(result) == 4
    assert all(item["id"] != "p1" for item in result)
