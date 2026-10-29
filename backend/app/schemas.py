from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):
    id: int
    # Тестовый администратор использует локальный адрес .local.
    # Для ответа авторизации достаточно вернуть строку, без проверки домена.
    email: str
    name: str
    role: str
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class CategoryPublic(CategoryCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=200)
    description: str = ""
    price: Decimal = Field(gt=0)
    stock: int = Field(ge=0)
    age_from: int = Field(ge=0, le=18)
    image_url: str | None = None
    is_active: bool = True


class ProductPublic(ProductCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)


class CartItemPublic(BaseModel):
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=30)
    address: str = Field(min_length=5, max_length=500)


class OrderItemPublic(BaseModel):
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    model_config = ConfigDict(from_attributes=True)


class OrderPublic(BaseModel):
    id: int
    total_amount: Decimal
    status: str
    customer_name: str
    phone: str
    address: str
    items: list[OrderItemPublic]
    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|confirmed|processing|shipped|completed|cancelled)$")
