export type UserRole = 'customer' | 'vendor' | 'admin' | 'rider' | 'super_admin';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  addresses?: Address[];
  wishlist?: string[];
  status: 'active' | 'blocked';
  country?: 'Nepal' | 'India';
  createdAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  country: 'Nepal' | 'India';
  state: string; // Province for Nepal, State for India
  district: string;
  city: string; // Municipality for Nepal, City for India
  municipality?: string; 
  ward?: string;
  pinCode?: string;
  streetAddress: string;
  houseNumber?: string;
  area?: string;
  label?: 'Home' | 'Office' | 'Other';
  landmark?: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface Vendor {
  vendorId: string;
  businessName: string;
  description: string;
  logo?: string;
  banner?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  totalSales: number;
  totalRevenue: number;
  walletBalance: number;
  khaltiQrCode?: string;
  esewaQrCode?: string;
  createdAt: string;
  country?: string;
  kyc: {
    citizenshipFront: string;
    citizenshipBack: string;
    panVatDoc: string;
    panNumber: string;
    address: string;
    phone: string;
    verified: boolean;
  };
}

export interface ProductVariation {
  id: string;
  name: string; // e.g., "Color"
  options: string[]; // e.g., ["Red", "Blue"]
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  categoryId: string;
  subCategoryId?: string;
  vendorId: string;
  images: string[];
  videoUrl?: string;
  price: number;
  discountPrice?: number;
  flashSalePrice?: number;
  flashSaleEnd?: string;
  stock: number;
  sku: string;
  variations: ProductVariation[];
  specifications: ProductSpec[];
  rating: number;
  totalReviews: number;
  featured: boolean;
  trending: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  vendorId: string;
  amount: number;
  method: 'bank' | 'khalti' | 'esewa';
  accountDetails: string;
  status: 'pending' | 'completed' | 'rejected';
  paymentProof?: string;
  createdAt: string;
}

export interface SiteSettings {
  id: 'main';
  privacyPolicy: string;
  termsAndConditions: string;
  aboutUs: string;
  khaltiQrCode?: string;
  esewaQrCode?: string;
  fonePayQrCode?: string;
  upiId?: string;
  paymentQrCodeIndia?: string;
  phonePeQrCode?: string;
  gPayQrCode?: string;
  paytmQrCode?: string;
  upiQrCode?: string;
  paymentSettings?: {
    fonepayQR?: string;
    esewaQR?: string;
    khaltiQR?: string;
    phonepeQR?: string;
    gpayQR?: string;
    paytmQR?: string;
    upiQR?: string;
    esewaEnabled?: boolean;
    khaltiEnabled?: boolean;
    fonepayEnabled?: boolean;
    phonepeEnabled?: boolean;
    gpayEnabled?: boolean;
    paytmEnabled?: boolean;
    upiEnabled?: boolean;
  };
  deliveryFee: number;
  minOrderForFreeDelivery?: number;
  countrySettings: {
    [key in 'Nepal' | 'India']?: {
      enabled: boolean;
      baseDeliveryFee: number;
      freeDeliveryThreshold: number;
      handlingFee: number;
      paymentMethods: string[];
      estimatedDays?: string;
    }
  };
  locationWiseFees?: {
    [country: string]: {
      [state: string]: {
        [district: string]: number;
      }
    }
  };
  faqs: { question: string; answer: string }[];
  supportWhatsapp?: string;
  aiSupportEnabled: boolean;
  aiSupportInstruction: string;
}

export interface AISupportSession {
  sessionId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  messages: {
    role: 'user' | 'ai' | 'admin';
    content: string;
    timestamp: string;
  }[];
  status: 'active' | 'resolved' | 'escalated';
  lastMessageAt: string;
  createdAt: string;
}

export interface AIImageMetadata {
  category: string;
  suggestedName: string;
  tags: string[];
  colors: string[];
  description: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Category {
  categoryId: string;
  name: string;
  icon: string;
  image?: string;
  parentId?: string;
  banner?: string;
  order?: number;
  description?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  image: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  vendorIds: string[];
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  handlingFee: number;
  country: 'Nepal' | 'India';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  riderId?: string;
  deliveryStatus?: 'assigned' | 'accepted' | 'picked' | 'out_for_delivery' | 'delivered' | 'cancelled';
  assignedAt?: string;
  acceptedAt?: string;
  pickedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancellationProof?: string; // Image proof for cancellation
  deliveryProof?: string; // Image proof for delivery
  deliveryPhotos?: string[]; // Multiple image proofs for delivery
  signatureProof?: string; // Customer signature for delivery
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  customerFullName?: string;
  customerPhone?: string;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'rejected' | 'pending' | 'verification_pending' | 'awaiting_proof' | 'refund_requested' | 'refunded';
  paymentTransactionId?: string;
  paymentSenderMobile?: string;
  paymentDetails?: any;
  paymentProof?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  reviewId: string;
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerImage?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface Banner {
  bannerId: string;
  title: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  order?: number;
}

export interface Rider {
  riderId: string;
  userId: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  activeOrdersCount: number;
  phone?: string;
  email?: string;
  riderPhoto?: string;
  licensePhoto?: string;
  idCardPhoto?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  walletBalance?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  createdAt: string;
}

export interface Coupon {
  couponId: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount?: number;
  vendorId: string; // 'global' for admin coupons
  status: 'active' | 'expired' | 'disabled';
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  createdAt: string;
}

export interface AppAd {
  adId: string;
  title: string;
  imageUrl: string;
  videoUrl?: string; // Optional URL or base64 data for video ads
  mediaType?: 'image' | 'video'; // 'image' or 'video'
  link: string;
  location: 'banner' | 'popup' | 'offer' | 'fullscreen_video';
  duration?: number; // Skip timer/view duration in seconds (e.g. 5, 10, 15)
  startDate: string;
  endDate: string;
  active: boolean;
  views: number;
  clicks: number;
  createdAt: string;
}

