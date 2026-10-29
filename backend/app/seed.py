from decimal import Decimal

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import Category, Product, User
from app.security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        category_data = {
            "Конструкторы": "Игрушки для сборки и творчества",
            "Плюшевые игрушки": "Мягкие и добрые друзья для детей",
            "Настольные игры": "Игры для семьи и друзей",
            "Другое": "Игрушки, которые не вошли в другие категории",
        }
        categories = {}
        old_soft_category = db.scalar(select(Category).where(Category.name == "Мягкие игрушки"))
        new_soft_category = db.scalar(select(Category).where(Category.name == "Плюшевые игрушки"))
        if old_soft_category is not None and new_soft_category is None:
            old_soft_category.name = "Плюшевые игрушки"
            old_soft_category.description = category_data["Плюшевые игрушки"]
            db.flush()
        for name, description in category_data.items():
            category = db.scalar(select(Category).where(Category.name == name))
            if category is None:
                category = Category(name=name, description=description)
                db.add(category)
                db.flush()
            categories[name] = category

        products = [
            ("Конструкторы", "Большой конструктор", "Набор из 240 деталей", "1490.00", 12, 6, "/images/duplo.png"),
            ("Конструкторы", "Деревянная железная дорога", "Набор для первых сюжетных игр", "2190.00", 7, 3, "/images/train-set.png"),
            ("Конструкторы", "Lego City Космическая станция", "Большой набор Lego для самостоятельной сборки. Желательно собирать в космосе.", "5990.00", 8, 12, "/images/lego-city.png"),
            ("Плюшевые игрушки", "Плюшевый медведь", "Незаменимый друг на все случаи жизни.", "890.00", 15, 0, "/images/teddy-bear.png"),
            ("Настольные игры", "Морской бой", "Классическая игра для двоих", "650.00", 20, 6, "/images/battleship.png"),
        ]
        for category_name, name, description, price, stock, age_from, image_url in products:
            product = db.scalar(select(Product).where(Product.name == name))
            if product is None:
                db.add(Product(category_id=categories[category_name].id, name=name, description=description, price=Decimal(price), stock=stock, age_from=age_from, image_url=image_url))
            else:
                product.category_id = categories[category_name].id
                product.description = description
                product.image_url = image_url
        if db.scalar(select(User).where(User.email == "admin@toystore.local")) is None:
            db.add(User(email="admin@toystore.local", name="Администратор", password_hash=hash_password("admin12345"), role="admin"))
        db.commit()
        print("Тестовые данные добавлены")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
