import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Check, ChevronDown, CircleHelp, Heart, LayoutDashboard, Search, ShoppingBag, Sparkles, Star, TrendingUp, UserRound, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from './api'

const categories = ['All', 'Electronics', 'Home', 'Fashion', 'Sports', 'Stationery']
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
const shortNumber = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0)

function ProductCard({ product, onBuy, onSimilar }) {
  return <article className="product-card">
    <div className="product-image-wrap">
      <img src={product.image} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      <span className="category-pill">{product.category}</span>
      <button className="icon-button favorite" title="Save item (demo)" onClick={() => onSimilar(product)}><Heart size={17} /></button>
    </div>
    <div className="product-content">
      <div className="rating"><Star size={14} fill="currentColor" /> {product.rating} <span>· {product.stock} in stock</span></div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-footer"><strong>{money(product.price)}</strong><div className="product-actions"><button className="text-button" onClick={() => onSimilar(product)}>Similar</button><button className="buy-button" onClick={() => onBuy(product)}><ShoppingBag size={15} /> Buy demo</button></div></div>
    </div>
  </article>
}

function StatCard({ icon: Icon, label, value, detail, positive = true }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div><strong className="stat-value">{value}</strong><div className={`stat-detail ${positive ? 'positive' : ''}`}>{positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{detail}</div></div>
}

export default function App() {
  const [page, setPage] = useState('Discover')
  const [products, setProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [overview, setOverview] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [health, setHealth] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [preferences, setPreferences] = useState(['Electronics', 'Home', 'Technology'])
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [similarModal, setSimilarModal] = useState(null)
  const [similarItems, setSimilarItems] = useState([])
  const [showPreferences, setShowPreferences] = useState(false)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const [p, r, o, c, t, h] = await Promise.all([api.products(), api.recommendations(), api.overview(), api.categories(), api.topProducts(), api.health()])
      setProducts(p); setRecommendations(r); setOverview(o); setCategoryData(c); setTopProducts(t); setHealth(h)
    } catch (e) { setToast(`API connection error: ${e.message}. Start the FastAPI backend.`) }
    finally { setBusy(false) }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleProducts = useMemo(() => products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category
    const q = search.toLowerCase()
    const matchesSearch = !q || `${p.name} ${p.description} ${p.category} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  }), [products, category, search])

  async function buy(product) {
    try { await api.purchase(product.id); setToast(`Demo purchase recorded for ${product.name}`); await refresh() }
    catch (e) { setToast(e.message) }
  }
  async function openSimilar(product) {
    setSimilarModal(product)
    try { setSimilarItems(await api.similar(product.id)) } catch (e) { setSimilarItems([]); setToast(e.message) }
  }
  async function savePreferences() {
    try { await api.preferences('demo-user', preferences); setShowPreferences(false); setToast('Your shopping interests were saved.'); await refresh() }
    catch (e) { setToast(e.message) }
  }

  const nav = [
    { label: 'Discover', icon: ShoppingBag }, { label: 'For you', icon: Sparkles },
    { label: 'Analytics', icon: BarChart3 }, { label: 'Preferences', icon: UserRound }
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={21} /></div><div><strong>ShopSense<span>AI</span></strong><small>SMART COMMERCE</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.label} onClick={() => { setPage(item.label); if (item.label === 'Preferences') setShowPreferences(true) }} className={`nav-item ${page === item.label ? 'active' : ''}`}><item.icon size={18} /><span>{item.label}</span>{item.label === 'For you' && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18} /></div><strong>Need a hand?</strong><p>Explore smarter ways to shop with AI-powered picks.</p><button onClick={() => setToast('Recommendations use product text, your selected interests, and demo purchase history.')}>How it works <span>↗</span></button></div><div className="profile-row"><div className="avatar">H</div><div className="profile-copy"><strong>Husnain</strong><small>Demo shopper</small></div><ChevronDown size={16} className="muted" /></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="top-actions"><div className={`connection ${health?.status === 'ok' ? 'online' : ''}`}><span />{health ? `API ${health.database}` : 'Connecting'}</div><button className="avatar top-avatar" onClick={() => setPage('Preferences')}>H</button></div></header>
      <div className="page-container">
        {page === 'Analytics' ? <Analytics overview={overview} categoryData={categoryData} topProducts={topProducts} /> : page === 'Preferences' ? <Preferences preferences={preferences} setPreferences={setPreferences} save={savePreferences} /> : <>
          <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL SHOPPING ASSISTANT</div><h1>{page === 'For you' ? 'Made for your taste.' : 'Find your next favorite.'}</h1><p>{page === 'For you' ? 'A handpicked mix based on your interests and purchase patterns.' : 'Discover thoughtful picks selected around what matters to you.'}</p></div><button className="primary-button" onClick={() => { setPage('Preferences'); setShowPreferences(true) }}><Sparkles size={16} /> Tune my picks</button></section>
          <section className="hero-banner"><div className="hero-copy"><span className="hero-tag"><Sparkles size={13} /> AI CURATED FOR YOU</span><h2>Less scrolling.<br /><em>More finding.</em></h2><p>Personalized product discovery that gets better as your interests evolve.</p><button onClick={() => setPage('For you')}>Explore my picks <span>→</span></button></div><div className="hero-art"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-product"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" alt="Wireless headphones" /></div><div className="floating-note"><span className="note-spark"><Sparkles size={14} /></span><div><strong>Picked for you</strong><small>Based on your interests</small></div><Check size={17} className="note-check" /></div><div className="hero-stat"><TrendingUp size={16} /><span><strong>Smart picks</strong><small>Powered by AI</small></span></div></div></section>
          {page === 'For you' && <section className="section-block"><SectionHeading title="Your personalized collection" subtitle="Ranked for your selected interests and purchase history" action={<span className="ai-label"><Sparkles size={13} /> AI MATCHED</span>} /><div className="product-grid">{recommendations.map(p => <ProductCard key={p.id} product={p} onBuy={buy} onSimilar={openSimilar} />)}</div></section>}
          <section className="section-block"><SectionHeading title={page === 'For you' ? 'Browse all products' : 'Explore the collection'} subtitle="Find something useful for your everyday" action={<span className="result-count">{visibleProducts.length} items</span>} />
            <div className="catalog-tools"><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, categories..." /><kbd>⌘ K</kbd></div><div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
            {busy ? <div className="loading-state">Loading your collection…</div> : <div className="product-grid">{visibleProducts.map(p => <ProductCard key={p.id} product={p} onBuy={buy} onSimilar={openSimilar} />)}</div>}
            {!visibleProducts.length && !busy && <div className="empty-state">No products match that search. Try another term or category.</div>}
          </section>
          {page !== 'For you' && <section className="section-block"><SectionHeading title="Picked around your interests" subtitle="A few products your profile may love" action={<button className="text-button" onClick={() => setPage('For you')}>See all picks →</button>} /><div className="product-grid">{recommendations.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onBuy={buy} onSimilar={openSimilar} />)}</div></section>}
          <footer className="footer"><span>© 2026 ShopSense AI</span><span><span className="footer-dot" /> Demo environment · No real payments</span></footer>
        </>}
      </div>
    </main>

    {showPreferences && <div className="modal-backdrop" onClick={() => setShowPreferences(false)}><div className="modal preferences-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowPreferences(false)}><X size={18} /></button><div className="eyebrow"><Sparkles size={14} /> PERSONALIZE YOUR FEED</div><h2>What are you into?</h2><p>Select categories and interests to help ShopSense find more relevant products.</p><div className="preference-options">{['Electronics', 'Home', 'Fashion', 'Sports', 'Stationery', 'Technology', 'Fitness', 'Coffee', 'Productivity'].map(item => <button key={item} className={preferences.includes(item) ? 'chosen' : ''} onClick={() => setPreferences(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])}>{preferences.includes(item) && <Check size={14} />}{item}</button>)}</div><button className="primary-button full-button" onClick={savePreferences}>Save my interests <ArrowUpRight size={16} /></button></div></div>}
    {similarModal && <div className="modal-backdrop" onClick={() => setSimilarModal(null)}><div className="modal similar-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSimilarModal(null)}><X size={18} /></button><div className="eyebrow"><Sparkles size={14} /> SIMILAR PRODUCTS</div><h2>More like {similarModal.name}</h2><p>Related picks matched by product description, category, and tags.</p><div className="similar-list">{similarItems.map(p => <div className="similar-row" key={p.id}><img src={p.image} alt="" /><div><strong>{p.name}</strong><small>{p.category} · Similarity {Math.round((p.similarity_score || 0) * 100)}%</small></div><b>{money(p.price)}</b></div>)}</div></div></div>}
    {toast && <div className="toast"><Check size={17} />{toast}<button onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>
}

function SectionHeading({ title, subtitle, action }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>
}

function Analytics({ overview, categoryData, topProducts }) {
  return <><section className="welcome-row"><div><div className="eyebrow"><BarChart3 size={14} /> STORE PERFORMANCE</div><h1>Your store at a glance.</h1><p>Understand what customers buy and where recommendations can help.</p></div><span className="date-chip"><Activity size={15} /> Demo analytics</span></section>
    <div className="stats-grid"><StatCard icon={ShoppingBag} label="Products" value={overview?.products ?? '—'} detail="In your catalog" /><StatCard icon={TrendingUp} label="Demo revenue" value={money(overview?.revenue)} detail="Recorded demo purchases" /><StatCard icon={Activity} label="Orders" value={overview?.orders ?? '—'} detail={`${overview?.units_sold ?? 0} units sold`} /><StatCard icon={BarChart3} label="Avg. order value" value={money(overview?.avg_order_value)} detail="Across recorded orders" /></div>
    <section className="analytics-grid"><div className="panel chart-panel"><SectionHeading title="Sales by category" subtitle="Units sold across product categories" /><div className="chart-area">{categoryData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" /><XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#82899b', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#82899b', fontSize: 11 }} /><Tooltip cursor={{ fill: '#f5f7fc' }} /><Bar dataKey="units_sold" name="Units sold" radius={[6,6,0,0]}>{categoryData.map((_, i) => <Cell key={i} fill={['#7767ef','#48b9a5','#f1b85b','#f17d85','#6e9eea','#a6a1b7'][i % 6]} />)}</Bar></BarChart></ResponsiveContainer> : <div className="empty-state">Waiting for analytics…</div>}</div></div>
      <div className="panel category-panel"><SectionHeading title="Category insights" subtitle="Revenue contribution" />{categoryData.map((c, i) => { const total = categoryData.reduce((s, x) => s + x.revenue, 0) || 1; return <div className="category-insight" key={c.category}><div className="category-insight-top"><span><i style={{ background: ['#7767ef','#48b9a5','#f1b85b','#f17d85','#6e9eea','#a6a1b7'][i % 6] }} />{c.category}</span><strong>{money(c.revenue)}</strong></div><div className="progress-track"><span style={{ width: `${Math.max(2, c.revenue / total * 100)}%`, background: ['#7767ef','#48b9a5','#f1b85b','#f17d85','#6e9eea','#a6a1b7'][i % 6] }} /></div><small>{c.units_sold} units sold · {Math.round(c.revenue / total * 100)}% of revenue</small></div> })}</div></section>
    <section className="panel top-products-panel"><SectionHeading title="Top products" subtitle="Ranked by units sold in demo purchase data" action={<span className="ai-label"><TrendingUp size={13} /> BEST SELLERS</span>} /><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>UNITS SOLD</th><th>REVENUE</th></tr></thead><tbody>{topProducts.slice(0, 6).map((p, i) => <tr key={p.id}><td><div className="table-product"><span className="rank">0{i + 1}</span><img src={p.image} alt="" /><strong>{p.name}</strong></div></td><td><span className="table-category">{p.category}</span></td><td>{money(p.price)}</td><td><strong>{p.units_sold}</strong></td><td><strong>{money(p.revenue)}</strong></td></tr>)}</tbody></table></div></section>
    <footer className="footer"><span>© 2026 ShopSense AI</span><span><span className="footer-dot" /> Demo environment · No real payments</span></footer>
  </>
}

function Preferences({ preferences, setPreferences, save }) {
  const options = ['Electronics', 'Home', 'Fashion', 'Sports', 'Stationery', 'Technology', 'Fitness', 'Coffee', 'Productivity']
  return <><section className="welcome-row"><div><div className="eyebrow"><UserRound size={14} /> YOUR SHOPPING PROFILE</div><h1>Your taste, your feed.</h1><p>Choose what you care about. ShopSense uses these signals to rank relevant products.</p></div></section><section className="panel preference-page-panel"><div className="preference-illustration"><div className="pref-icon"><Sparkles size={26} /></div><h2>Make it personal</h2><p>Choose a few interests below. Your recommendations will reflect the categories and keywords you select.</p><div className="pref-stats"><div><strong>{preferences.length}</strong><small>Selected interests</small></div><div><strong>12</strong><small>Demo products</small></div><div><strong>AI</strong><small>Recommendation engine</small></div></div></div><div className="preference-editor"><h3>My interests</h3><p>Select all that sound like you.</p><div className="preference-options">{options.map(item => <button key={item} className={preferences.includes(item) ? 'chosen' : ''} onClick={() => setPreferences(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])}>{preferences.includes(item) && <Check size={14} />}{item}</button>)}</div><button className="primary-button full-button" onClick={save}>Save preferences <ArrowUpRight size={16} /></button></div></section></>
}
