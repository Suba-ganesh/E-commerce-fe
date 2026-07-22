import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, type Product } from '../../services/productService';
import { reviewService, type Review } from '../../services/reviewService';
import { campaignService, type PromotionSetting } from '../../services/campaignService';
import { useToast } from '../../context/ToastContext';

import { ProductCard } from '../common/ProductCard';
import { ProductSkeleton } from '../common/ProductSkeleton';

const staticReviews: any[] = [
  {
    id: 1,
    rating: 5,
    description: "The coconut oil from Chenni's is genuinely the best I've tried. Pure, fresh, and I can taste the quality. My entire family is hooked. Will never go back to supermarket brands!",
    user: {
      first_name: "Nur",
      last_name: "Aisha",
      profile_image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=84&q=80&fit=crop&crop=face",
      addresses: [{ city: "Kuala Lumpur" }]
    },
    product: {
      category: "food"
    }
  },
  {
    id: 2,
    rating: 5,
    description: "I switched to Chenni's rosehip serum after struggling with breakouts from other brands. Within 2 weeks my skin cleared up. The natural ingredients really make a difference!",
    user: {
      first_name: "Siti",
      last_name: "Rahmah",
      profile_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=84&q=80&fit=crop&crop=face",
      addresses: [{ city: "Penang" }]
    },
    product: {
      category: "cosmetics"
    }
  },
  {
    id: 3,
    rating: 5,
    description: "Ordered bamboo flooring panels for our eco-home project. Excellent quality, precise dimensions, and delivered right on schedule. The wholesale team was incredibly helpful throughout.",
    user: {
      first_name: "Rizal",
      last_name: "Ahmad",
      profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=84&q=80&fit=crop&crop=face",
      addresses: [{ city: "Johor Bahru" }]
    },
    product: {
      category: "construction"
    }
  }
];

interface HomeViewProps {
  onNavigate?: (viewId: string) => void;
  onFilterChange?: (category: string, subcategory: string) => void;
  onProductClick?: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onFilterChange,
  onProductClick,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Promotions State from Database
  const [promos, setPromos] = useState<PromotionSetting[]>([]);
  const [homeCounters, setHomeCounters] = useState<any[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  // Flash Offer Countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch campaigns data from backend
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await campaignService.getPromotions();
        if (res.success && res.data) {
          setPromos(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch promotions:', err);
      }
    };
    const fetchCounters = async () => {
      try {
        const res = await campaignService.getCounters();
        if (res.success && res.data) {
          setHomeCounters(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch counters:', err);
      }
    };
    fetchPromotions();
    fetchCounters();
  }, []);

  // Update countdown timer based on active flash sale end-date
  useEffect(() => {
    const flashSale = promos.find(p => p.key === 'flash_sale');
    if (!flashSale || !flashSale.target_date || !flashSale.is_active) {
      // Default to 14 hours if inactive or missing
      setTimeLeft({ hours: 14, minutes: 28, seconds: 45 });
      return;
    }

    const interval = setInterval(() => {
      const difference = new Date(flashSale.target_date!).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      const totalSec = Math.floor(difference / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [promos]);

  // Click-to-copy coupon handler
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
  };

  // Newsletter subscription handler
  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const res = await campaignService.subscribeNewsletter(newsletterEmail);
      if (res.success) {
        toast.success('Successfully subscribed to newsletter! Use WELCOME10 for 10% off your first order.');
        setNewsletterEmail('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Newsletter subscription failed.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (onFilterChange && onNavigate) {
      onFilterChange(category, 'all');
      onNavigate('listing');
    } else {
      navigate(`/shop?category=${encodeURIComponent(category)}&subcategory=all`);
    }
  };

  const [allFeaturedProducts, setAllFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstElementChild?.clientWidth || 350;
      carouselRef.current.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstElementChild?.clientWidth || 350;
      carouselRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch featured products from the dedicated endpoint
        const featuredResponse = await productService.getFeaturedProducts({ limit: 20 });

        // Map backend products to frontend format
        const data = featuredResponse?.data || [];
        const mappedProducts = data.map((p: any) => productService.mapBackendProductToFrontend(p));
        
        setAllFeaturedProducts(mappedProducts);

        // Fetch categories from backend
        const catResponse = await productService.getCategories();
        if (catResponse.data && Array.isArray(catResponse.data)) {
          setCategories(catResponse.data.slice(0, 3));
        }

        // Fetch recent reviews
        try {
          const reviewResponse = await reviewService.getRecentReviews(6);
          const fetched = reviewResponse?.data || [];
          setReviews([...fetched, ...staticReviews]);
        } catch (err) {
          console.warn('Failed to fetch dynamic reviews, using static testimonials:', err);
          setReviews(staticReviews);
        }
      } catch (err: any) {
        console.error('Failed to fetch featured products:', err);
        setError(err.message || 'Failed to load featured products.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const featuredProducts = selectedCategory === 'all' 
    ? allFeaturedProducts.slice(0, 8) 
    : allFeaturedProducts.filter(prod => prod.cat === selectedCategory).slice(0, 8);

  return (
    <div className="animate-fade-in flex flex-col w-full text-left">

      {/* HERO SECTION */}
      <section className="hero grid grid-cols-1 lg:grid-cols-2 min-h-auto lg:min-h-[580px] w-full">
        {/* LEFT: Content panel */}
        <div className="hero-left px-6 py-12 sm:px-12 sm:py-16 md:px-16 md:py-20 lg:pl-20 lg:pr-14 lg:py-16">
          <div className="hero-leaf-blob b1"></div>
          <div className="hero-leaf-blob b2"></div>
          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            Malaysia's #1 Nature Marketplace
          </div>
          {/* Headline */}
          <h1 className="hero-h1 text-[40px] sm:text-[44px] lg:text-[54px] leading-tight sm:leading-[1.05] tracking-tight">
            Pure Nature,<br />
            <span className="accent">Delivered</span><br />
            to Your Door
          </h1>
          {/* Sub-description */}
          <p className="hero-subtext text-[14.5px] sm:text-[15.5px] max-w-[420px]">
            Premium organic food, natural cosmetics, and sustainable construction materials &mdash; all sourced from Malaysia's finest natural producers, shipped to your door.
          </p>
          {/* CTA Buttons */}
          <div className="hero-btns flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="btn-primary w-full sm:w-auto justify-center" onClick={() => onNavigate ? onNavigate('listing') : navigate('/shop')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Shop Now
            </button>
            <button className="btn-secondary w-full sm:w-auto justify-center" onClick={() => {
              const el = document.getElementById('categories');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Explore Categories</button>
          </div>
          {/* Trust pills */}
          <div className="hero-trust-row flex flex-wrap gap-2.5">
            <div className="hero-trust-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Best Seller Certified
            </div>
            <div className="hero-trust-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Organic Certified
            </div>
            <div className="hero-trust-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              10,000+ Customers
            </div>
          </div>
        </div>

        {/* RIGHT: Dark image panel with category cards */}
        <div className="hero-right h-[460px] sm:h-[520px] lg:h-auto w-full relative">
          {/* Background lifestyle image */}
          <img className="hero-main-img" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=90&fit=crop&crop=center" alt="Premium natural lifestyle" />
          <div className="hero-right-overlay"></div>

          {/* TOP-LEFT: Flash badge */}
          <div className="hero-badge-tl">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Flash Sale &mdash; Up to 30% Off
          </div>

          {/* TOP-RIGHT: Organic Certified badge */}
          <div className="hero-badge-cert">
            <div className="hero-cert-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M7 12l3 3 7-7" />
              </svg>
            </div>
            Organic Certified
          </div>

          {/* CENTRE: 3 category cards stacked */}
          <div className="hero-cat-stack">
            {categories.map((cat) => {
              const slug = (cat.slug || '').toLowerCase();
              let cardDetails = {
                label: 'Food & Grocery',
                labelClass: 'food-lbl',
                name: 'Natural & Organic',
                img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&q=80&fit=crop'
              };

              if (slug.includes('cosmetic')) {
                cardDetails = {
                  label: 'Beauty & Wellness',
                  labelClass: 'cosm-lbl',
                  name: 'Natural Cosmetics',
                  img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&q=80&fit=crop'
                };
              } else if (slug.includes('construction') || slug.includes('material')) {
                cardDetails = {
                  label: 'Eco Construction',
                  labelClass: 'cons-lbl',
                  name: 'Sustainable Build',
                  img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&q=80&fit=crop'
                };
              }

              const count = cat.products?.length || cat._count?.products || 0;
              const countText = count > 0 ? `${count}+ products` : `Explore Now`;

              return (
                <div key={cat.id || cat.slug} className="hero-cat-row" onClick={() => handleCategoryClick(cat.slug)}>
                  <div className="hero-cat-thumb">
                    <img src={cat.image_url || cardDetails.img} alt={cat.name} />
                  </div>
                  <div className="hero-cat-info">
                    <div className={`hero-cat-label ${cardDetails.labelClass}`}>{cardDetails.label}</div>
                    <div className="hero-cat-name">{cat.name}</div>
                    <div className="hero-cat-count">{countText}</div>
                  </div>
                  <div className="hero-cat-arrow">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM-RIGHT: Social proof counter */}
          <div className="hero-badge-br">
            <div className="b-num">10,000+</div>
            <div className="b-lbl">Happy Customers</div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="trust-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Free Delivery above RM 80</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>100% Authentic Products</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-5" />
          </svg>
          <span>Easy Returns &amp; Refunds</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4l3 3" />
          </svg>
          <span>24/7 Customer Support</span>
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <section className="section" id="categories">
        <div className="sec-header">
          <div className="sec-title">
            <div className="eyebrow">Browse By Category</div>
            <h2>Shop Our <span>Main Categories</span></h2>
          </div>
          <a onClick={(e) => { e.preventDefault(); handleCategoryClick('all'); }} href="#" className="view-all">View all categories &rarr;</a>
        </div>
        <div className="cat-grid">
          {categories.map((cat) => {
            const slug = (cat.slug || '').toLowerCase();
            let details = {
              cardClass: 'food',
              pill: 'Food Products',
              title: 'Natural & Organic',
              desc: 'Fresh produce, superfoods, herbal teas, spices & more — straight from nature.',
              ctaText: 'Shop Food',
              bgImg: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=700&q=85&fit=crop',
              pillColor: ''
            };

            if (slug.includes('cosmetic')) {
              details = {
                cardClass: 'cosm',
                pill: 'Cosmetics',
                title: 'Natural Beauty',
                desc: 'Plant-based skincare, organic hair care, and zero-cruelty beauty essentials.',
                ctaText: 'Shop Beauty',
                bgImg: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&q=85&fit=crop',
                pillColor: '#E91E63'
              };
            } else if (slug.includes('construction') || slug.includes('material')) {
              details = {
                cardClass: 'cons',
                pill: 'Construction',
                title: 'Eco-Build Materials',
                desc: 'Sustainable timber, eco-cement, green insulation & construction supplies.',
                ctaText: 'Shop Build',
                bgImg: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=700&q=85&fit=crop',
                pillColor: '#7A5A2A'
              };
            }

            const count = cat.products?.length || cat._count?.products || 0;
            const countText = count > 0 ? `${count}+ products available` : `${details.pill} Section`;

            return (
              <div 
                key={cat.id || cat.slug}
                className={`cat-card ${details.cardClass}`} 
                onClick={() => handleCategoryClick(cat.slug)} 
                style={{ cursor: 'pointer' }}
              >
                <div className="cat-bg">
                  <img src={cat.image_url || details.bgImg} alt={cat.name} />
                </div>
                <div className="cat-overlay"></div>
                <div className="cat-body" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="cat-pill" style={details.pillColor ? { color: details.pillColor } : undefined}>
                    {details.pill}
                  </div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description || details.desc}</p>
                  <a onClick={(e) => e.preventDefault()} href="#" className="cat-cta">
                    {details.ctaText} &rarr;
                  </a>
                  <div className="cat-count">{countText}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        {homeCounters.length > 0 ? (
          homeCounters.map(c => (
            <div key={c.key} className="stat-item">
              <div className="stat-num">
                {c.value}
                {c.key === 'rating' && <i className="fa-solid fa-star text-[14px] ml-1 align-middle"></i>}
              </div>
              <div className="stat-lbl">{c.label}</div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-item">
              <div className="stat-num">10,000+</div>
              <div className="stat-lbl">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">295+</div>
              <div className="stat-lbl">Products Listed</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">3</div>
              <div className="stat-lbl">Business Verticals</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">4.8<i className="fa-solid fa-star"></i></div>
              <div className="stat-lbl">Average Rating</div>
            </div>
          </>
        )}
      </div>

      {/* FEATURED PRODUCTS */}
      <section className="section section-alt">
        <div className="sec-header">
          <div className="sec-title">
            <div className="eyebrow">Handpicked for You</div>
            <h2>Featured <span>Products</span></h2>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            {['all', 'food', 'cosmetics', 'construction'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={
                  selectedCategory === cat
                    ? { background: '#fff', border: '1.5px solid var(--g1)', color: 'var(--g1)', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
                    : { background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--muted)', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer' }
                }
              >
                {cat === 'all' ? 'All' : cat === 'food' ? 'Food' : cat === 'cosmetics' ? 'Cosmetics' : 'Construction'}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="prod-grid" style={{ width: '100%' }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center" style={{ width: '100%' }}>
            <i className="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
            <p className="font-bold">{error}</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border-design rounded-2xl bg-white flex flex-col items-center justify-center" style={{ width: '100%' }}>
            <i className="fa-solid fa-folder-open text-g1/20 text-[48px] mb-4"></i>
            <h3 className="font-extrabold text-[18px] text-g3 mb-1">No featured products yet</h3>
            <p className="text-muted text-[13.5px] max-w-[280px]">Check back later for our new collection.</p>
          </div>
        ) : (
          <div className="prod-grid">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onProductClick={onProductClick || ((p) => navigate(`/shop/product/${p.id}`, { state: { product: p } }))}
              />
            ))}
          </div>
        )}
      </section>

      {/* SPECIAL OFFERS */}
      <section className="section">
        <div className="sec-header">
          <div className="sec-title">
            <div className="eyebrow">Limited Time</div>
            <h2>Special <span>Offers</span></h2>
          </div>
        </div>
        <div className="offers-grid">
          {/* Food Offer Card */}
          {(!promos.length || promos.find(p => p.key === 'food_offer')?.is_active) && (() => {
            const offer = promos.find(p => p.key === 'food_offer');
            const promoCode = offer?.promo_code || 'CHENNI25';
            return (
              <div className="offer-card green">
                <div className="bg-shape"></div>
                <div className="bg-shape2"></div>
                <div className="offer-img">
                  <img
                    src={offer?.image_url || "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&q=80&fit=crop"}
                    alt="Organic food products"
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="offer-tag">Food &amp; Grocery</div>
                  <h3>{offer?.title || 'Get 25% Off Organic Food'}</h3>
                  <p>{offer?.description || 'Use code CHENNI25 on all food products. Limited to 500 orders!'}</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => handleCategoryClick('food')} className="btn-offer">Shop Food Deals &rarr;</button>
                    <button
                      onClick={() => handleCopyCoupon(promoCode)}
                      className="px-3.5 py-2 bg-white/20 border border-white/30 hover:bg-white/30 text-white rounded-xl text-[12px] font-extrabold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <i className="fa-regular fa-copy"></i> {promoCode}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cosmetics Offer Card */}
          {(!promos.length || promos.find(p => p.key === 'cosmetics_offer')?.is_active) && (() => {
            const offer = promos.find(p => p.key === 'cosmetics_offer');
            const promoCode = offer?.promo_code || 'B2G1FREE';
            return (
              <div className="offer-card purple">
                <div className="bg-shape"></div>
                <div className="bg-shape2"></div>
                <div className="offer-img">
                  <img
                    src={offer?.image_url || "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80&fit=crop"}
                    alt="Natural beauty cosmetics"
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="offer-tag">Beauty &amp; Wellness</div>
                  <h3>{offer?.title || 'Buy 2 Get 1 Free on Cosmetics'}</h3>
                  <p>{offer?.description || 'Add any 3 cosmetic products and the cheapest one is yours free — automatically!'}</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => handleCategoryClick('cosmetics')} className="btn-offer">Shop Beauty Deals &rarr;</button>
                    <button
                      onClick={() => handleCopyCoupon(promoCode)}
                      className="px-3.5 py-2 bg-white/20 border border-white/30 hover:bg-white/30 text-white rounded-xl text-[12px] font-extrabold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <i className="fa-regular fa-copy"></i> {promoCode}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Flash countdown bar */}
        {(!promos.length || promos.find(p => p.key === 'flash_sale')?.is_active) && (() => {
          const flash = promos.find(p => p.key === 'flash_sale');
          return (
            <div
              className="flex flex-col lg:flex-row items-center justify-between gap-6 rounded-2xl w-full text-center lg:text-left mt-6"
              style={{ background: 'linear-gradient(90deg, #008F44 0%, #0A7A3E 60%, #006B35 100%)', padding: '20px 24px' }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <span style={{ fontSize: '18px', color: '#FFFFFF' }}><i className="fa-solid fa-bolt animate-pulse"></i></span>
                <div className="flex flex-col items-center sm:items-start">
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{flash?.title || 'Flash Sale — Construction Materials'}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>{flash?.description || 'Up to 20% off eco-build supplies. Ends in:'}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center">
                <div className="flex items-center gap-2">
                  <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', width: '58px', height: '58px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>HRS</div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>:</span>
                  <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', width: '58px', height: '58px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>MIN</div>
                  </div>
                  <span style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>:</span>
                  <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', width: '58px', height: '58px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>SEC</div>
                  </div>
                </div>
                <button
                  onClick={() => handleCategoryClick('construction')}
                  className="w-full sm:w-auto justify-center"
                  style={{ background: '#FFFFFF', color: '#008F44', border: 'none', borderRadius: '9px', height: '42px', padding: '0 24px', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Shop Now
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* WHY CHOOSE */}
      <section className="section section-alt">
        <div className="sec-header">
          <div className="sec-title">
            <div className="eyebrow">Our Promise</div>
            <h2>Why Choose <span>Chenni's</span>?</h2>
          </div>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon" style={{ background: '#E8F5EC' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
                <path d="M7 12l3 3 7-7" />
              </svg>
            </div>
            <h4>100% Natural &amp; Organic</h4>
            <p>Every product is rigorously sourced from nature &mdash; no harmful additives, no synthetic preservatives.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#EDE8F5' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="2" strokeLinecap="round">
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
              </svg>
            </div>
            <h4>Lab-Tested Quality</h4>
            <p>All products undergo third-party quality testing to ensure safety and purity for you and your family.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#E8F5EC' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h4>Malaysian Made</h4>
            <p>Proudly supporting local producers, farmers, and artisans across Malaysia's rich natural landscape.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#F5F0E8' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E05F00" strokeWidth="2" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-5" />
              </svg>
            </div>
            <h4>Eco-Conscious Packaging</h4>
            <p>Our packaging is recyclable, biodegradable, or reusable &mdash; because we care about the planet too.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#E8F5EC' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="3" width="15" height="13" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h4>Fast &amp; Reliable Delivery</h4>
            <p>Nationwide delivery with real-time tracking. Same-day dispatch for orders placed before 2PM.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#EDE8F5' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h4>Wholesale Partnerships</h4>
            <p>Flexible B2B wholesale programmes for businesses of all sizes with dedicated account managers.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#E8F5EC' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h4>Secure Checkout</h4>
            <p>SSL-encrypted checkout with support for FPX, credit cards, GrabPay, TNG and more.</p>
          </div>
          <div className="why-card">
            <div className="why-icon" style={{ background: '#F5F0E8' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E05F00" strokeWidth="2" strokeLinecap="round">
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h4>4.8 Star Rated</h4>
            <p>Over 10,000 customers trust Chenni's for consistent quality, service, and genuine natural products.</p>
          </div>
        </div>
      </section>

      {/* WHOLESALE */}
      <div className="wholesale">
        <div className="wholesale-bg-img"><img
            src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1400&q=80&fit=crop"
            alt="Premium wholesale warehouse logistics and distribution center" /></div>
        <div className="wholesale-text">
          <div className="eyebrow">B2B Partnership</div>
          <h2>Grow Your Business<br />with Chenni's<br />Wholesale</h2>
          <p>Join our wholesale network and access premium natural products at competitive bulk pricing. Whether you're a
            retailer, restaurateur, or property developer &mdash; we have the right partnership for you.</p>
          <div className="wholesale-btns">
            <button className="btn-white">Apply for Wholesale &rarr;</button>
            <button className="btn-outline-wh">Download Catalogue</button>
          </div>
        </div>
        <div className="wholesale-perks">
          <div className="perk-item">
            <div className="perk-ico">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  stroke="var(--g2)" />
              </svg>
            </div>
            <div>
              <h5>Bulk Pricing</h5>
              <p>Up to 35% discount on orders above RM 500</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-ico">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="3" width="15" height="13" stroke="var(--g2)" />
                <path d="M16 8h4l3 5v3h-7V8z" stroke="var(--g2)" />
                <circle cx="5.5" cy="18.5" r="2.5" stroke="var(--g2)" />
                <circle cx="18.5" cy="18.5" r="2.5" stroke="var(--g2)" />
              </svg>
            </div>
            <div>
              <h5>Priority Dispatch</h5>
              <p>Same-day fulfilment for verified wholesale accounts</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-ico">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--g2)" />
                <circle cx="9" cy="7" r="4" stroke="var(--g2)" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--g2)" />
              </svg>
            </div>
            <div>
              <h5>Dedicated Manager</h5>
              <p>A personal account manager assigned to your business</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-ico">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--g2)" />
                <polyline points="14 2 14 8 20 8" stroke="var(--g2)" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="var(--g2)" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="var(--g2)" />
                <polyline points="10 9 9 9 8 9" stroke="var(--g2)" />
              </svg>
            </div>
            <div>
              <h5>Custom Invoicing</h5>
              <p>Net 30/60 payment terms &amp; credit line options</p>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="section">
        <div className="sec-header">
          <div className="sec-title">
            <div className="eyebrow">What Customers Say</div>
            <h2>Loved by <span>10,000+</span> Malaysians</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--g1)' }}>4.8</span>
              <div>
                <div style={{ color: '#F5A623', fontSize: '16px' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Based on 2,400+ reviews</div>
              </div>
            </div>
            {/* Carousel navigation controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={scrollPrev}
                className="w-8 h-8 rounded-full border border-border-design bg-white text-txt hover:bg-g1 hover:border-g1 hover:text-white flex items-center justify-center cursor-pointer transition shadow-sm text-[12px]"
                aria-label="Previous Review"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                onClick={scrollNext}
                className="w-8 h-8 rounded-full border border-border-design bg-white text-txt hover:bg-g1 hover:border-g1 hover:text-white flex items-center justify-center cursor-pointer transition shadow-sm text-[12px]"
                aria-label="Next Review"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="relative w-full">
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 no-scrollbar w-full"
            style={{ scrollBehavior: 'smooth' }}
          >
            {reviews.map((rev) => {
              const firstName = rev.user?.first_name || 'Anonymous';
              const lastName = rev.user?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const location = rev.user?.addresses?.[0]?.city || 'Malaysia';
              
              let cat = 'food';
              if (rev.product?.category) {
                if (typeof rev.product.category === 'object') {
                  cat = (rev.product.category.slug || rev.product.category.name || 'food').toLowerCase();
                } else if (typeof rev.product.category === 'string') {
                  cat = rev.product.category.toLowerCase();
                }
              }

              let tagClass = 'tag-food';
              let catLabel = 'Food';
              if (cat.includes('cosmetic') || cat.includes('beauty')) {
                tagClass = 'tag-cosm';
                catLabel = 'Cosmetics';
              } else if (cat.includes('construction') || cat.includes('material') || cat.includes('eco')) {
                tagClass = 'tag-cons';
                catLabel = 'Construction';
              }

              const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');
              const getFullImageUrl = (url: string) => {
                if (!url) return '';
                if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
                  return url;
                }
                return `${API_HOST}${url}`;
              };

              const avatarUrl = rev.user?.profile_image
                ? getFullImageUrl(rev.user.profile_image)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=EAFDF1&color=008F44&bold=true`;

              return (
                <div key={rev.id} className="review-card flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start">
                  <div className="rev-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className="fa-solid fa-star"
                        style={{ color: i < rev.rating ? '#F5A623' : '#e2e8f0' }}
                      ></i>
                    ))}
                  </div>
                  <p className="rev-text">"{rev.description || rev.title || 'Excellent product!'}"</p>
                  <div className="rev-author">
                    <div className="rev-avatar">
                      <img src={avatarUrl} alt={fullName} />
                    </div>
                    <div>
                      <div className="rev-name">{fullName}</div>
                      <div className="rev-loc">{location}</div>
                    </div>
                    <span className={`rev-tag ${tagClass}`}>{catLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter animate-fade-in">
        <div
          style={{ display: 'inline-block', background: 'rgba(0,132,74,.1)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: 'var(--g3)', fontWeight: 600, marginBottom: '14px' }}>
          Stay In The Loop
        </div>
        <h2>Get 10% Off Your First Order</h2>
        <p>Subscribe to our newsletter for exclusive deals, new arrivals, health tips, and nature-living inspiration delivered straight to your inbox.</p>
        
        <form onSubmit={handleNewsletterSubscribe} className="nl-form">
          <input
            type="email"
            required
            placeholder="Enter your email address..."
            value={newsletterEmail}
            onChange={e => setNewsletterEmail(e.target.value)}
            disabled={subscribing}
          />
          <button type="submit" disabled={subscribing}>
            {subscribing ? 'Subscribing...' : 'Subscribe'} &rarr;
          </button>
        </form>
        <p className="nl-note">No spam, ever. Unsubscribe anytime. By subscribing you agree to our Privacy Policy.</p>
      </section>

    </div>
  );
};

export default HomeView;
