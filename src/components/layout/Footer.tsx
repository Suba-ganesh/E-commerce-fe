import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Brand */}
        <div className="footer-brand">
          <div className="logo-area" style={{ marginBottom: '24px' }}>
            <img 
              src="/images/Chenni's Logo.svg" 
              alt="Chenni's Logo" 
              style={{ 
                height: '90px', 
                width: '180px', 
                display: 'block', 
                // filter: 'brightness(0) invert(1)',
              }} 
            />
          </div>
          <p>Malaysia's trusted nature-inspired e-commerce platform for organic food, natural cosmetics, and sustainable
            construction materials.</p>
          <div className="social-links">
            <div className="soc-btn">f</div>
            <div className="soc-btn">in</div>
            <div className="soc-btn">𝕏</div>
            <div className="soc-btn"><i className="fa-solid fa-play"></i></div>
            <div className="soc-btn"><i className="fa-solid fa-camera"></i></div>
          </div>
        </div>
        {/* Food */}
        <div className="footer-col">
          <h5>Food Products</h5>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Organic Oils</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Herbal Teas</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Raw Honey</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Spices & Seasonings</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Dried Fruits & Nuts</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Superfoods</a></li>
          </ul>
        </div>
        {/* Cosmetics */}
        <div className="footer-col">
          <h5>Cosmetics</h5>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Skincare</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Hair Care</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Body Oils</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Face Serums</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Natural Soaps</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Aromatherapy</a></li>
          </ul>
        </div>
        {/* Quick Links */}
        <div className="footer-col">
          <h5>Quick Links</h5>
          <ul>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>
                About Chenni's
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/portal/dashboard'); }}>
                Wholesale Programme
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>
                Blog & Recipes
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/portal/orders'); }}>
                Track My Order
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>
                Returns Policy
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>
                FAQ
              </a>
            </li>
          </ul>
        </div>
        {/* Contact */}
        <div className="footer-col">
          <h5>Contact Us</h5>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 7.13 7.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>+60 12-345 6789</span>
          </div>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>hello@chennais.com.my</span>
          </div>
          <div className="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Kuala Lumpur, Malaysia</span>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', marginBottom: '8px' }}>We Accept</div>
            <div className="payment-icons">
              <span className="pay-icon">FPX</span>
              <span className="pay-icon">VISA</span>
              <span className="pay-icon">MC</span>
              <span className="pay-icon">TNG</span>
              <span className="pay-icon">Grab</span>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2025 Chenni's Sdn Bhd. All rights reserved. Proudly Malaysian <i className="fa-solid fa-flag text-red-600"></i></span>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Cookie Policy</a>
          <a href="#">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
