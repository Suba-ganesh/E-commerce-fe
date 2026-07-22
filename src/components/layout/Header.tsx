import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import { productService, type Product } from '../../services/productService';
import { MiniCart } from './MiniCart';
import { MiniWishlist } from './MiniWishlist';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../context/LanguageContext';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = location.pathname === '/' ? 'home' : location.pathname.split('/')[1] || 'home';

  const onNavigate = (viewId: string) => {
    if (viewId === 'home') navigate('/');
    else if (viewId === 'listing') navigate('/shop');
    else if (viewId === 'portal') navigate('/portal/dashboard');
    else navigate(`/${viewId}`);
  };

  const onFilterChange = (category: string, subcategory: string) => {
    navigate(`/shop?category=${category}&subcategory=${subcategory}`);
  };

  const onSearch = (term: string) => {
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const onProductClick = (product: Product) => {
    navigate(`/shop/product/${product.id}`, { state: { product } });
  };
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, hasMore, page } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchMegaMenuData = async () => {
      try {
        const catRes = await productService.getCategories();
        if (catRes.data && Array.isArray(catRes.data)) {
          setCategories(catRes.data.slice(0, 3));
        }

        const prodRes = await productService.getProducts({ limit: 3, status: 'ACTIVE' });
        const prodsData = prodRes.data?.data || [];
        setFeaturedProducts(prodsData.map((p: any) => productService.mapBackendProductToFrontend(p)));
      } catch (err) {
        console.error('Failed to load mega menu data', err);
      }
    };
    fetchMegaMenuData();
  }, []);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setIsMegaOpen(false);
      }
      // Mini Cart and Wishlist outside click will be handled if needed, 
      // but they are primarily hover-based, and we can pass onClose to them.
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleCategoryClick = (category: string, subcategory: string) => {
    // Normalize category names to our frontend IDs if needed
    let normalizedCategory = (category || '').toLowerCase();
    if (normalizedCategory.includes('food')) normalizedCategory = 'food';
    else if (normalizedCategory.includes('cosmetic')) normalizedCategory = 'cosmetics';
    else if (normalizedCategory.includes('construction') || normalizedCategory.includes('material')) normalizedCategory = 'construction';

    // Normalize subcategory
    const normalizedSub = (subcategory || '').toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');

    setIsMegaOpen(false);
    onFilterChange(normalizedCategory, normalizedSub);
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border-design">
      <div className="flex items-center justify-between h-[90px] px-4 lg:px-14">

        {/* Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex-shrink-0 cursor-pointer"
        >
          <Logo style={{ height: '22px', width: 'auto', display: 'block', transform: 'scale(1.4)', transformOrigin: 'left center',  }} />
        </div>

        {/* Main Nav */}
        <nav className="hidden lg:flex items-center gap-6 mx-auto">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
            className={`text-sm font-medium text-txt hover:text-g1 transition-colors pb-1 border-b-2 ${currentView === 'home' ? 'border-g1 text-g1' : 'border-transparent'}`}
          >
            {t('nav_home')}
          </a>

          {/* Shop with Mega Menu */}
          <div className="mega-menu-wrapper relative" id="megaMenuWrapper" ref={megaMenuRef}>
            <a
              href="#"
              onMouseEnter={() => setIsMegaOpen(true)}
              onClick={(e) => { e.preventDefault(); setIsMegaOpen(!isMegaOpen); }}
              className={`flex items-center gap-1 text-sm font-medium text-txt hover:text-g1 transition-colors pb-1 border-b-2 ${currentView === 'listing' ? 'border-g1 text-g1' : 'border-transparent'}`}
              id="megaTrigger"
            >
              {t('nav_shop')} <i className="fa-solid fa-chevron-down text-xs"></i>
            </a>

            {/* Mega Menu */}
            {isMegaOpen && (
              <div
                onMouseLeave={() => setIsMegaOpen(false)}
                className="mega-menu"
                id="megaMenu"
                style={{ opacity: 1, visibility: 'visible', top: 'calc(100% + 20px)' }}
              >
                <div className="mega-menu-inner">
                  {/* Dynamic Category Columns */}
                  {categories.map((category) => (
                    <div className="mega-col" key={category.id || category.slug}>
                      <h3>{category.name}</h3>
                      <ul>
                        {category.subcategories && category.subcategories.length > 0 ? (
                          category.subcategories.map((sub: any) => (
                            <li key={sub.id || sub.slug || sub.name}>
                              <button
                                onClick={() => handleCategoryClick(category.slug || category.name, sub.slug || sub.name)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))
                        ) : (
                          (category.name.toLowerCase().includes('food')
                            ? ['Organic Oils', 'Herbs & Spices', 'Honey', 'Tea & Beverages', 'Health Foods', 'Snacks', 'Dry Fruits', 'Superfoods']
                            : category.name.toLowerCase().includes('cosmetic')
                              ? ['Skincare', 'Hair Care', 'Body Care', 'Face Serums', 'Essential Oils', 'Natural Soaps', 'Beauty Kits']
                              : ['Bamboo Materials', 'Eco Bricks', 'Natural Paints', 'Roofing Materials', 'Flooring', 'Wall Panels', 'Sustainable Building Products']
                          ).map((sub) => (
                            <li key={sub}>
                              <button
                                onClick={() => handleCategoryClick(category.slug || category.name, sub)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                              >
                                {sub}
                              </button>
                            </li>
                          ))
                        )}
                        <li>
                          <button
                            onClick={() => handleCategoryClick(category.slug || category.name, 'all')}
                            className="view-all"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%', borderBottom: 'none' }}
                          >
                            View All {category.name} &rarr;
                          </button>
                        </li>
                      </ul>
                    </div>
                  ))}

                  {/* Fill empty columns if less than 3 categories */}
                  {Array.from({ length: Math.max(0, 3 - categories.length) }).map((_, idx) => (
                    <div key={`empty-${idx}`}></div>
                  ))}

                  {/* Featured Collections */}
                  <div className="mega-col mega-featured">
                    <h3>Featured Collections</h3>
                    <div className="mega-cards">
                      {featuredProducts.length > 0 ? featuredProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setIsMegaOpen(false);
                            onProductClick(prod);
                          }}
                          className="mega-card"
                        >
                          <img src={prod.img} alt={prod.name} />
                          <div className="mega-card-info">
                            <h4>{prod.name}</h4>
                            <p>{(prod._original?.category?.name) || 'Featured'}</p>
                            <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>Shop Now</button>
                          </div>
                        </div>
                      )) : (
                        <div style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Loading products...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('about'); }}
            className={`text-sm font-medium text-txt hover:text-g1 transition-colors pb-1 border-b-2 ${currentView === 'about' ? 'border-g1 text-g1' : 'border-transparent'}`}
          >
            About Us
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
            className={`text-sm font-medium text-txt hover:text-g1 transition-colors pb-1 border-b-2 ${currentView === 'blog' ? 'border-g1 text-g1' : 'border-transparent'}`}
          >
            Blog
          </a>
        </nav>

        {/* Right Section: Search & Actions */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-6 flex-shrink-0">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-off border-2 border-border-design rounded-lg px-3 xl:px-4 py-2 xl:py-2.5 gap-2 w-[160px] xl:w-[220px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted flex-shrink-0">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-txt placeholder:text-muted"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 xl:gap-3">
            <div
              className="relative"
              onMouseEnter={() => setIsCartOpen(true)}
              onMouseLeave={() => setIsCartOpen(false)}
            >
              <button
                onClick={() => onNavigate('cart')}
                className="w-[36px] h-[36px] xl:w-[42px] xl:h-[42px] bg-g1 hover:bg-g3 text-white rounded-[10px] flex items-center justify-center transition-all shadow-[0_8px_20px_rgba(0,143,68,0.18)] hover:shadow-[0_8px_24px_rgba(0,143,68,0.28)] relative"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="xl:w-[18px] xl:h-[18px]">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D97706] text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <MiniCart isOpen={isCartOpen} onNavigate={onNavigate} onClose={() => setIsCartOpen(false)} />
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsWishlistOpen(true)}
              onMouseLeave={() => setIsWishlistOpen(false)}
            >
              <button
                onClick={() => onNavigate('wishlist')}
                className="w-[36px] h-[36px] xl:w-[42px] xl:h-[42px] bg-g1 hover:bg-g3 text-white rounded-[10px] flex items-center justify-center transition-all shadow-[0_8px_20px_rgba(0,143,68,0.18)] hover:shadow-[0_8px_24px_rgba(0,143,68,0.28)] relative"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="xl:w-[20px] xl:h-[20px]">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-pu text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <MiniWishlist isOpen={isWishlistOpen} onNavigate={onNavigate} onClose={() => setIsWishlistOpen(false)} />
            </div>

            <div
              className="relative"
              onMouseEnter={() => {
                setIsNotificationOpen(true);
                fetchNotifications(1);
              }}
              onMouseLeave={() => setIsNotificationOpen(false)}
            >
              <button
                onClick={() => onNavigate('notifications')}
                className="w-[36px] h-[36px] xl:w-[42px] xl:h-[42px] bg-g1 hover:bg-g3 text-white rounded-[10px] flex items-center justify-center transition-all shadow-[0_8px_20px_rgba(0,143,68,0.18)] hover:shadow-[0_8px_24px_rgba(0,143,68,0.28)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="xl:w-[20px] xl:h-[20px]">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>

              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {/* Notification Dropdown */}
              <div
                onMouseEnter={() => setIsNotificationOpen(true)}
                onMouseLeave={() => setIsNotificationOpen(false)}
                className={`absolute top-full mt-2 right-0 bg-white border border-border-design rounded-[20px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] w-[320px] z-50 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-top-right ${isNotificationOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-2 scale-95 pointer-events-none'}`}
              >
                <div className="p-4 border-b border-border-design flex justify-between items-center bg-off">
                  <h3 className="font-extrabold text-g3 text-sm uppercase tracking-wider">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        className="text-[11px] text-g1 font-bold bg-transparent border-none cursor-pointer hover:underline p-0"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted text-[13px]">
                      <i className="fa-solid fa-bell text-[24px] text-muted/30 block mb-2"></i>
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markAsRead([notif.id]);
                          }}
                          className={`px-4 py-3 border-b border-border-design last:border-b-0 cursor-pointer hover:bg-off transition-colors ${
                            !notif.is_read ? 'bg-[rgba(0,143,68,0.03)] border-l-[3px] border-l-g1' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-[13px] leading-tight ${!notif.is_read ? 'font-bold text-g3' : 'font-semibold text-txt'}`}>
                                {notif.title}
                              </div>
                              {notif.message && (
                                <div className="text-[11.5px] text-muted mt-1 line-clamp-2">{notif.message}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] text-muted mt-1.5">
                            {new Date(notif.created_at).toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          onClick={(e) => { e.stopPropagation(); fetchNotifications(page + 1); }}
                          className="w-full py-2.5 text-[12px] font-bold text-g1 bg-off hover:bg-gray-100 border-none cursor-pointer transition"
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Auth section */}
          <div id="nav-auth-wrapper" className="relative">
            {!isAuthenticated ? (
              <button
                onClick={() => onNavigate('login')}
                className="hidden md:flex items-center gap-2 px-4 xl:px-5 py-2 border-2 border-g1 text-g1 bg-white rounded-lg text-sm font-semibold hover:bg-off transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('nav_login')}
              </button>
            ) : (
              <div
                className="relative"
                onMouseEnter={() => setIsProfileDropdownOpen(true)}
                onMouseLeave={() => setIsProfileDropdownOpen(false)}
              >
                <button className="w-[36px] h-[36px] xl:w-[38px] xl:h-[38px] rounded-full bg-gradient-to-br from-g1 to-g3 text-white flex items-center justify-center font-bold text-sm hover:shadow-[0_4px_12px_rgba(0,143,68,0.3)] transition-shadow cursor-pointer">
                  {getUserInitials()}
                </button>

                <div
                  className={`absolute right-0 mt-2 bg-white border border-border-design rounded-2xl p-3 min-w-[220px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isProfileDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}
                >
                  <div className="px-3 py-2.5 border-b border-border-design mb-2">
                    <div className="font-extrabold text-g3 text-[15px]">{user?.name}</div>
                    <div className="text-xs text-muted">{user?.email}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onNavigate('portal')}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-txt hover:bg-off transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <i className={`fa-solid ${user?.role === 'customer' ? 'fa-user' : 'fa-gauge'} mr-2`}></i> {user?.role === 'customer' ? (t('nav_profile') || 'Profile') : (t('nav_portal') || 'Dashboard')}
                    </button>
                    {/* {user?.role !== 'admin' && user?.role?.toUpperCase() !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => navigate('/portal/orders')}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-txt hover:bg-off transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <i className="fa-solid fa-box-open mr-2"></i> My Orders
                      </button>
                    )} */}
                    <button
                      onClick={() => { logout(); onNavigate('home'); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> {t('nav_logout')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Hamburger menu button for small screens */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-g1 hover:bg-off cursor-pointer border-none bg-transparent"
          aria-label="Toggle menu"
        >
          <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
        </button>

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed top-[95px] left-0 w-full h-[calc(100vh-95px)] bg-white z-50 overflow-y-auto flex flex-col border-t border-border-design shadow-lg">
            <div className="flex flex-col p-6 gap-6">
              {/* Navigation links */}
              <div className="flex flex-col gap-4 border-b border-border-design pb-6">
                <h4 className="text-[12px] font-extrabold uppercase text-muted tracking-wider">Navigation</h4>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onNavigate('home'); }}
                  className={`text-[16px] font-bold ${currentView === 'home' ? 'text-g1' : 'text-g3'}`}
                >
                  Home
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onNavigate('listing'); }}
                  className={`text-[16px] font-bold ${currentView === 'listing' ? 'text-g1' : 'text-g3'}`}
                >
                  Shop All Products
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onNavigate('about'); }}
                  className={`text-[16px] font-bold ${currentView === 'about' ? 'text-g1' : 'text-g3'}`}
                >
                  About Us
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onNavigate('blog'); }}
                  className={`text-[16px] font-bold ${currentView === 'blog' ? 'text-g1' : 'text-g3'}`}
                >
                  Blog
                </a>
              </div>

              {/* Actions & Session */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[12px] font-extrabold uppercase text-muted tracking-wider">Account & Cart</h4>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('cart'); }}
                  className="flex items-center justify-between text-[16px] font-bold text-g3 bg-transparent border-none p-0 text-left w-full cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-shopping-bag text-g1"></i> Cart
                  </span>
                  {cartCount > 0 && <span className="bg-[#D97706] text-white px-2 py-0.5 rounded-full text-[12px] font-bold">{cartCount}</span>}
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('wishlist'); }}
                  className="flex items-center justify-between text-[16px] font-bold text-g3 bg-transparent border-none p-0 text-left w-full cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-heart text-pu"></i> Wishlist
                  </span>
                  {wishlistCount > 0 && <span className="bg-pu text-white px-2 py-0.5 rounded-full text-[12px] font-bold">{wishlistCount}</span>}
                </button>
                
                {/* Profile or Login */}
                <div className="border-t border-border-design pt-6 mt-2">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-g1 to-g3 text-white flex items-center justify-center font-bold text-[14px]">
                          {getUserInitials()}
                        </div>
                        <div>
                          <div className="font-extrabold text-g3 text-[15px]">{user?.name}</div>
                          <div className="text-[12px] text-muted">{user?.email}</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => { setIsMobileMenuOpen(false); onNavigate('portal'); }}
                        variant="outline"
                        className="w-full mt-2"
                      >
                        {user?.role === 'customer' ? 'My Profile' : 'Dashboard'}
                      </Button>
                      <Button
                        onClick={() => { setIsMobileMenuOpen(false); logout(); onNavigate('home'); }}
                        variant="danger"
                        className="w-full"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
                      className="w-full"
                    >
                      Login / Register
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
