// Mock Products Data from chennis_design.html


export const categoryDetails = {
  food: { title: "Food & Grocery", desc: "Premium organic food, spices, and natural produce.", img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&q=80&fit=crop", color: "var(--g1)" },
  cosmetics: { title: "Cosmetics & Beauty", desc: "Plant-based skincare and zero-cruelty beauty essentials.", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80&fit=crop", color: "#E91E63" },
  construction: { title: "Eco Construction", desc: "Sustainable timber, eco-cement, and green building supplies.", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80&fit=crop", color: "#E05F00" }
};

// Initialize Mock LocalStorage Database
export function initMockDb() {
  if (typeof window === 'undefined') return;

  // Initialize Users
  let users = localStorage.getItem('Users');
  if (!users) {
    const defaultUsers = [
      { 
        id: 'admin1', 
        name: "Chenni's Administrator", 
        email: 'admin@chennis.com', 
        password: 'admin123',
        role: 'admin', 
        status: 'active',
        createdAt: new Date().toISOString() 
      },
      {
        id: 'customer1',
        name: 'Rithish Kumar',
        email: 'rithish.1234@gmail.com',
        password: 'Rithish2005',
        role: 'customer',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('Users', JSON.stringify(defaultUsers));
  }

  // Set default empty arrays for keys if they don't exist
  if (!localStorage.getItem('Cart')) localStorage.setItem('Cart', JSON.stringify([]));
  if (!localStorage.getItem('Wishlist')) localStorage.setItem('Wishlist', JSON.stringify([]));
  if (!localStorage.getItem('UserCarts')) localStorage.setItem('UserCarts', JSON.stringify([]));
  if (!localStorage.getItem('UserWishlists')) localStorage.setItem('UserWishlists', JSON.stringify([]));
  
  // Set default mock orders to make dashboard look populated
  if (!localStorage.getItem('Orders')) {
    const defaultOrders = [
      {
        id: 'ORD-5890',
        userId: 'customer1',
        items: [
          { name: "Cameron Highlands Organic Cherry Tomatoes 500g", price: "RM 9.50", qty: 2, img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=85&fit=crop" },
          { name: "Wild Tualang Honey Premium Grade 250g", price: "RM 45.00", qty: 1, img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=85&fit=crop" }
        ],
        total: "RM 64.00",
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        shippingAddress: { name: 'Rithish Kumar', address: 'No 15, Jalan Gasing', city: 'Petaling Jaya', state: 'Selangor', zip: '46000' }
      }
    ];
    localStorage.setItem('Orders', JSON.stringify(defaultOrders));
  }
}
