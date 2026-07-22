import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService, type Product } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ProductCard } from '../common/ProductCard';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { WholesaleApplicationModal } from '../common/WholesaleApplicationModal';


interface ProductDetailsViewProps {
  product?: Product;
  onNavigate?: (viewId: string) => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  onNavigate,
}) => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routerProduct = location.state?.product as Product | undefined;
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const toast = useToast();

  const handleNavigate = (viewId: string) => {
    if (onNavigate) {
      onNavigate(viewId);
    } else if (viewId === 'listing') {
      navigate('/shop');
    } else {
      navigate(`/${viewId}`);
    }
  };

  const [quantity, setQuantity] = useState(1);
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [mostReviewed, setMostReviewed] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewDescription, setNewReviewDescription] = useState('');

  const { isAuthenticated } = useAuth();
  const idToUse = product?.id || routerProduct?.id || productId;

  const fetchReviews = async () => {
    if (!idToUse) return;
    try {
      setReviewsLoading(true);
      const reviewsRes = await reviewService.getProductReviews(idToUse);
      if (reviewsRes && reviewsRes.data) {
        setReviews(reviewsRes.data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!idToUse) {
          setError('No product ID provided');
          return;
        }
        const response = await productService.getProductById(idToUse);
        if (response.data) {
          const fetchedFrontendProduct = productService.mapBackendProductToFrontend(response.data);
          setFetchedProduct(fetchedFrontendProduct);

          // Fetch related products
          const relatedResponse = await productService.getProducts({
            categoryId: response.data.categoryId,
            limit: 4
          });
          if (relatedResponse.data && relatedResponse.data.data) {
            setRelatedProducts(
              relatedResponse.data.data
                .filter((p: any) => p.id !== idToUse)
                .slice(0, 4)
                .map(productService.mapBackendProductToFrontend)
            );
          }

          // Fetch recommendations (Bestsellers and Most Reviewed)
          const [bestRes, mostRes] = await Promise.all([
            productService.getProducts({ sort: 'bestseller', limit: 4 }),
            productService.getProducts({ sort: 'most_reviewed', limit: 4 })
          ]);
          if (bestRes.data && bestRes.data.data) {
            setBestsellers(
              bestRes.data.data
                .filter((p: any) => p.id !== idToUse)
                .slice(0, 4)
                .map(productService.mapBackendProductToFrontend)
            );
          }
          if (mostRes.data && mostRes.data.data) {
            setMostReviewed(
              mostRes.data.data
                .filter((p: any) => p.id !== idToUse)
                .slice(0, 4)
                .map(productService.mapBackendProductToFrontend)
            );
          }
        } else {
          if (product || routerProduct) setFetchedProduct((product || routerProduct) as Product);
        }
      } catch (err: any) {
        console.error('Failed to fetch product details:', err);
        if (product || routerProduct) {
          setFetchedProduct((product || routerProduct) as Product);
          setError(null);
        } else {
          setError('Unable to load product details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (idToUse) {
      loadProduct();
      fetchReviews();
    } else {
      setIsLoading(false);
      if (product || routerProduct) {
        setFetchedProduct((product || routerProduct) as Product);
      } else {
        setError('Product not found');
      }
    }
  }, [idToUse]);

  const displayProduct = fetchedProduct || product || routerProduct;

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    if (!displayProduct) return;
    try {
      await addToCart(displayProduct, quantity);
    } catch (err: any) {
      toast.error('Unable to add to cart. Please try again.');
    }
  };

  const handleAddToWishlist = () => {
    if (!displayProduct) return;
    toggleWishlist(displayProduct);
  };

  const isAlreadyInWishlist = displayProduct ? isInWishlist(displayProduct.id) : false;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToUse) return;

    setIsSubmittingReview(true);
    try {
      const res = await reviewService.createReview(idToUse, {
        rating: newReviewRating,
        title: newReviewTitle.trim() || undefined,
        description: newReviewDescription.trim(),
      });
      if (res.data) {
        toast.success('Your review has been submitted successfully!');
        setNewReviewRating(5);
        setNewReviewTitle('');
        setNewReviewDescription('');
        
        // Reload reviews list
        fetchReviews();
        
        // Refresh product details
        const response = await productService.getProductById(idToUse);
        if (response.data) {
          setFetchedProduct(productService.mapBackendProductToFrontend(response.data));
        }
      }
    } catch (err: any) {
      console.error('Review submit error', err);
      toast.error(err.data?.message || err.message || 'Failed to submit review. You might have already reviewed this product.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-g1">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
        <p className="font-bold">Loading product details...</p>
      </div>
    );
  }

  if (error || !displayProduct) {
    return (
      <div className="py-24 text-center border border-dashed border-border-design rounded-2xl bg-white flex flex-col items-center justify-center max-w-[1200px] mx-auto mt-10">
        <i className="fa-solid fa-triangle-exclamation text-red-400 text-[48px] mb-4"></i>
        <h3 className="font-extrabold text-[18px] text-g3 mb-1">Product Not Found</h3>
        <p className="text-muted text-[13.5px] max-w-[280px]">The requested product does not exist.</p>
        <button onClick={() => handleNavigate('listing')} className="mt-6 bg-g1 text-white py-2 px-6 rounded-lg font-bold">Back to Shop</button>
      </div>
    );
  }

  const displayPrice = displayProduct.price;

  return (
    <div className="animate-fade-in flex flex-col w-full text-left py-10 px-4 md:px-12 w-full">
      <div className="max-w-[1400px] w-full mx-auto">


      {/* Main product layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
        {/* Gallery Image Panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] overflow-hidden aspect-square border border-border-design bg-off relative shadow-sm">
            <img
              src={displayProduct.images?.[activeImageIndex] || displayProduct.img}
              alt={displayProduct.name}
              className="w-full h-full object-cover"
            />
            {displayProduct.badge && (
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${displayProduct.badgeClass === 'badge-org' ? 'bg-[#EAFDF1] text-g1 border border-g1/10' :
                displayProduct.badgeClass === 'badge-hot' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                {displayProduct.badge}
              </span>
            )}
          </div>

          {/* Thumbnails grid */}
          <div className="grid grid-cols-4 gap-3">
            {(() => {
              const images = displayProduct.images || [displayProduct.img];
              return images.map((imgUrl, index) => (
                <div
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`rounded-xl overflow-hidden aspect-square border cursor-pointer hover:border-g1 transition ${index === activeImageIndex ? 'border-g1' : 'border-border-design'
                    }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${index}`} className={`w-full h-full object-cover transition ${index === activeImageIndex ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} />
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Product Details Panel */}
        <div className="flex flex-col text-left">
          <h1 className="text-[28px] md:text-[34px] font-black text-g3 leading-tight mb-2">
            {displayProduct.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6 text-[13px] text-muted select-none">
            <div className="flex text-amber-500 gap-0.5 text-[12px]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <i key={idx} className={`${idx < displayProduct.stars ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
              ))}
            </div>
            <span className="font-semibold text-txt">({reviews.length} Customer Reviews)</span>
          </div>

          {/* Pricing Info */}
          <div className="bg-off rounded-2xl border border-border-design p-5 mb-6 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-[32px] font-black text-g1 leading-none">{displayPrice}</span>
              {displayProduct.old && <span className="text-[16px] text-muted line-through font-semibold">{displayProduct.old}</span>}
            </div>
          </div>

          <p className="text-[14.5px] text-muted leading-relaxed mb-6">
            Sourced responsibly with 100% transparency. This {displayProduct.cat === 'food' ? 'organic grocery' : displayProduct.cat === 'cosmetics' ? 'natural beauty supply' : 'eco building material'} is highly durable and supports zero-harm ecological sourcing standards.
          </p>

          {/* Specs Table List */}
          <div className="border border-border-design rounded-xl p-4 bg-white text-[13px] mb-8 space-y-4">
            <div className="flex items-center justify-between text-[13px] border-b border-border-design pb-3">
              <span className="text-muted font-semibold">Availability</span>
              <span className={`font-black ${displayProduct.stockStatus?.includes('Stock') && !displayProduct.stockStatus?.includes('Out') ? 'text-g1' : 'text-amber-600'}`}>
                {displayProduct.stockStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted font-semibold">Delivery</span>
              <span className="font-bold text-txt flex items-center gap-2">
                <i className="fa-solid fa-truck-fast text-g1"></i> {displayProduct.delivery}
              </span>
            </div>
            <div className="flex pt-3 border-t border-border-design justify-between">
              <span className="font-semibold text-muted">Category</span>
              <span className="font-medium text-txt uppercase">{displayProduct.cat}</span>
            </div>
          </div>

          {/* Qty Picker & Action Button */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center bg-off border border-border-design rounded-xl h-12 px-2 select-none">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg bg-transparent border-none text-[16px] font-bold text-txt hover:bg-white cursor-pointer active:scale-95 transition"
              >
                -
              </button>
              <span className="w-10 text-center font-black text-[15px]">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 rounded-lg bg-transparent border-none text-[16px] font-bold text-txt hover:bg-white cursor-pointer active:scale-95 transition"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-g1 hover:bg-g3 text-white border-none rounded-xl h-12 px-8 text-[15px] font-bold cursor-pointer flex items-center gap-2 shadow-[0_6px_16px_rgba(0,143,68,0.2)] hover:-translate-y-0.5 transition"
            >
              <i className="fa-solid fa-cart-plus"></i> Add to Cart
            </button>

            <button
              onClick={handleAddToWishlist}
              className={`border-2 rounded-xl h-12 w-12 flex items-center justify-center cursor-pointer transition ${isAlreadyInWishlist
                ? 'border-g1 text-g1 bg-[#EAFDF1]'
                : 'border-border-design text-txt hover:border-g1 hover:text-g1'
                }`}
            >
              <i className={`${isAlreadyInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart text-[18px]`}></i>
            </button>
          </div>

          {quantity >= 10 && (
            <div className="mt-6 p-4 rounded-xl bg-purple-50/70 border border-purple-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0">
                  <i className="fa-solid fa-boxes-packing"></i>
                </div>
                <div>
                  <h4 className="font-bold text-[14.5px] text-purple-900 mb-0.5">Interested in Wholesale Pricing?</h4>
                  <p className="text-[13px] text-purple-700 leading-relaxed">You have selected a bulk quantity (10+). Submit a wholesale request to access discounted corporate rates.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWholesaleModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[13px] whitespace-nowrap cursor-pointer transition-all border-none"
              >
                Apply for Wholesale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs description reviews specifications */}
      <div className="flex flex-col border border-border-design rounded-[20px] overflow-hidden bg-white shadow-sm">
        {/* Tab triggers */}
        <div className="flex border-b border-border-design bg-off select-none">
          {[
            { id: 'details', label: 'Detailed Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'reviews', label: `Reviews (${reviews.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-[14px] font-bold cursor-pointer border-b-2 bg-transparent border-none transition ${activeTab === tab.id
                ? 'text-g1 border-b-g1'
                : 'text-muted border-transparent hover:text-txt'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="p-7 text-[14.5px] leading-relaxed text-muted">
          {activeTab === 'details' && (
            <div className="flex flex-col gap-4 text-left">
              <p>
                Our premium {displayProduct.name} is selected for its high quality, zero-waste processing, and local sourcing standards. Perfect for eco-conscious customers seeking natural and organic solutions.
              </p>
              <p>
                We inspect every batch to verify that no synthetic dyes, fillers, pesticides, or toxic additives are used. This product is ethically packaged in recycled, low-carbon boxes to help decrease landfill waste.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13.5px] text-left">
              <div className="flex py-2.5 border-b border-border-design justify-between">
                <span className="font-semibold text-muted">Origin</span>
                <span className="font-bold text-txt">Cameron Highlands / Johor, Malaysia</span>
              </div>
              <div className="flex py-2.5 border-b border-border-design justify-between">
                <span className="font-semibold text-muted">Eco Rating</span>
                <span className="font-bold text-txt">Grade A Eco Certified</span>
              </div>
              <div className="flex py-2.5 border-b border-border-design justify-between">
                <span className="font-semibold text-muted">Packaging</span>
                <span className="font-bold text-txt">100% Recyclable/Biodegradable</span>
              </div>
              <div className="flex py-2.5 border-b border-border-design justify-between">
                <span className="font-semibold text-muted">Testing</span>
                <span className="font-bold text-txt">100% Cruelty-Free & Natural</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-6 text-left">
              {reviewsLoading ? (
                <div className="py-6 flex items-center gap-2 text-g1 font-semibold text-[13.5px]">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-[13.5px] italic text-muted">No reviews yet. Be the first to review this product!</p>
              ) : (
                reviews.map((review) => {
                  const reviewerName = review.user 
                    ? `${review.user.first_name} ${review.user.last_name}` 
                    : 'Anonymous User';
                  const reviewDate = new Date(review.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  return (
                    <div key={review.id} className="border-b border-border-design pb-5 last:border-none last:pb-0">
                      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <span className="font-bold text-txt">{reviewerName}</span>
                        <span className="text-[12px] text-muted">{reviewDate}</span>
                      </div>
                      <div className="flex text-amber-500 gap-0.5 text-[10px] mb-2.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={`${i < review.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                        ))}
                      </div>
                      {review.title && <h4 className="font-bold text-txt text-[14px] mb-1">{review.title}</h4>}
                      <p className="text-[13.5px] text-muted italic">"{review.description}"</p>
                    </div>
                  );
                })
              )}

              {/* Add review form overlay */}
              {isAuthenticated ? (
                <div className="mt-8 border-t border-border-design pt-6">
                  <h3 className="text-[18px] font-extrabold text-g3 mb-4">Write a Customer Review</h3>
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 max-w-[600px]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-extrabold text-gray-900">Your Rating</label>
                      <div className="flex gap-1.5 text-2xl text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="bg-transparent border-none cursor-pointer p-0 hover:scale-110 transition active:scale-95 text-amber-500"
                          >
                            <i className={`${star <= newReviewRating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-extrabold text-gray-900">Review Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="Summarize your experience..."
                        value={newReviewTitle}
                        onChange={(e) => setNewReviewTitle(e.target.value)}
                        className="border border-border-design rounded-xl px-4 py-3 text-[14.5px] outline-none focus:border-g1 text-gray-900 font-medium bg-white placeholder:text-gray-400 w-full transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-extrabold text-gray-900">Review Comments</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us what you liked or disliked about this product..."
                        value={newReviewDescription}
                        onChange={(e) => setNewReviewDescription(e.target.value)}
                        className="border border-border-design rounded-xl px-4 py-3 text-[14.5px] outline-none focus:border-g1 text-gray-900 font-medium bg-white placeholder:text-gray-400 w-full transition-colors resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="bg-g1 hover:bg-g3 text-white border-none rounded-xl h-11 px-6 text-[14px] font-extrabold cursor-pointer flex items-center justify-center gap-2 max-w-[200px] shadow-sm disabled:opacity-60 transition"
                    >
                      {isSubmittingReview ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-8 border-t border-border-design pt-6 text-center bg-off p-6 rounded-2xl border border-dashed border-border-design">
                  <p className="text-[14px] font-bold text-gray-800 mb-3">Please sign in to write a product review.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="bg-g1 hover:bg-g3 text-white border-none rounded-xl px-6 py-2.5 text-[13.5px] font-extrabold cursor-pointer transition shadow-sm"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Grouped Recommendations Container */}
      {(relatedProducts.length > 0 || bestsellers.length > 0 || mostReviewed.length > 0) && (
        <div className="pd-related mt-12 w-full flex flex-col gap-12">
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h3 className="text-[24px] font-black text-g3 uppercase tracking-tight mb-6">Related Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} onProductClick={(p) => {
                    if (onNavigate) {
                      onNavigate('product-details');
                    } else {
                      navigate(`/shop/product/${p.id}`);
                    }
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Bestseller Recommendations */}
          {bestsellers.length > 0 && (
            <div>
              <h3 className="text-[24px] font-black text-g3 uppercase tracking-tight mb-6">Bestsellers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bestsellers.map(p => (
                  <ProductCard key={p.id} product={p} onProductClick={(p) => {
                    if (onNavigate) {
                      onNavigate('product-details');
                    } else {
                      navigate(`/shop/product/${p.id}`);
                    }
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Most Reviewed Recommendations */}
          {mostReviewed.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[24px] font-black text-g3 uppercase tracking-tight mb-6">Most Reviewed</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mostReviewed.map(p => (
                  <ProductCard key={p.id} product={p} onProductClick={(p) => {
                    if (onNavigate) {
                      onNavigate('product-details');
                    } else {
                      navigate(`/shop/product/${p.id}`);
                    }
                  }} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {showWholesaleModal && (
        <WholesaleApplicationModal onClose={() => setShowWholesaleModal(false)} />
      )}
    </div>
  );
};


export default ProductDetailsView;
