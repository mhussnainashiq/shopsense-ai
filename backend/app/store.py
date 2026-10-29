from pymongo import MongoClient
from pymongo.errors import PyMongoError
from .config import MONGODB_URI, MONGODB_DATABASE
from .data import seed_products

class Store:
    def __init__(self):
        self.client = None
        self.db = None
        self.mode = "memory"
        self.products = seed_products()
        self.users = {"demo-user": {"id":"demo-user","preferences":["Electronics","Home","Technology"],"created_at":"2026-01-01T00:00:00Z"}}
        self.purchases = [
            {"id":"purchase-demo-1","user_id":"demo-user","product_id":"p2","quantity":1,"total":129.0,"created_at":"2026-10-20T10:00:00Z"},
            {"id":"purchase-demo-2","user_id":"demo-user","product_id":"p1","quantity":2,"total":37.98,"created_at":"2026-10-21T10:00:00Z"},
            {"id":"purchase-demo-3","user_id":"demo-user","product_id":"p8","quantity":1,"total":99.0,"created_at":"2026-10-22T10:00:00Z"},
        ]

    def connect(self):
        try:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1200)
            client.admin.command("ping")
            self.client = client
            self.db = client[MONGODB_DATABASE]
            self.mode = "mongodb"
            if self.db.products.count_documents({}) == 0:
                self.db.products.insert_many(seed_products())
            if self.db.users.count_documents({}) == 0:
                self.db.users.insert_one(self.users["demo-user"])
            if self.db.purchases.count_documents({}) == 0:
                self.db.purchases.insert_many(self.purchases)
        except Exception:
            self.client = None
            self.db = None
            self.mode = "memory"

    def list_products(self):
        if self.db is not None:
            return list(self.db.products.find({}, {"_id": 0}))
        return self.products

    def get_user(self, user_id):
        if self.db is not None:
            user = self.db.users.find_one({"id": user_id}, {"_id": 0})
            if user: return user
        return self.users.get(user_id, {"id": user_id, "preferences": []})

    def save_preferences(self, user_id, preferences):
        user = {"id": user_id, "preferences": preferences}
        if self.db is not None:
            self.db.users.update_one({"id": user_id}, {"$set": user}, upsert=True)
        else:
            self.users[user_id] = user
        return user

    def list_purchases(self):
        if self.db is not None:
            return list(self.db.purchases.find({}, {"_id": 0}))
        return self.purchases

    def add_purchase(self, purchase):
        if self.db is not None:
            self.db.purchases.insert_one(purchase)
        else:
            self.purchases.append(purchase)

store = Store()
