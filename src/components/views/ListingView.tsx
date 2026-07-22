import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productService, type Product } from '../../services/productService';
import { ProductCard } from '../common/ProductCard';
import { ProductSkeleton } from '../common/ProductSkeleton';

interface ListingViewProps {
  onProductClick?: (product: Product) => void;
  onNavigate?: (viewId: string) => void;
  categoryFilter?: string;
  subcategoryFilter?: string;
}

export const ListingView: React.FC<ListingViewProps> = ({
  onProductClick,
  onNavigate,
  categoryFilter,
  subcategoryFilter,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleProductClick = (product: Product) => {
    if (onProductClick && onNavigate) {
      onProductClick(product);
      onNavigate('details');
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const safeCategory = categoryFilter ?? searchParams.get("category") ?? "all";
  const safeSubcategory = subcategoryFilter ?? searchParams.get("subcategory") ?? "all";
  const searchTerm = searchParams.get("search") ?? "";

  // State definitions relocated above bannerDetails memo block
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [organicOnly, setOrganicOnly] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<string>('all');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [safeCategory, safeSubcategory, searchTerm, sortBy, priceRange, organicOnly, selectedCertification]);

  // Dynamically set banner details based on category filter
  const bannerDetails = useMemo(() => {
    if (safeCategory === 'featured') {
      return {
        title: (safeSubcategory && safeSubcategory !== 'all') ? safeSubcategory : 'Featured Collection',
        desc: 'Explore our hand-picked, premium eco-friendly favorites.',
        breadcrumb: `Home > Shop > Featured > ${(safeSubcategory && safeSubcategory !== 'all') ? safeSubcategory : 'All'}`,
        img: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&q=80&fit=crop',
      };
    }

    const foundCat = categories.find(c => (c.slug || '').toLowerCase() === safeCategory.toLowerCase());
    if (foundCat) {
      let fallbackImg = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1400&q=80&fit=crop';
      let slug = (foundCat.slug || '').toLowerCase();
      if (slug.includes('food')) {
        fallbackImg = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&q=80&fit=crop';
      } else if (slug.includes('cosmetic')) {
        fallbackImg = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80&fit=crop';
      } else if (slug.includes('construction') || slug.includes('material')) {
        fallbackImg = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80&fit=crop';
      }

      return {
        title: safeSubcategory !== 'all' ? safeSubcategory : foundCat.name,
        desc: safeSubcategory !== 'all'
          ? `Explore our premium selection of ${(safeSubcategory ?? "").toLowerCase()}.`
          : (foundCat.description || `Browse our ecosystem of ${foundCat.name.toLowerCase()} essentials.`),
        breadcrumb: `Home > Shop > ${foundCat.name} ${safeSubcategory !== 'all' ? `> ${safeSubcategory}` : ''}`,
        img: foundCat.image_url || fallbackImg,
      };
    }

    return {
      title: 'Shop All Products',
      desc: 'Browse our entire ecosystem of sustainable living essentials.',
      breadcrumb: 'Home > Shop > All',
      img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1400&q=80&fit=crop',
    };
  }, [safeCategory, safeSubcategory, categories]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Failed to load categories in catalog listing', err);
      }
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productService.getProducts({ limit: 200, status: 'ACTIVE' }); // fetch a large batch for frontend filtering
        const data = response.data?.data || [];
        const mappedProducts = data.map((p: any) => productService.mapBackendProductToFrontend(p));
        setAllProducts(mappedProducts);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError('Unable to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Compute filtered products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Filter by category
    if (safeCategory !== 'all' && safeCategory !== 'featured') {
      result = result.filter(p => p.cat === safeCategory);
    }

    // 2. Filter by search term
    const safeSearch = (searchTerm ?? "").trim();
    if (safeSearch) {
      const term = safeSearch.toLowerCase();
      result = result.filter(p =>
        (p.name ?? "").toLowerCase().includes(term) ||
        (p.badge ?? "").toLowerCase().includes(term)
      );
    }

    // 3. Filter by subcategory (if clicked via header or sidebar)
    if (safeSubcategory !== 'all' && safeCategory !== 'featured') {
      const targetSub = safeSubcategory.toLowerCase();
      result = result.filter(p => {
        const subcatSlug = (p._original?.subcategory?.slug || '').toLowerCase();
        const subcatName = (p._original?.subcategory?.name || '').toLowerCase();
        return subcatSlug === targetSub || subcatName === targetSub;
      });
    }

    // 4. Organic-only check
    if (organicOnly) {
      result = result.filter(p => (p.badge ?? "").toLowerCase().includes('organic') || (p.badge ?? "").toLowerCase().includes('eco') || (p.badge ?? "").toLowerCase().includes('vegan') || p.cat === 'food');
    }

    // 5. Price filter
    result = result.filter(p => {
      const priceVal = parseFloat((p.price ?? "0").replace(/[^\d.]/g, ''));
      return priceVal >= priceRange.min && priceVal <= priceRange.max;
    });

    // 6. Certifications
    if (selectedCertification !== 'all') {
      result = result.filter(p => (p.badge ?? "").toLowerCase() === (selectedCertification ?? "").toLowerCase() || (p.badge ?? "").toLowerCase().includes((selectedCertification ?? "").toLowerCase()));
    }

    // 7. Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => {
        const pA = parseFloat((a.price ?? "0").replace(/[^\d.]/g, ''));
        const pB = parseFloat((b.price ?? "0").replace(/[^\d.]/g, ''));
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => {
        const pA = parseFloat((a.price ?? "0").replace(/[^\d.]/g, ''));
        const pB = parseFloat((b.price ?? "0").replace(/[^\d.]/g, ''));
        return pB - pA;
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.stars - a.stars);
    }

    return result;
  }, [allProducts, safeCategory, safeSubcategory, searchTerm, organicOnly, priceRange, selectedCertification, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="animate-fade-in flex flex-col w-full text-left">

      {/* CATEGORY BANNER */}
      <div className="cat-banner">
        <div className="cat-banner-bg">
          <img
            id="cat-banner-img"
            src={bannerDetails.img}
            alt={bannerDetails.title}
          />
        </div>
        <div className="cat-banner-content">
          {/* Breadcrumb could be here, but HTML hides it, we keep it visible like the React app does if we want, but user said "Copy the hero/banner exactly". Let's omit breadcrumb or keep it hidden. */}
          <span id="cat-breadcrumb" style={{ display: 'none' }}>{bannerDetails.breadcrumb}</span>
          <h1 id="cat-title">{bannerDetails.title}</h1>
          <p id="cat-desc">{bannerDetails.desc}</p>

          {/* DYNAMIC MARKETPLACE STATS */}
          {(safeCategory === 'food' || safeCategory === 'all' || safeCategory === 'featured') && (
            <div id="stats-food" className="cat-dynamic-stats" style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#27ae60' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>100% Organic</strong>
                  <span>Products</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#27ae60' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Fresh Daily</strong>
                  <span>Delivery</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#27ae60' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Premium Quality</strong>
                  <span>Ingredients</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#27ae60' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Farm Fresh</strong>
                  <span>Produce</span>
                </span>
              </div>
            </div>
          )}

          {safeCategory === 'cosmetics' && (
            <div id="stats-cosmetics" className="cat-dynamic-stats" style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E91E63' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Dermatologist</strong>
                  <span>Tested</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E91E63' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Natural</strong>
                  <span>Ingredients</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E91E63' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Cruelty</strong>
                  <span>Free</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E91E63' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Premium</strong>
                  <span>Skincare</span>
                </span>
              </div>
            </div>
          )}

          {safeCategory === 'construction' && (
            <div id="stats-construction" className="cat-dynamic-stats" style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E05F00' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>90+</strong>
                  <span>Construction Suppliers</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E05F00' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>1,500+</strong>
                  <span>Building Materials</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E05F00' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Bulk Order</strong>
                  <span>Support</span>
                </span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-card-icon" style={{ background: '#E05F00' }}><i className="fa-solid fa-check"></i></span>
                <span className="hero-stat-card-text">
                  <strong>Nationwide</strong>
                  <span>Delivery</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LISTING CONTENT */}
      <div className="listing-container">

         {/* SIDEBAR */}
        <aside className="listing-sidebar">

          <div id="filters-food" className="cat-dynamic-filters">
            {/* Category Selector Widget */}
            <div className="filter-widget" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 700, color: 'var(--g3)' }}>Categories</h4>
              <ul className="filter-list">
                <li>
                  <label style={{ fontWeight: safeCategory === 'all' ? 'bold' : 'normal', color: safeCategory === 'all' ? 'var(--g1)' : 'inherit' }}>
                    <input
                      type="radio"
                      name="sidebar-category"
                      checked={safeCategory === 'all'}
                      onChange={() => {
                        if (onNavigate) {
                          navigate('/shop?category=all&subcategory=all');
                        } else {
                          navigate('/shop?category=all&subcategory=all');
                        }
                      }}
                    />
                    All Categories
                  </label>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <label style={{ fontWeight: safeCategory === cat.slug ? 'bold' : 'normal', color: safeCategory === cat.slug ? 'var(--g1)' : 'inherit' }}>
                      <input
                        type="radio"
                        name="sidebar-category"
                        checked={safeCategory === cat.slug}
                        onChange={() => {
                          navigate(`/shop?category=${cat.slug}&subcategory=all`);
                        }}
                      />
                      {cat.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            {/* Dietary Needs -> Maps to Organic filter */}
            <div className="filter-widget" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 700, color: 'var(--g3)' }}>Dietary Needs</h4>
              <ul className="filter-list">
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={organicOnly}
                      onChange={(e) => setOrganicOnly(e.target.checked)}
                    />
                    Organic Certified
                  </label>
                </li>
              </ul>
            </div>

            {/* Price Range -> Maps to Price Range filter */}
            <div className="filter-widget" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 700, color: 'var(--g3)' }}>Price Range (RM)</h4>
              <ul className="filter-list">
                <li>
                  <label>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange.min === 0 && priceRange.max === 50}
                      onChange={() => setPriceRange({ min: 0, max: 50 })}
                    />
                    RM 0 – 50
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange.min === 50 && priceRange.max === 100}
                      onChange={() => setPriceRange({ min: 50, max: 100 })}
                    />
                    RM 50 – 100
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange.min === 100 && priceRange.max === 200}
                      onChange={() => setPriceRange({ min: 100, max: 200 })}
                    />
                    RM 100 – 200
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange.min === 200 && priceRange.max === 1000}
                      onChange={() => setPriceRange({ min: 200, max: 1000 })}
                    />
                    RM 200+
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange.min === 0 && priceRange.max === 1000}
                      onChange={() => setPriceRange({ min: 0, max: 1000 })}
                    />
                    All Prices
                  </label>
                </li>
              </ul>
            </div>

            {/* Certifications (Custom Options mapped to HTML structure) */}
            <div className="filter-widget" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 700, color: 'var(--g3)' }}>Certification</h4>
              <ul className="filter-list">
                {['all', 'Organic', 'Best Seller', 'New', 'Sale', 'Eco-Grade'].map((cert) => (
                  <li key={cert}>
                    <label>
                      <input
                        type="radio"
                        name="certification"
                        checked={selectedCertification === cert}
                        onChange={() => setSelectedCertification(cert)}
                      />
                      {cert === 'all' ? 'All Certifications' : cert}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </aside>

        {/* MAIN LISTING */}
        <main className="listing-main">

          {/* Listing Header */}
          <div className="listing-header">
            <div className="results-count">
              Showing <strong id="res-count">{filteredProducts.length}</strong> products
            </div>
            <div className="sort-wrap">
              <label htmlFor="sort">Sort by:</label>
              <select
                id="sort"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="prod-grid" id="listing-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <ProductSkeleton key={idx} />
              ))
            ) : error ? (
              <div className="col-span-full bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
                <i className="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                <p className="font-bold">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-24 text-center border border-dashed border-border-design rounded-2xl bg-white flex flex-col items-center justify-center">
                <i className="fa-solid fa-folder-open text-g1/20 text-[48px] mb-4"></i>
                <h3 className="font-extrabold text-[18px] text-g3 mb-1">No products found</h3>
                <p className="text-muted text-[13.5px] max-w-[280px]">Try adjusting your search query or reset your filters.</p>
              </div>
            ) : (
              paginatedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onProductClick={handleProductClick}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <a
                href="#"
                className={`page-btn page-nav ${currentPage === 1 ? 'disabled pointer-events-none opacity-50' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
              >
                &larr; Prev
              </a>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <a
                    key={pageNum}
                    href="#"
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                  >
                    {pageNum}
                  </a>
                );
              })}
              <a
                href="#"
                className={`page-btn page-nav ${currentPage === totalPages ? 'disabled pointer-events-none opacity-50' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
              >
                Next &rarr;
              </a>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default ListingView;
