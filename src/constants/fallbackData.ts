import { Product, Category, Banner, Vendor, Rider, Order, Coupon, UserProfile, WithdrawalRequest, SiteSettings } from '../types';

export const fallbackCategories: Category[] = [
  {
    categoryId: 'cat-electronics',
    name: 'Electronics',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60',
    order: 1,
    description: 'Smartphones, laptops, accessories & gadgets'
  },
  {
    categoryId: 'cat-fashion',
    name: 'Fashion & Apparel',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60',
    order: 2,
    description: 'Men, women and kids clothing & footwear'
  },
  {
    categoryId: 'cat-groceries',
    name: 'Groceries & Essentials',
    icon: 'ShoppingBag',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
    order: 3,
    description: 'Daily fresh produce, organic teas and kitchen staples'
  },
  {
    categoryId: 'cat-home',
    name: 'Home & Kitchen',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60',
    order: 4,
    description: 'Appliances, cookware and home decor'
  },
  {
    categoryId: 'cat-beauty',
    name: 'Beauty & Personal Care',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60',
    order: 5,
    description: 'Skincare, herbal remedies and fragrances'
  }
];

export const fallbackBanners: Banner[] = [
  {
    bannerId: 'banner-dashain',
    title: 'NexaMart Grand Festive Sale - Up to 40% Off',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    active: true,
    order: 1,
    mediaType: 'image',
    link: '/category/cat-electronics'
  },
  {
    bannerId: 'banner-tech',
    title: 'Latest Premium Tech Gadgets in Nepal',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    active: true,
    order: 2,
    mediaType: 'image',
    link: '/category/cat-electronics'
  },
  {
    bannerId: 'banner-organic',
    title: '100% Pure Himalayan Organic Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80',
    active: true,
    order: 3,
    mediaType: 'image',
    link: '/category/cat-groceries'
  }
];

export const fallbackVendors: Vendor[] = [
  {
    vendorId: 'vendor-ktm-tech',
    businessName: 'Kathmandu Tech Hub',
    description: 'Authorized seller of premium electronics and smartphones in Nepal.',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=60',
    status: 'approved',
    rating: 4.8,
    totalSales: 184,
    totalRevenue: 2845000,
    walletBalance: 450000,
    createdAt: '2026-01-15T00:00:00.000Z',
    country: 'Nepal',
    kyc: {
      citizenshipFront: '',
      citizenshipBack: '',
      panVatDoc: '',
      panNumber: 'PAN602938192',
      address: 'New Road, Kathmandu',
      phone: '+977 9801234567',
      verified: true
    }
  },
  {
    vendorId: 'vendor-himalayan-org',
    businessName: 'Himalayan Organic Teas & Herbs',
    description: 'High altitude Ilam organic teas and handpicked spices.',
    logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=60',
    status: 'approved',
    rating: 4.9,
    totalSales: 312,
    totalRevenue: 642000,
    walletBalance: 128000,
    createdAt: '2026-02-01T00:00:00.000Z',
    country: 'Nepal',
    kyc: {
      citizenshipFront: '',
      citizenshipBack: '',
      panVatDoc: '',
      panNumber: 'PAN701928374',
      address: 'Ilam / Thamel, Kathmandu',
      phone: '+977 9812345678',
      verified: true
    }
  },
  {
    vendorId: 'vendor-nepal-threads',
    businessName: 'Everest Apparel & Threads',
    description: 'Premium woolen wear, down jackets, and modern Himalayan fashion.',
    logo: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=200&auto=format&fit=crop&q=60',
    status: 'approved',
    rating: 4.7,
    totalSales: 142,
    totalRevenue: 980000,
    walletBalance: 215000,
    createdAt: '2026-02-10T00:00:00.000Z',
    country: 'Nepal',
    kyc: {
      citizenshipFront: '',
      citizenshipBack: '',
      panVatDoc: '',
      panNumber: 'PAN918273645',
      address: 'Lalitpur, Nepal',
      phone: '+977 9823456789',
      verified: true
    }
  }
];

export const fallbackProducts: Product[] = [
  {
    productId: 'prod-anc-headphones',
    name: 'Wireless Active Noise Cancelling Headphones',
    description: 'Premium Hi-Res audio with 40-hour battery life and spatial acoustics. Perfect for travel, work, and gaming.',
    categoryId: 'cat-electronics',
    vendorId: 'vendor-ktm-tech',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
    ],
    price: 8500,
    discountPrice: 6999,
    stock: 25,
    sku: 'ANC-HP-01',
    variations: [
      { id: 'v1', name: 'Color', options: ['Matte Black', 'Silver Grey'] }
    ],
    specifications: [
      { key: 'Connectivity', value: 'Bluetooth 5.3 + 3.5mm Aux' },
      { key: 'Battery Life', value: 'Up to 40 Hours' },
      { key: 'Warranty', value: '1 Year Local Warranty' }
    ],
    rating: 4.8,
    totalReviews: 46,
    featured: true,
    trending: true,
    status: 'approved',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    productId: 'prod-smartwatch-ultra',
    name: 'Amoled Fitness Smartwatch Pro',
    description: 'Ultra-bright 1.43 inch AMOLED display, dual-band GPS, SpO2 monitoring and 7-day battery.',
    categoryId: 'cat-electronics',
    vendorId: 'vendor-ktm-tech',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80'
    ],
    price: 6500,
    discountPrice: 4999,
    stock: 40,
    sku: 'SW-ULTRA-02',
    variations: [
      { id: 'v1', name: 'Strap', options: ['Black Silicone', 'Orange Trail Loop'] }
    ],
    specifications: [
      { key: 'Display', value: '1.43" AMOLED 60Hz' },
      { key: 'Water Resistance', value: '5 ATM (50m)' }
    ],
    rating: 4.7,
    totalReviews: 38,
    featured: true,
    trending: true,
    status: 'approved',
    createdAt: '2026-03-02T00:00:00.000Z'
  },
  {
    productId: 'prod-ilam-tea',
    name: 'Artisanal First Flush Ilam Tea (100g Handpicked)',
    description: 'Single-estate certified organic tea leaves from the high ridges of Ilam, eastern Nepal.',
    categoryId: 'cat-groceries',
    vendorId: 'vendor-himalayan-org',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80'
    ],
    price: 1200,
    discountPrice: 950,
    stock: 100,
    sku: 'ILAM-TEA-FF',
    variations: [],
    specifications: [
      { key: 'Origin', value: 'Ilam, Nepal' },
      { key: 'Weight', value: '100g' }
    ],
    rating: 4.9,
    totalReviews: 82,
    featured: true,
    trending: false,
    status: 'approved',
    createdAt: '2026-03-03T00:00:00.000Z'
  },
  {
    productId: 'prod-down-jacket',
    name: 'Himalayan Expedition Ultralight Down Jacket',
    description: '800 fill-power goose down insulation with water-repellent ripstop shell. Rated down to -15°C.',
    categoryId: 'cat-fashion',
    vendorId: 'vendor-nepal-threads',
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
    ],
    price: 14500,
    discountPrice: 11999,
    stock: 18,
    sku: 'EXP-DOWN-03',
    variations: [
      { id: 'v1', name: 'Size', options: ['M', 'L', 'XL'] },
      { id: 'v2', name: 'Color', options: ['Navy Blue', 'Forest Green'] }
    ],
    specifications: [
      { key: 'Insulation', value: '800 Fill Power Down' },
      { key: 'Shell', value: '100% Recycled Ripstop Nylon' }
    ],
    rating: 4.9,
    totalReviews: 29,
    featured: true,
    trending: true,
    status: 'approved',
    createdAt: '2026-03-04T00:00:00.000Z'
  },
  {
    productId: 'prod-pour-over-kettle',
    name: 'Precision Gooseneck Pour-Over Coffee Kettle',
    description: 'Ergonomic stainless steel gooseneck kettle with built-in thermometer for artisanal pour-over brewing.',
    categoryId: 'cat-home',
    vendorId: 'vendor-himalayan-org',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
    ],
    price: 3400,
    discountPrice: 2800,
    stock: 30,
    sku: 'KETTLE-GOOSE-01',
    variations: [],
    specifications: [
      { key: 'Capacity', value: '1000ml' },
      { key: 'Material', value: '304 Food Grade Stainless Steel' }
    ],
    rating: 4.6,
    totalReviews: 19,
    featured: false,
    trending: false,
    status: 'approved',
    createdAt: '2026-03-05T00:00:00.000Z'
  },
  {
    productId: 'prod-herbal-oil',
    name: 'Pure Himalayan Herbal Rejuvenating Face Elixir',
    description: 'Cold-pressed wild sea buckthorn and rosehip seed facial oil rich in omegas 3, 6, 7 and 9.',
    categoryId: 'cat-beauty',
    vendorId: 'vendor-himalayan-org',
    images: [
      'https://images.unsplash.com/photo-1608248597359-0091ff6063eb?w=800&auto=format&fit=crop&q=80'
    ],
    price: 2100,
    discountPrice: 1750,
    stock: 55,
    sku: 'HERBAL-OIL-01',
    variations: [],
    specifications: [
      { key: 'Volume', value: '30ml' },
      { key: 'Type', value: '100% Organic Cold-Pressed' }
    ],
    rating: 4.8,
    totalReviews: 31,
    featured: false,
    trending: true,
    status: 'approved',
    createdAt: '2026-03-06T00:00:00.000Z'
  }
];

export const fallbackRiders: Rider[] = [
  {
    riderId: 'rider-default',
    userId: 'rider-default-uid',
    vehicleType: 'Motorcycle (Bajaj Pulsar 150)',
    vehiclePlate: 'BA 82 PA 4192',
    licenseNumber: '01-09-00829102',
    status: 'approved',
    isAvailable: true,
    rating: 4.9,
    totalDeliveries: 148,
    activeOrdersCount: 1,
    phone: '+977 9841000001',
    email: 'rider@nexamart.com',
    riderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    riderId: 'rider-02',
    userId: 'rider-02-uid',
    vehicleType: 'Electric Scooter (NIU MQi+)',
    vehiclePlate: 'BA 95 PA 8821',
    licenseNumber: '01-09-00912831',
    status: 'approved',
    isAvailable: true,
    rating: 4.8,
    totalDeliveries: 96,
    activeOrdersCount: 0,
    phone: '+977 9841000002',
    email: 'delivery@nexamart.com',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const fallbackOrders: Order[] = [
  {
    orderId: 'ORD-2026-001',
    customerId: 'cust-demo-1',
    customerFullName: 'Dipak Jaiswal',
    customerPhone: '+977 9801234567',
    vendorIds: ['vendor-ktm-tech'],
    items: [
      {
        productId: 'prod-anc-headphones',
        name: 'Wireless Active Noise Cancelling Headphones',
        price: 6999,
        quantity: 1,
        vendorId: 'vendor-ktm-tech',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
      }
    ],
    totalAmount: 7099,
    deliveryFee: 100,
    handlingFee: 0,
    country: 'Nepal',
    status: 'processing',
    riderId: 'rider-default-uid',
    deliveryStatus: 'accepted',
    shippingAddress: {
      id: 'addr-1',
      fullName: 'Dipak Jaiswal',
      phone: '+977 9801234567',
      country: 'Nepal',
      state: 'Bagmati Province',
      district: 'Kathmandu',
      city: 'Kathmandu',
      streetAddress: 'New Baneshwor, Ward 10',
      isDefault: true
    },
    paymentMethod: 'esewa',
    paymentStatus: 'paid',
    createdAt: '2026-09-05T14:30:00.000Z',
    updatedAt: '2026-09-05T15:00:00.000Z'
  },
  {
    orderId: 'ORD-2026-002',
    customerId: 'cust-demo-2',
    customerFullName: 'Aayush Shrestha',
    customerPhone: '+977 9841234567',
    vendorIds: ['vendor-himalayan-org'],
    items: [
      {
        productId: 'prod-ilam-tea',
        name: 'Artisanal First Flush Ilam Tea (100g Handpicked)',
        price: 950,
        quantity: 2,
        vendorId: 'vendor-himalayan-org',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80'
      }
    ],
    totalAmount: 2000,
    deliveryFee: 100,
    handlingFee: 0,
    country: 'Nepal',
    status: 'delivered',
    riderId: 'rider-default-uid',
    deliveryStatus: 'delivered',
    shippingAddress: {
      id: 'addr-2',
      fullName: 'Aayush Shrestha',
      phone: '+977 9841234567',
      country: 'Nepal',
      state: 'Bagmati Province',
      district: 'Lalitpur',
      city: 'Patan',
      streetAddress: 'Jhamsikhel Rd, Ward 3',
      isDefault: true
    },
    paymentMethod: 'fonepay',
    paymentStatus: 'paid',
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T16:30:00.000Z'
  }
];

export const fallbackCoupons: Coupon[] = [
  {
    couponId: 'coup-dashain',
    code: 'DASHAIN2026',
    type: 'percentage',
    value: 15,
    minSpend: 2000,
    status: 'active',
    vendorId: 'all',
    usageLimit: 500,
    usedCount: 84,
    startDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2026-11-30',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    couponId: 'coup-welcome',
    code: 'WELCOME50',
    type: 'fixed',
    value: 200,
    minSpend: 1000,
    status: 'active',
    vendorId: 'all',
    usageLimit: 1000,
    usedCount: 192,
    startDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2026-12-31',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const fallbackUsers: UserProfile[] = [
  {
    userId: 'admin-default-uid',
    fullName: 'NexaMart Admin',
    email: 'admin@nexamart.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    userId: 'rider-default-uid',
    fullName: 'NexaMart Rider Staff',
    email: 'rider@nexamart.com',
    role: 'rider',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const fallbackWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wdr-001',
    vendorId: 'vendor-ktm-tech',
    amount: 150000,
    method: 'bank',
    accountDetails: 'Nabil Bank Ltd - A/C 01928374618291',
    status: 'completed',
    createdAt: '2026-09-01T10:00:00.000Z'
  }
];
