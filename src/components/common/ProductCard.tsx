import React, { useState, useMemo } from 'react';
import { type Product } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const toast = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Parse base price dynamically
  const basePrice = useMemo(() => {
    return parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
  }, [product.price]);

  // Parse old price dynamically
  const oldPrice = useMemo(() => {
    return product.old ? (parseFloat(product.old.replace(/[^\d.]/g, '')) || 0) : 0;
  }, [product.old]);

  // Wholesale tiers calculation
  const tier1Price = basePrice;
  /* Commented out unused wholesale tiers for now
  const tier2Price = parseFloat((basePrice * 0.85).toFixed(2));
  const tier3Price = parseFloat((basePrice * 0.75).toFixed(2));
  const tier4Price = parseFloat((basePrice * 0.65).toFixed(2));

  // Determine active tier based on quantity
  const activeTier = useMemo(() => {
    if (quantity >= 10 && quantity <= 49) return 2;
    if (quantity >= 50 && quantity <= 199) return 3;
    if (quantity >= 200) return 4;
    return 1;
  }, [quantity]);
  */

  // Determine active price
  const activePrice = useMemo(() => {
    // Commented out wholesale tiers calculation for now
    /*
    if (activeTier === 2) return tier2Price;
    if (activeTier === 3) return tier3Price;
    if (activeTier === 4) return tier4Price;
    */
    return tier1Price;
  }, [tier1Price]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return parseFloat((quantity * activePrice).toFixed(2));
  }, [quantity, activePrice]);

  // Discount percentage and You Save
  const discountPercent = useMemo(() => {
    if (oldPrice > activePrice) {
      return Math.round(((oldPrice - activePrice) / oldPrice) * 100);
    }
    return 0;
  }, [oldPrice, activePrice]);

  const savings = useMemo(() => {
    if (oldPrice > activePrice) {
      return parseFloat((oldPrice - activePrice).toFixed(2));
    }
    return 0;
  }, [oldPrice, activePrice]);

  /* Commented out unused tier click handler for now
  const handleTierClick = (tier: number) => {
    if (tier === 1) setQuantity(1);
    if (tier === 2) setQuantity(10);
    if (tier === 3) setQuantity(50);
    if (tier === 4) setQuantity(200);
  };
  */

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
    } catch (err: any) {
      toast.error('Unable to add item to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // Determine unit name based on category/product name
  const unitText = useMemo(() => {
    const catName = product.cat.toLowerCase();
    const prodName = product.name.toLowerCase();
    if (catName.includes('food') || prodName.includes('tea') || prodName.includes('honey')) {
      return 'pack';
    }
    if (catName.includes('construction') || prodName.includes('wood') || prodName.includes('cement')) {
      return 'bag';
    }
    return 'unit';
  }, [product.cat, product.name]);

  const categoryName = useMemo(() => {
    const originalCat = (product as any)._original?.category?.name;
    if (originalCat) return originalCat;
    if (product.cat === 'food') return 'Food & Grocery';
    if (product.cat === 'cosmetics') return 'Cosmetics';
    if (product.cat === 'construction') return 'Construction';
    return 'Product';
  }, [product]);

  return (
    <div
      className="premium-card wholesale-style"
      onClick={() => onProductClick(product)}
      style={{ position: 'relative' }}
    >
      {/* IMAGE WRAP */}
      <div className="prod-img-wrap">
        <div className="badge-container">
          <span className="badge-pill organic-badge">
            {product.badge || 'ORGANIC'}
          </span>
          {discountPercent > 0 && (
            <span className="badge-pill discount-badge">
              -{discountPercent}%
            </span>
          )}
        </div>

        <button
          className="wl-btn-round"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <i className={`${isInWishlist(product.id) ? 'fa-solid' : 'fa-regular'} fa-heart`} style={isInWishlist(product.id) ? { color: '#e74c3c' } : undefined}></i>
        </button>
        <img src={product.img} alt={product.name} />
      </div>

      {/* INFO WRAP */}
      <div className="prod-info-wrap">
        <div className="cat-label">{categoryName}</div>
        <div className="title-label">{product.name}</div>
        <div className="rating-row">
          <span className="stars">
            {Array.from({ length: 5 }).map((_, idx) => (
              <i key={idx} className={`${idx < product.stars ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
            ))}
          </span>
        </div>

        {/* PRICE DETAIL BOX */}
        <div className="price-details-box">
          <div className="price-details-left">
            <div className="price-row-main">
              <span className="current-price-large">RM {activePrice.toFixed(2)}</span>
              {oldPrice > activePrice && (
                <span className="old-price-line">RM {oldPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="price-unit-sub">
              per {unitText}
            </div>
          </div>
          {savings > 0 && (
            <div className="price-savings-right">
              <div className="savings-label">You save</div>
              <div className="savings-value">RM {savings.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* WHOLESALE PRICING SECTION COMMENTED OUT FOR LATER */}
        {/*
        <div className="wholesale-pricing-section">
          <div className="wholesale-header">
            <span className="wholesale-title">Wholesale Pricing</span>
            <span className="wholesale-action">Buy more, save more</span>
          </div>
          <div className="wholesale-tiers-grid">
            <div
              className={`wholesale-tier-card ${activeTier === 1 ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleTierClick(1); }}
            >
              <div className="tier-range">1–9</div>
              <div className="tier-price">RM {tier1Price.toFixed(2)}</div>
            </div>
            <div
              className={`wholesale-tier-card ${activeTier === 2 ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleTierClick(2); }}
            >
              <div className="tier-range">10–49</div>
              <div className="tier-price">RM {tier2Price.toFixed(2)}</div>
            </div>
            <div
              className={`wholesale-tier-card ${activeTier === 3 ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleTierClick(3); }}
            >
              <div className="tier-range">50–199</div>
              <div className="tier-price">RM {tier3Price.toFixed(2)}</div>
            </div>
            <div
              className={`wholesale-tier-card ${activeTier === 4 ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleTierClick(4); }}
            >
              <div className="tier-range">200+</div>
              <div className="tier-price">RM {tier4Price.toFixed(2)}</div>
            </div>
          </div>
        </div>
        */}

        {/* QUANTITY & SUBTOTAL SELECTOR */}
        <div className="qty-subtotal-row">
          <div className="qty-capsule" onClick={(e) => e.stopPropagation()}>
            <button
              className="qty-btn"
              disabled={quantity <= 1}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="qty-val">{quantity}</span>
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => q + 1)}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="subtotal-block">
            <div className="subtotal-label">Subtotal</div>
            <div className="subtotal-value">RM {subtotal.toFixed(2)}</div>
          </div>
        </div>

        {/* ADD TO CART ACTION */}
        <button
          className="add-cart-wholesale-btn"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-white"></i>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-shopping-cart text-white"></i>
              <span>Add {quantity} to cart </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
