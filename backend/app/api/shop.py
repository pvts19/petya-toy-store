from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models import CartItem, Order, OrderItem, Product, User
from app.schemas import CartItemCreate, CartItemPublic, OrderCreate, OrderPublic, OrderStatusUpdate
from app.security import admin_user, current_user


router = APIRouter(tags=["shop"])


def cart_response(item: CartItem) -> CartItemPublic:
    subtotal = item.product.price * item.quantity
    return CartItemPublic(
        product_id=item.product_id,
        product_name=item.product.name,
        unit_price=item.product.price,
        quantity=item.quantity,
        subtotal=subtotal,
    )


@router.get("/cart", response_model=list[CartItemPublic])
def get_cart(user: User = Depends(current_user), db: Session = Depends(get_db)):
    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    return [cart_response(item) for item in items]


@router.post("/cart", response_model=CartItemPublic, status_code=201)
def add_to_cart(data: CartItemCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    product = db.get(Product, data.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Товар не найден")
    item = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product.id))
    quantity = (item.quantity if item else 0) + data.quantity
    if quantity > product.stock:
        raise HTTPException(status_code=400, detail="Недостаточно товара на складе")
    if item is None:
        item = CartItem(user_id=user.id, product_id=product.id, quantity=quantity)
        db.add(item)
    else:
        item.quantity = quantity
    db.commit()
    db.refresh(item)
    item.product = product
    return cart_response(item)


@router.delete("/cart/{product_id}", status_code=204)
def remove_from_cart(product_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if item is not None:
        db.delete(item)
        db.commit()


@router.patch("/cart/{product_id}", response_model=CartItemPublic)
def update_cart(product_id: int, data: CartItemCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if data.product_id != product_id:
        raise HTTPException(status_code=400, detail="Идентификатор товара не совпадает")
    item = db.scalar(
        select(CartItem).options(joinedload(CartItem.product)).where(
            CartItem.user_id == user.id, CartItem.product_id == product_id
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Товар отсутствует в корзине")
    if data.quantity > item.product.stock:
        raise HTTPException(status_code=400, detail="Недостаточно товара на складе")
    item.quantity = data.quantity
    db.commit()
    return cart_response(item)


@router.post("/orders", response_model=OrderPublic, status_code=201)
def create_order(data: OrderCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    items = db.scalars(
        select(CartItem).options(joinedload(CartItem.product)).where(CartItem.user_id == user.id)
    ).all()
    if not items:
        raise HTTPException(status_code=400, detail="Корзина пуста")
    for item in items:
        if item.product.stock < item.quantity or not item.product.is_active:
            raise HTTPException(status_code=400, detail=f"Недостаточно товара: {item.product.name}")

    total = sum((item.product.price * item.quantity for item in items), Decimal("0"))
    order = Order(
        user_id=user.id,
        total_amount=total,
        customer_name=data.customer_name,
        phone=data.phone,
        address=data.address,
    )
    db.add(order)
    for item in items:
        item.product.stock -= item.quantity
        order.items.append(OrderItem(
            product_id=item.product_id,
            product_name=item.product.name,
            unit_price=item.product.price,
            quantity=item.quantity,
        ))
        db.delete(item)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=list[OrderPublic])
def get_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Order).options(joinedload(Order.items)).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    ).unique().all()


@router.get("/admin/orders", response_model=list[OrderPublic])
def get_all_orders(db: Session = Depends(get_db), _admin=Depends(admin_user)):
    return db.scalars(select(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())).unique().all()


@router.patch("/admin/orders/{order_id}", response_model=OrderPublic)
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), _admin=Depends(admin_user)):
    order = db.scalar(select(Order).options(joinedload(Order.items)).where(Order.id == order_id))
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order
