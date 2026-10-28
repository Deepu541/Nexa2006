import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'np' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    search: 'Search',
    cart: 'Cart',
    profile: 'Profile',
    categories: 'Categories',
    flash_sale: 'Flash Sale',
    trending: 'Trending',
    recommended: 'Recommended',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    login: 'Login',
    logout: 'Logout',
    vendor_panel: 'Vendor Panel',
    admin_panel: 'Admin Panel',
    delivery_hub: "Digital Shipping Hub",
    logistics_layer: "Global Logistics Layer v5.1",
    select_country: "Select Country",
    full_name: "Recipient Name",
    phone_number: "Contact Terminal",
    whatsapp_number: "WhatsApp Terminal",
    province: "Province",
    state: "State",
    district: "District",
    municipality: "Municipality",
    city: "City",
    ward: "Ward / Sector",
    postal_code: "Postal Code",
    pin_code: "PIN Code",
    tole: "Street / Tole / Area",
    landmark: "Landmark Proximity",
    save_address: "Synchronize Address",
    update_address: "Update Terminal Data",
    my_addresses: "Saved Destinations",
    add_new_address: "Deploy New Hub",
    order_summary: "Order Summary",
    payment_method: "Payment Sequence",
    place_order: "Execute Order",
    nepal: "Nepal",
    india: "India",
  },
  np: {
    home: 'होम',
    search: 'खोज्नुहोस्',
    cart: 'कार्ट',
    profile: 'प्रोफाइल',
    categories: 'कोटिहरू',
    flash_sale: 'फ्ल्यास सेल',
    trending: 'ट्रेन्डिङ',
    recommended: 'सिफारिस गरिएको',
    add_to_cart: 'कार्टमा थप्नुहोस्',
    buy_now: 'अहिले किन्नुहोस्',
    login: 'लगइन',
    logout: 'लगआउट',
    vendor_panel: 'विक्रेता प्यानल',
    admin_panel: 'व्यवस्थापक प्यानल',
    delivery_hub: "डिजिटल ढुवानी केन्द्र",
    logistics_layer: "ग्लोबल लजिस्टिक लेयर v5.1",
    select_country: "देश चयन गर्नुहोस्",
    full_name: "प्राप्तकर्ताको नाम",
    phone_number: "सम्पर्क नम्बर",
    whatsapp_number: "व्हाट्सएप नम्बर",
    province: "प्रदेश",
    state: "राज्य",
    district: "जिल्ला",
    municipality: "नगरपालिका / गाउँपालिका",
    city: "शहर",
    ward: "वडा नम्बर",
    postal_code: "हुलाक कोड",
    pin_code: "पिन कोड",
    tole: "टोल / सडक / क्षेत्र",
    landmark: "नजिकाे चिनारी",
    save_address: "ठेगाना सुरक्षित गर्नुहोस्",
    update_address: "ठेगाना अपडेट गर्नुहोस्",
    my_addresses: "सुरक्षित ठेगानाहरू",
    add_new_address: "नयाँ ठेगाना थप्नुहोस्",
    order_summary: "अर्डर सारांश",
    payment_method: "भुक्तानी विधि",
    place_order: "अर्डर गर्नुहोस्",
    nepal: "नेपाल",
    india: "भारत",
  },
  hi: {
    home: 'होम',
    search: 'खोजें',
    cart: 'कार्ट',
    profile: 'प्रोफ़ाइल',
    categories: 'श्रेणियां',
    flash_sale: 'फ्लैश सेल',
    trending: 'ट्रेंडिंग',
    recommended: 'अनुशंसित',
    add_to_cart: 'कार्ट में जोड़ें',
    buy_now: 'अभी खरीदें',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    vendor_panel: 'विक्रेता पैनल',
    admin_panel: 'एडमिन पैनल',
    delivery_hub: 'डिजिटल शिपिंग हब',
    logistics_layer: 'ग्लोबल लॉजिस्टिक्स लेयर v5.1',
    select_country: 'देश चुनें',
    full_name: 'प्राप्तकर्ता का नाम',
    phone_number: 'सम्पर्क नम्बर',
    whatsapp_number: 'व्हाट्सएप नम्बर',
    province: 'प्रांत / प्रदेश',
    state: 'राज्य',
    district: 'ज़िला',
    municipality: 'नगरपालिका',
    city: 'शहर / नगर',
    ward: 'वार्ड नम्बर',
    postal_code: 'पोस्टल कोड',
    pin_code: 'पिन कोड',
    tole: 'मोहल्ला / गली / क्षेत्र',
    landmark: 'निकटतम स्थान',
    save_address: 'ठेगाना सुरक्षित करें',
    update_address: 'ठेगाना अपडेट करें',
    my_addresses: 'सहेजे गए ठेगाने',
    add_new_address: 'नया ठेगाना जोड़ें',
    order_summary: 'ऑर्डर विवरण',
    payment_method: 'भुगतान विधि',
    place_order: 'ऑर्डर करें',
    nepal: 'नेपाल',
    india: 'भारत',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nexamart_user_lang');
    return (saved === 'en' || saved === 'np' || saved === 'hi') ? (saved as Language) : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexamart_user_lang', lang);
  };

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
