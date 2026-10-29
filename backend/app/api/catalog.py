from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category, Product
from app.schemas import CategoryCreate, CategoryPublic, ProductCreate, ProductPublic
from app.security import admin_user


router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryPublic])
def categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.post("/categories", response_model=CategoryPublic, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    category = Category(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryPublic)
def update_category(category_id: int, data: CategoryCreate, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    category.name = data.name
    category.description = data.description
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    if db.scalar(select(Product).where(Product.category_id == category_id)) is not None:
        raise HTTPException(status_code=400, detail="Нельзя удалить категорию с товарами")
    db.delete(category)
    db.commit()


@router.get("/products", response_model=list[ProductPublic])
def products(
    search: str | None = Query(default=None),
    category: int | None = Query(default=None),
    age: int | None = Query(default=None, ge=0, le=18),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    ordering: str = Query(default="newest", pattern="^(newest|price|price_desc|name)$"),
    db: Session = Depends(get_db),
):
    query = select(Product).where(Product.is_active.is_(True))
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Product.name.ilike(pattern), Product.description.ilike(pattern)))
    if category is not None:
        query = query.where(Product.category_id == category)
    if age is not None:
        query = query.where(Product.age_from <= age)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    order_by = {
        "newest": Product.created_at.desc(),
        "price": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "name": Product.name.asc(),
    }[ordering]
    return db.scalars(query.order_by(order_by)).all()


@router.post("/products", response_model=ProductPublic, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    if db.get(Category, data.category_id) is None:
        raise HTTPException(status_code=400, detail="Категория не найдена")
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductPublic)
def product_detail(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product


@router.patch("/products/{product_id}", response_model=ProductPublic)
def update_product(product_id: int, data: ProductCreate, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    if db.get(Category, data.category_id) is None:
        raise HTTPException(status_code=400, detail="Категория не найдена")
    for key, value in data.model_dump().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    product.is_active = False
    db.commit()
