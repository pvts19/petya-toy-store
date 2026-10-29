import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { addToCart, CartItem, Category, createOrder, createProduct, deleteProduct as deleteProductApi, getAllOrders, getCart, getCategories, getMe, getOrders, getProducts, login, Order, Product, register, removeFromCart, updateOrderStatus, User } from './api'

type AuthMode = 'login' | 'register'
type Page = 'catalog' | 'contacts' | 'about'

function formatPrice(value: string | number) {
  return Number(value).toString()
}

function productImage(product: Product) {
  return product.image_url || `https://loremflickr.com/640/480/${encodeURIComponent(product.name)},toy?lock=${product.id}`
}

export function App() {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.slice(1)
    return hash === 'contacts' || hash === 'about' ? hash : 'catalog'
  })
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('')
  const [age, setAge] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('toystore_token') || '')
  const [cart, setCart] = useState<CartItem[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showAuth, setShowAuth] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const changePage = () => {
      const hash = window.location.hash.slice(1)
      setPage(hash === 'contacts' || hash === 'about' ? hash : 'catalog')
    }
    window.addEventListener('hashchange', changePage)
    return () => window.removeEventListener('hashchange', changePage)
  }, [])

  function navigate(nextPage: Page) {
    window.location.hash = nextPage === 'catalog' ? '' : nextPage
    setPage(nextPage)
  }

  useEffect(() => { getProducts(search, category, age).then(setProducts).catch((e: Error) => setError(e.message)) }, [search, category, age])
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])) }, [])
  useEffect(() => { if (token) { getCart(token).then(setCart).catch(() => { localStorage.removeItem('toystore_token'); setToken(''); setUser(null); setNotice('Сессия закончилась. Войдите снова.') }); getMe(token).then(setUser).catch(() => setUser(null)) } else setUser(null) }, [token])
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.subtotal), 0), [cart])

  async function addProduct(product: Product) {
    if (!token) { setShowAuth(true); setNotice('Войдите, чтобы добавить товар в корзину'); return }
    try { await addToCart(token, product.id); setCart(await getCart(token)); setNotice('Товар добавлен в корзину') }
    catch (e) {
      const message = (e as Error).message
      if (message === 'Неверный токен') {
        logout()
        setShowAuth(true)
        setNotice('Сессия закончилась. Войдите снова.')
      } else setError(message)
    }
  }
  async function removeProduct(product: Product) {
    if (!token || user?.role !== 'admin') return
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return
    try {
      await deleteProductApi(token, product.id)
      setProducts((items) => items.filter((item) => item.id !== product.id))
      setNotice('Товар удалён')
    } catch (e) { setError((e as Error).message) }
  }
  function logout() { localStorage.removeItem('toystore_token'); setToken(''); setCart([]); setUser(null) }

  return <main className="page">
    <header className="header"><div className="brand">петя<span>toy</span></div><h1 className="rainbowTitle">{'Магазин игрушек'.split('').map((letter, index) => <span key={`${letter}-${index}`}>{letter === ' ' ? '\u00a0' : letter}</span>)}</h1><div className="headerActions">{user?.role === 'admin' && page === 'catalog' && <button className="adminLink" onClick={() => document.getElementById('admin-panel')?.scrollIntoView({ behavior: 'smooth' })}>Админка</button>}<button className="cartIcon" aria-label="Открыть корзину" onClick={() => setShowCart(true)}><img src="/cart.svg" alt="" />{cart.length > 0 && <span>{cart.length}</span>}</button>{token ? <button className="linkButton" onClick={logout}>Выйти</button> : <button className="loginButton" onClick={() => setShowAuth(true)}>Войти</button>}</div><nav className="siteNav"><button className={page === 'catalog' ? 'active' : ''} onClick={() => navigate('catalog')}>Каталог</button><button className={page === 'contacts' ? 'active' : ''} onClick={() => navigate('contacts')}>Контакты</button><button className={page === 'about' ? 'active' : ''} onClick={() => navigate('about')}>О нас</button></nav></header>
    {page === 'catalog' && <div className="catalogControls"><label className="search"><span>Поиск по каталогу</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Например, конструктор" /></label><label className="filter"><span>Категория</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Все категории</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="filter"><span>Возраст</span><select value={age} onChange={(e) => setAge(e.target.value)}><option value="">Любой возраст</option><option value="3">от 3 лет</option><option value="6">от 6 лет</option><option value="12">от 12 лет</option></select></label></div>}
    {notice && <p className="notice">{notice}</p>}{error && <p className="error">{error}. Убедитесь, что backend запущен на http://localhost:8000.</p>}
    {page === 'catalog' && <><section className="grid">{products.map((product) => <article className="card" key={product.id}><div className="image"><img loading="lazy" src={productImage(product)} alt={product.name} /></div><p className="age">от {product.age_from} лет</p><h2>{product.name}</h2><p className="description">{product.description || 'Новая игрушка для игры и развития.'}</p><div className="cardFooter"><strong>{formatPrice(product.price)} ₽</strong><button onClick={() => addProduct(product)}>В корзину</button></div>{user?.role === 'admin' && <button className="deleteButton" onClick={() => removeProduct(product)}>Удалить товар</button>}</article>)}</section>{!error && products.length === 0 && <p className="empty">В каталоге пока нет товаров.</p>}{user?.role === 'admin' && <AdminPanel token={token} />}{user && <OrderHistory token={token} />}</>}
    {page === 'contacts' && <InfoPage title="Контакты"><p>Если у вас появились вопросы по товарам или заказу, напишите нам или позвоните.</p><div className="contactList"><p><strong>Почта:</strong> petr.ts.00@mail.ru</p><p><strong>Телефон:</strong> +7 999 138 66 46</p></div></InfoPage>}
    {page === 'about' && <InfoPage title="О нас"><p>Магазин «петяtoy» появился из любви к хорошим игрушкам и желанию радовать детей.</p><p>Мы выбираем интересные конструкторы, настольные игры, железные дороги и мягкие игрушки для разных возрастов.</p><p>Все игрушки мы продаём с большой душой и аккуратно упаковываем для вас, чтобы покупка была приятной с самого первого момента.</p></InfoPage>}
    {showAuth && <AuthForm mode={authMode} onModeChange={setAuthMode} onClose={() => setShowAuth(false)} onSuccess={(newToken) => { localStorage.setItem('toystore_token', newToken); setToken(newToken); setShowAuth(false); setNotice('Вы вошли в аккаунт') }} />}
    {showCart && <CartPanel cart={cart} total={total} token={token} onClose={() => setShowCart(false)} onChanged={() => getCart(token).then(setCart)} onOrder={(message) => { setShowCart(false); setNotice(message); setCart([]) }} />}
  </main>
}

function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  return <section className="infoPage"><h2>{title}</h2><div>{children}</div></section>
}

function OrderHistory({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => { getOrders(token).then(setOrders).catch(() => setOrders([])) }, [token])
  if (orders.length === 0) return null
  return <section className="orders"><h2>Мои заказы</h2>{orders.map(order => <div className="order" key={order.id}><span>Заказ #{order.id}</span><span>{formatPrice(order.total_amount)} ₽</span><strong>{order.status}</strong></div>)}</section>
}

function AdminPanel({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [message, setMessage] = useState('')
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [stock, setStock] = useState(''); const [categoryId, setCategoryId] = useState('')
  useEffect(() => { getAllOrders(token).then(setOrders); getCategories().then((items) => { setCategories(items); if (items[0]) setCategoryId(String(items[0].id)) }) }, [token])
  async function addProduct(e: FormEvent) { e.preventDefault(); try { await createProduct(token, { category_id: Number(categoryId), name, description: '', price: Number(price), stock: Number(stock), age_from: 0, image_url: `https://loremflickr.com/640/480/${encodeURIComponent(name)}`, is_active: true }); setName(''); setPrice(''); setStock(''); setMessage('Товар добавлен') } catch (value) { setMessage((value as Error).message) } }
  async function changeStatus(id: number, status: string) { await updateOrderStatus(token, id, status); setOrders(await getAllOrders(token)) }
  return <section className="admin" id="admin-panel"><h2>Админ-панель</h2><form className="adminForm" onSubmit={addProduct}><h3>Добавить товар</h3><input required placeholder="Название" value={name} onChange={e => setName(e.target.value)} />{name && <img className="adminPreview" src={`https://loremflickr.com/320/180/${encodeURIComponent(name)}`} alt="Предпросмотр товара" />}<input required type="number" min="1" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} /><input required type="number" min="0" placeholder="Количество" value={stock} onChange={e => setStock(e.target.value)} /><select value={categoryId} onChange={e => setCategoryId(e.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="primary">Добавить</button>{message && <p>{message}</p>}</form><h3>Заказы</h3>{orders.length === 0 ? <p>Заказов пока нет.</p> : orders.map(order => <div className="adminOrder" key={order.id}><span>Заказ #{order.id}, {formatPrice(order.total_amount)} ₽</span><select value={order.status} onChange={e => changeStatus(order.id, e.target.value)}><option value="new">Новый</option><option value="confirmed">Подтверждён</option><option value="processing">Собирается</option><option value="shipped">Передан в доставку</option><option value="completed">Завершён</option><option value="cancelled">Отменён</option></select></div>)}</section>
}

function AuthForm({ mode, onModeChange, onClose, onSuccess }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void; onSuccess: (token: string) => void }) {
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  async function submit(e: FormEvent) { e.preventDefault(); try { if (mode === 'register') await register(email, name, password); const result = await login(email, password); onSuccess(result.access_token) } catch (value) { setError((value as Error).message) } }
  return <div className="overlay"><form className="modal" onSubmit={submit}><button type="button" className="close" onClick={onClose}>×</button><h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>{mode === 'register' && <input required placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />}<input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><input required minLength={8} type="password" placeholder="Пароль от 8 символов" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p className="formError">{error}</p>}<button className="primary" type="submit">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button><button type="button" className="switch" onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}</button></form></div>
}

function CartPanel({ cart, total, token, onClose, onChanged, onOrder }: { cart: CartItem[]; total: number; token: string; onClose: () => void; onChanged: () => void; onOrder: (message: string) => void }) {
  const [checkout, setCheckout] = useState(false); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState(''); const [error, setError] = useState('')
  async function order(e: FormEvent) { e.preventDefault(); try { await createOrder(token, { customer_name: name, phone, address }); onOrder('Заказ оформлен') } catch (value) { setError((value as Error).message) } }
  return <div className="overlay"><aside className="cartPanel"><button className="close" onClick={onClose}>×</button><h2>Корзина</h2>{cart.length === 0 ? <p>Корзина пока пуста.</p> : <>{cart.map(item => <div className="cartRow" key={item.product_id}><span>{item.product_name} × {item.quantity}</span><strong>{formatPrice(item.subtotal)} ₽</strong><button onClick={() => removeFromCart(token, item.product_id).then(onChanged)}>Удалить</button></div>)}<div className="total"><span>Итого</span><strong>{formatPrice(total)} ₽</strong></div>{!checkout ? <button className="primary" onClick={() => setCheckout(true)}>Оформить заказ</button> : <form onSubmit={order} className="checkout"><input required placeholder="Имя получателя" value={name} onChange={e => setName(e.target.value)} /><input required placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)} /><textarea required placeholder="Адрес доставки" value={address} onChange={e => setAddress(e.target.value)} />{error && <p className="formError">{error}</p>}<button className="primary">Подтвердить заказ</button></form>}</>}</aside></div>
}
