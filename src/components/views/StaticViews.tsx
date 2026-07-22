import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import { orderService } from '../../services/orderService';
import { campaignService } from '../../services/campaignService';
import { useToast } from '../../context/ToastContext';

export const OrderSuccessView: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      orderService.getOrderById(orderId)
        .then(res => {
          setOrder(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return <div className="py-20 text-center text-muted font-bold text-lg animate-fade-in">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center px-4 max-w-[600px] mx-auto w-full text-left animate-fade-in">
        <h2 className="font-extrabold text-[22px] text-g3 mb-4">No order details found</h2>
        <button onClick={() => navigate('/')} className="bg-g1 hover:bg-g3 transition-colors text-white border-none py-2.5 px-6 rounded-xl font-bold cursor-pointer">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center px-4 max-w-[600px] mx-auto w-full text-left">
      <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mb-6 text-g1 shadow-sm">
        <i className="fa-solid fa-circle-check text-[38px]"></i>
      </div>

      <span className="text-[12px] font-black text-g2 tracking-widest uppercase block mb-1">SUCCESSFUL PURCHASE</span>
      <h1 className="text-[30px] font-black text-g3 leading-none mb-3">Order Confirmed!</h1>
      <p className="text-muted text-[14px] leading-relaxed mb-8 max-w-[440px] text-center">
        Thank you for purchasing. Your order <strong>{order.id}</strong> has been logged in our dispatch queue and is currently processing.
      </p>

      {/* Order card details */}
      <div className="border border-border-design rounded-2xl bg-white w-full shadow-sm p-6 text-left flex flex-col gap-4 mb-8 text-[13.5px]">
        <div className="flex justify-between border-b border-border-design pb-2.5">
          <span className="font-bold text-muted">Order Code</span>
          <span className="font-black text-g3">{order.id}</span>
        </div>
        <div className="flex justify-between border-b border-border-design pb-2.5">
          <span className="font-bold text-muted">Purchase Date</span>
          <span className="font-medium text-txt">{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between border-b border-border-design pb-2.5">
          <span className="font-bold text-muted">Grand Total Paid</span>
          <span className="font-extrabold text-g1">RM {parseFloat(order.total_amount || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b border-border-design pb-2.5">
          <span className="font-bold text-muted">Shipping Client</span>
          <span className="font-bold text-txt">{order.shippingAddress?.full_name || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-muted">Shipping Destination</span>
          <span className="font-medium text-txt">
            {order.shippingAddress?.address_line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.postal_code}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="bg-g1 hover:bg-g3 text-white border-none rounded-xl py-3.5 px-8 text-[15px] font-bold cursor-pointer transition shadow-[0_6px_16px_rgba(0,143,68,0.2)]"
      >
        Continue Shopping
      </button>
    </div>
  );
};


export const AboutView: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

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

  // Counters State
  const [stats, setStats] = useState({ customers: 0, products: 0, sellers: 0, quality: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setStats({
        customers: Math.floor(progress * 10000),
        products: Math.floor(progress * 500),
        sellers: Math.floor(progress * 100),
        quality: Math.floor(progress * 100)
      });

      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full text-left bg-white font-sans overflow-hidden">
      {/* About Hero */}
      <div className="cat-banner" style={{ background: '#000', padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)' }}></div>
        <img 
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&q=80&fit=crop"
          style={{ opacity: 0.9, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} 
          alt="Chennis Premium Marketplace" 
        />
        <div className="cat-banner-content" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 className="text-[36px] md:text-[54px] font-black text-white mb-5 leading-none">About Chenni's</h1>
          <p className="text-[15px] md:text-[18px] lg:text-[20px] leading-[1.7] text-white/90">
            We are Malaysia's leading nature-inspired ecosystem. Our mission is to bridge the gap between conscious consumers and ethical producers across premium food, natural cosmetics, and sustainable building materials.
          </p>
        </div>
      </div>

      {/* Our Story (Two Column) */}
      <div className="max-w-[1200px] mx-auto py-16 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6 text-left">
          <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-g2">
            <span className="w-2 h-2 rounded-full bg-g2"></span> Our Story
          </div>
          <h2 className="text-[28px] md:text-[36px] font-black text-g3 leading-tight">Connecting You with<br/>Nature's Best</h2>
          <p className="text-[15px] text-muted leading-[1.7] -mt-2">
            What started as a simple desire to find trusted, organic products has grown into a comprehensive marketplace connecting thousands of Malaysians with ethical suppliers.
          </p>
          <p className="text-[15px] text-muted leading-[1.7]">
            Whether you are sourcing raw organic honey, plant-based skincare, or sustainable bamboo panels for a home renovation, Chenni's carefully vets every seller to ensure uncompromised quality and sustainability.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[500px] aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fit=crop" alt="Our Story" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="py-10 px-6 md:px-12 text-center" style={{ background: 'linear-gradient(135deg, var(--g3), #003D2B)', color: '#fff' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-1">
            <div className="text-[28px] md:text-[38px] font-black text-white leading-none">{stats.customers.toLocaleString()}+</div>
            <div className="text-[12px] md:text-[13px] font-bold text-white/70 uppercase tracking-wider">Happy Customers</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[28px] md:text-[38px] font-black text-white leading-none">{stats.products.toLocaleString()}+</div>
            <div className="text-[12px] md:text-[13px] font-bold text-white/70 uppercase tracking-wider">Curated Products</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[28px] md:text-[38px] font-black text-white leading-none">{stats.sellers.toLocaleString()}+</div>
            <div className="text-[12px] md:text-[13px] font-bold text-white/70 uppercase tracking-wider">Trusted Sellers</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[28px] md:text-[38px] font-black text-white leading-none">{stats.quality}%</div>
            <div className="text-[12px] md:text-[13px] font-bold text-white/70 uppercase tracking-wider">Quality Assured</div>
          </div>
        </div>
      </div>

      {/* Core Categories */}
      <div className="bg-[#FAFBF7] py-16 px-6 md:px-12 border-y border-border-design">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="text-[12px] font-extrabold uppercase tracking-widest text-g2 mb-2 block">Three Core Pillars</span>
            <h2 className="text-[28px] md:text-[36px] font-black text-g3">Our Marketplace <span className="text-g2">Ecosystem</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Food */}
            <div onClick={() => navigate('/shop')} className="group relative rounded-[20px] overflow-hidden h-[360px] cursor-pointer shadow-sm">
              <img src="https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=80&fit=crop" alt="Food" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-white z-20 text-left flex flex-col gap-2">
                <span className="self-start bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Food & Grocery</span>
                <h3 className="text-[22px] font-black leading-tight">Organic & Fresh</h3>
                <p className="text-[13.5px] text-white/80 leading-relaxed font-medium">Sourced directly from local organic farms to ensure the highest nutritional value.</p>
              </div>
            </div>
            {/* Cosmetics */}
            <div onClick={() => navigate('/shop')} className="group relative rounded-[20px] overflow-hidden h-[360px] cursor-pointer shadow-sm">
              <img src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80&fit=crop" alt="Cosmetics" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-white z-20 text-left flex flex-col gap-2">
                <span className="self-start bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Cosmetics & Beauty</span>
                <h3 className="text-[22px] font-black leading-tight">Natural Wellness</h3>
                <p className="text-[13.5px] text-white/80 leading-relaxed font-medium">Plant-based skincare and zero-cruelty beauty essentials for a radiant glow.</p>
              </div>
            </div>
            {/* Construction */}
            <div onClick={() => navigate('/shop')} className="group relative rounded-[20px] overflow-hidden h-[360px] cursor-pointer shadow-sm">
              <img src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&fit=crop" alt="Construction" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-white z-20 text-left flex flex-col gap-2">
                <span className="self-start bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Construction</span>
                <h3 className="text-[22px] font-black leading-tight">Sustainable Build</h3>
                <p className="text-[13.5px] text-white/80 leading-relaxed font-medium">Eco-friendly timber, green cement, and natural paints for sustainable homes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision Split */}
      <div className="max-w-[1200px] mx-auto py-16 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center order-last lg:order-first">
          <div className="relative rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[500px] aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80&fit=crop" alt="Our Mission" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col gap-6 text-left">
          <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-g2">
            <span className="w-2 h-2 rounded-full bg-g2"></span> Our Mission
          </div>
          <h2 className="text-[28px] md:text-[36px] font-black text-g3 leading-tight">Empowering a<br/>Sustainable Future</h2>
          <p className="text-[15px] text-muted leading-[1.7] -mt-2">
            We believe that every purchase is a vote for the kind of world you want to live in. By supporting local producers and prioritizing eco-friendly materials, we empower our customers to make impactful choices.
          </p>
          <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
            <li className="flex items-center gap-3 font-bold text-[14.5px] text-txt">
              <div className="w-6 h-6 rounded-full bg-g1 text-white flex items-center justify-center text-[11px]"><i className="fa-solid fa-check"></i></div>
              Promote sustainable living
            </li>
            <li className="flex items-center gap-3 font-bold text-[14.5px] text-txt">
              <div className="w-6 h-6 rounded-full bg-g1 text-white flex items-center justify-center text-[11px]"><i className="fa-solid fa-check"></i></div>
              Support independent local producers
            </li>
            <li className="flex items-center gap-3 font-bold text-[14.5px] text-txt">
              <div className="w-6 h-6 rounded-full bg-g1 text-white flex items-center justify-center text-[11px]"><i className="fa-solid fa-check"></i></div>
              Provide uncompromising quality
            </li>
          </ul>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 px-6 md:px-12 border-t border-border-design">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-[28px] md:text-[36px] font-black text-g3 mb-12">Why Choose <span className="text-g1">Chenni's</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-border-design rounded-[20px] p-6 text-left hover:shadow-[0_8px_24px_rgba(0,143,68,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center text-xl text-g1 mb-4">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h4 className="text-[18px] font-bold text-g3 mb-2">Quality Assured</h4>
              <p className="text-[13.5px] text-muted leading-relaxed">Every product is strictly vetted for organic certification and material sustainability.</p>
            </div>
            <div className="bg-white border border-border-design rounded-[20px] p-6 text-left hover:shadow-[0_8px_24px_rgba(0,143,68,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-xl text-[#F39C12] mb-4">
                <i className="fa-solid fa-users"></i>
              </div>
              <h4 className="text-[18px] font-bold text-g3 mb-2">Trusted Sellers</h4>
              <p className="text-[13.5px] text-muted leading-relaxed">We partner exclusively with verified independent Malaysian producers and artisans.</p>
            </div>
            <div className="bg-white border border-border-design rounded-[20px] p-6 text-left hover:shadow-[0_8px_24px_rgba(0,143,68,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[#EBF5FF] flex items-center justify-center text-xl text-[#3498DB] mb-4">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <h4 className="text-[18px] font-bold text-g3 mb-2">Fast Delivery</h4>
              <p className="text-[13.5px] text-muted leading-relaxed">Optimized logistics ensure your fresh food and delicate materials arrive safely and quickly.</p>
            </div>
            <div className="bg-white border border-border-design rounded-[20px] p-6 text-left hover:shadow-[0_8px_24px_rgba(0,143,68,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[#F5EEF8] flex items-center justify-center text-xl text-pu mb-4">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h4 className="text-[18px] font-bold text-g3 mb-2">Secure Payments</h4>
              <p className="text-[13.5px] text-muted leading-relaxed">256-bit encrypted transactions for absolute peace of mind during checkout.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0A7A3E] via-[#0D8A47] to-[#119A50] text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23ffffff\'/%3E%3C/svg%3E')" }}></div>
        <div className="relative z-10 max-w-[800px] mx-auto flex flex-col items-center">
          <h2 className="text-[28px] md:text-[38px] font-black text-white mb-4">Ready to Experience the Best of Nature?</h2>
          <p className="text-[15px] md:text-[16px] text-white/90 leading-relaxed mb-8 max-w-[600px]">
            Join thousands of conscious consumers shopping for the finest natural products Malaysia has to offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/shop')} className="px-8 py-3.5 bg-white text-g1 font-bold rounded-xl border-none shadow-md hover:bg-off transition-all cursor-pointer text-[15px]">Shop Now</button>
            <button onClick={() => navigate('/shop')} className="px-8 py-3.5 bg-transparent text-white border-2 border-white font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer text-[15px]">Explore Categories</button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter animate-fade-in" style={{ marginTop: '40px' }}>
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


export const BlogView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const articles = [
    { title: "Sourcing Organic Cameron Tomatoes", category: "food", displayCat: "Food", date: "June 24, 2026", readTime: "5 min read", desc: "A guide detailing Cameron Highlands organic growers and their ecological crop rotations. Learn how the high altitudes affect the harvest.", img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80" },
    { title: "Plant-Based Skincare Hydration", category: "cosmetics", displayCat: "Cosmetics", date: "May 18, 2026", readTime: "4 min read", desc: "Understanding the benefits of Rose Hip Oil and Aloe Vera moisture barriers for sensitive skin across all environments.", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80" },
    { title: "Sustainable Bamboo Flooring Guides", category: "construction", displayCat: "Construction", date: "April 11, 2026", readTime: "7 min read", desc: "Comparing the carbon capture capacity and durability of bamboo versus traditional hardwood materials in modern homes.", img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80" },
    { title: "Benefits of Organic Foods", category: "food", displayCat: "Food", date: "Oct 10, 2026", readTime: "6 min read", desc: "Why switching to chemical-free produce can dramatically improve your long-term health and vitality.", img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80" },
    { title: "Healthy Grocery Guide", category: "food", displayCat: "Food", date: "Oct 08, 2026", readTime: "5 min read", desc: "Navigate the supermarket aisles like a pro. Learn how to read labels and spot hidden sugars.", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" },
    { title: "Zero-Waste Kitchen", category: "wellness", displayCat: "Wellness", date: "Oct 05, 2026", readTime: "4 min read", desc: "Simple, actionable steps to eliminate food waste and switch to reusable containers.", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80" },
    { title: "Superfood Salad Bowls", category: "food", displayCat: "Food", date: "Oct 02, 2026", readTime: "3 min read", desc: "Create the perfect nutrient-packed lunch using locally sourced greens and ancient grains.", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80" },
    { title: "Creating Green Workspaces", category: "wellness", displayCat: "Wellness", date: "Sep 25, 2026", readTime: "5 min read", desc: "Transform your home office with purifying plants and natural lighting setups.", img: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80" },
    { title: "Morning Mindfulness", category: "wellness", displayCat: "Wellness", date: "Sep 20, 2026", readTime: "6 min read", desc: "Start your day grounded. A 10-minute routine combining stretching and breathwork.", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80" }
  ];

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category === selectedCategory);

  const renderArticleCard = (art: typeof articles[0], idx: number) => (
    <div key={idx} className="premium-card flex flex-col bg-white overflow-hidden h-full" style={{ borderRadius: '18px', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid var(--border)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}>
      <div className="relative overflow-hidden" style={{ height: '240px', flexShrink: 0 }}>
        <span className="absolute top-4 left-4 px-3 py-1 rounded text-[11px] font-extrabold uppercase tracking-wide z-10 bg-[#EAFDF1] text-g1 shadow-sm">
          {art.displayCat}
        </span>
        <img src={art.img} alt={art.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
      </div>
      <div className="flex flex-col flex-grow" style={{ padding: '28px' }}>
        <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500 }}>{art.date} &middot; {art.readTime}</div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--g3)', marginBottom: '12px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{art.title}</h3>
        <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {art.desc}
        </p>
        <button className="btn-secondary" style={{ width: 'max-content', padding: '10px 20px', fontSize: '16px', borderRadius: '12px', fontWeight: 600, transition: 'all 0.3s ease', marginTop: 'auto' }}>Read Article &rarr;</button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in w-full text-left bg-transparent">

      {/* 1. HERO SECTION */}
      <section className="relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ height: '380px' }}>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <img src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=2000&q=80&fit=crop" alt="Blog Hero" className="absolute inset-0 w-full h-full object-cover animate-fade-in" />

        <div className="relative z-20 w-full flex flex-col items-center justify-center" style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto', height: '100%' }}>
          <div className="text-center flex flex-col items-center" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'inline-block', marginBottom: '24px', background: 'var(--g1)', color: 'white', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              The Journal
            </div>
            <style>{`
              .blog-hero-h1 { font-size: 54px; }
              @media (max-width: 1024px) { .blog-hero-h1 { font-size: 42px; } }
              @media (max-width: 768px) { .blog-hero-h1 { font-size: 36px; } }
            `}</style>
            <h1 className="blog-hero-h1" style={{ fontWeight: 800, color: 'white', marginBottom: '24px', lineHeight: 1.2 }}>
              Premium Insights for a Natural Lifestyle
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', lineHeight: 1.6 }}>
              Discover actionable tips, inspiring stories, and expert advice on healthy living, natural beauty, and sustainable construction practices.
            </p>
          </div>
        </div>
      </section>

      {/* 2. FEATURED ARTICLE (Hero -> Featured: 72px margin-top) */}
      <section style={{ marginTop: '72px' }}>
        <div style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto' }}>
          <div className="flex flex-col lg:flex-row bg-white overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.04)] items-stretch" style={{ borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '340px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.04)'; }}>
            <div className="w-full lg:w-[48%] relative">
              <span className="absolute top-6 left-6 px-4 py-1.5 rounded text-[12px] font-extrabold uppercase tracking-wide z-10 bg-[#EAFDF1] text-g1 shadow-sm">
                Featured Insight
              </span>
              <img src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80&fit=crop" alt="Featured Article" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="w-full lg:w-[52%] flex flex-col justify-center items-start" style={{ padding: '36px' }}>
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px', fontWeight: 500 }}>Oct 12, 2026 &middot; 5 min read</div>
              <h2 style={{ fontSize: '38px', fontWeight: 800, color: 'var(--g3)', lineHeight: 1.2, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>The Future of Sustainable Living: Homes that Breathe</h2>
              <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                Explore how modern eco-friendly materials and passive cooling techniques are revolutionizing the way we construct homes in tropical climates. By combining traditional wisdom with cutting-edge technology, architects are creating living spaces that actively interact with their environment while reducing overall carbon footprints.
              </p>
              <div>
                <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '16px', borderRadius: '12px', fontWeight: 600, transition: 'all 0.3s ease', width: 'max-content' }}>Continue Reading &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY FILTER (Featured -> Categories: 48px margin-top) */}
      <section style={{ marginTop: '48px' }}>
        <div style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['all', 'food', 'cosmetics', 'construction', 'wellness'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={
                  selectedCategory === cat
                    ? { background: 'var(--g1)', border: '1px solid var(--g1)', color: '#fff', borderRadius: '30px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0, 143, 68, 0.2)' }
                    : { background: '#fff', border: '1px solid var(--border)', color: 'var(--g2)', borderRadius: '30px', padding: '12px 24px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s' }
                }
                onMouseEnter={(e) => { if (selectedCategory !== cat) { e.currentTarget.style.borderColor = 'var(--g2)'; e.currentTarget.style.background = 'var(--off)'; } }}
                onMouseLeave={(e) => { if (selectedCategory !== cat) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; } }}
              >
                {cat === 'all' ? 'All' : cat === 'food' ? 'Food' : cat === 'cosmetics' ? 'Cosmetics' : cat === 'construction' ? 'Construction' : 'Wellness'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LATEST ARTICLES (Categories -> Latest: 64px margin-top) */}
      <section style={{ marginTop: '64px' }}>
        <div style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--g3)', marginBottom: '8px' }}>Latest Articles</h2>
            <p style={{ fontSize: '16px', color: 'var(--muted)' }}>Fresh stories from the Chenni's ecosystem.</p>
          </div>
          <style>{`
            .blog-grid { display: grid; gap: 32px; grid-template-columns: repeat(3, 1fr); align-items: stretch; }
            @media (max-width: 1024px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 768px) { .blog-grid { grid-template-columns: 1fr; } }
          `}</style>
          <div className="blog-grid">
            {filteredArticles.slice(0, 6).map((art, idx) => renderArticleCard(art, idx))}
          </div>
        </div>
      </section>

      {/* 5. POPULAR READS (Latest -> Editor's Picks: 96px padding-top, and 96px padding-bottom) */}
      <section style={{ paddingTop: '96px', paddingBottom: '96px', background: '#F7FCF8', marginTop: '96px' }}>
        <div style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--g3)', marginBottom: '8px' }}>Editor's Picks</h2>
            <p style={{ fontSize: '16px', color: 'var(--muted)' }}>Curated selections you won't want to miss.</p>
          </div>
          <div className="blog-grid">
            {articles.slice(2, 6).map((art, idx) => renderArticleCard(art, idx))}
          </div>
        </div>
      </section>

      {/* 6. NEWSLETTER & FOOTER TRANSITION (Editor's Picks -> Newsletter is handled by Editor's Picks bottom padding and margin below, but wait: Editor's -> Newsletter 96px, Newsletter -> Footer 80px) */}
      <section style={{ background: 'linear-gradient(to bottom, #ffffff, #F7FCF8)', paddingTop: '96px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1320px', padding: '0 32px', margin: '0 auto' }}>
          <div className="newsletter text-center rounded-[32px]" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,132,74,.1)', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', color: 'var(--g1)', fontWeight: 700, marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Stay In The Loop
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', color: 'var(--g3)' }}>Get 10% Off Your First Order</h2>
            <p style={{ fontSize: '16px', color: 'var(--muted)', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
              Subscribe to our newsletter for exclusive deals, new arrivals, health tips, and nature-living inspiration delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center" style={{ marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              <input placeholder="Enter your email address..." className="w-full sm:flex-1 bg-white" style={{ padding: '14px 20px', fontSize: '16px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none' }} />
              <button className="btn-primary w-full sm:w-auto justify-center" style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '12px', whiteSpace: 'nowrap' }}>Subscribe &rarr;</button>
            </div>
            <p className="nl-note" style={{ fontSize: '14px', color: 'var(--muted)' }}>No spam, ever. Unsubscribe anytime. By subscribing you agree to our Privacy Policy.</p>
          </div>
        </div>
      </section>

    </div>
  );
};
