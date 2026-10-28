import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Address } from '../../types';
import { CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import { NEPAL_LOCATIONS, INDIA_LOCATIONS } from '../../constants/locations';

interface GlobalAddressFormProps {
  onSave: (address: Address) => void;
  initialData?: Address;
}

export default function GlobalAddressForm({ onSave, initialData }: GlobalAddressFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<Address>>(initialData || {
    country: 'Nepal',
    fullName: '',
    phone: '',
    whatsapp: '',
    state: '',
    district: '',
    city: '',
    ward: '',
    pinCode: '',
    streetAddress: '',
    houseNumber: '',
    landmark: '',
    deliveryInstructions: '',
    isDefault: true
  });

  const [addressLabel] = useState<'Home' | 'Office' | 'Other'>(initialData?.label || 'Home');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect country based on Timezone & IP lookup
  useEffect(() => {
    if (initialData?.country) return;

    // Phase 1: Local timezone detection (instant, flawless fallback)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let detectedCountry: 'Nepal' | 'India' = 'Nepal';
    if (tz && (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Kolkata'))) {
      detectedCountry = 'India';
    } else if (tz && (tz.includes('Katmandu') || tz.includes('Kathmandu') || tz.includes('Asia/Kathmandu'))) {
      detectedCountry = 'Nepal';
    }

    setFormData(prev => ({ ...prev, country: detectedCountry }));

    // Phase 2: Live IP Geolocation (if online and permitted)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'IN' || data.country_name === 'India') {
          setFormData(prev => ({ ...prev, country: 'India' }));
        } else if (data.country_code === 'NP' || data.country_name === 'Nepal') {
          setFormData(prev => ({ ...prev, country: 'Nepal' }));
        }
      })
      .catch(() => {
        // Safe check failed, stick with phase 1 timezone check
      });
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
    
    const phoneVal = formData.phone || '';
    if (!phoneVal.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phoneVal.replace(/\D/g, '').length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!formData.state) newErrors.state = formData.country === 'India' ? "State is required" : "Province is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.city) newErrors.city = formData.country === 'India' ? "City is required" : "Municipality is required";
    if (!formData.streetAddress?.trim()) newErrors.streetAddress = "Street address is required";

    if (formData.country === 'India') {
      const pin = formData.pinCode || '';
      if (!pin.trim()) {
        newErrors.pinCode = "PIN Code is required";
      } else if (!/^\d{6}$/.test(pin)) {
        newErrors.pinCode = "PIN Code must be exactly 6 digits";
      }
    } else {
      if (!formData.ward?.trim()) {
        newErrors.ward = "Ward number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalAddress: Address = {
      id: initialData?.id || Date.now().toString(),
      fullName: formData.fullName || '',
      phone: formData.phone || '',
      whatsapp: formData.whatsapp || '',
      country: formData.country as 'Nepal' | 'India',
      state: formData.state || '',
      district: formData.district || '',
      city: formData.city || '',
      municipality: formData.country === 'Nepal' ? (formData.city || '') : '',
      ward: formData.country === 'Nepal' ? (formData.ward || '') : '',
      pinCode: formData.country === 'India' ? (formData.pinCode || '') : '',
      streetAddress: formData.streetAddress || '',
      houseNumber: formData.houseNumber || '',
      area: formData.area || formData.district || '',
      label: addressLabel,
      landmark: formData.landmark || '',
      deliveryInstructions: formData.deliveryInstructions || '',
      isDefault: formData.isDefault || false
    };
    onSave(finalAddress);
  };

  // Setup options
  const isIndia = formData.country === 'India';

  // State options
  const nepalProvinces = NEPAL_LOCATIONS.provinces.map(p => p.name);
  const indiaStates = [
    ...INDIA_LOCATIONS.states.map(s => s.name),
    ...INDIA_LOCATIONS.unionTerritories.map(ut => ut.name)
  ];
  const statesList = isIndia ? indiaStates : nepalProvinces;

  // District options
  let districtsList: string[] = [];
  if (isIndia) {
    const selectedStateObj = INDIA_LOCATIONS.states.find(s => s.name === formData.state) 
      || INDIA_LOCATIONS.unionTerritories.find(ut => ut.name === formData.state);
    districtsList = selectedStateObj ? selectedStateObj.districts : [];
  } else {
    const selectedProvinceObj = NEPAL_LOCATIONS.provinces.find(p => p.name === formData.state);
    districtsList = selectedProvinceObj ? selectedProvinceObj.districts : [];
  }

  // City options
  let citiesList: string[] = [];
  if (isIndia) {
    const selectedStateObj = INDIA_LOCATIONS.states.find(s => s.name === formData.state)
      || INDIA_LOCATIONS.unionTerritories.find(ut => ut.name === formData.state);
    citiesList = selectedStateObj ? (selectedStateObj as any).cities || [] : [];
  } else {
    citiesList = formData.district ? ((NEPAL_LOCATIONS.municipalities as any)[formData.district] || []) : [];
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in duration-500 max-w-2xl mx-auto pb-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm shadow-gray-100/30 space-y-6 text-left">
        {/* Header with dynamic flag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <MapPin size={22} className="text-orange-600 stroke-[2.5]" />
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              {isIndia ? 'India Delivery Details' : 'Nepal Delivery Details'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  country: 'Nepal',
                  state: '',
                  district: '',
                  city: '',
                  pinCode: '',
                  ward: ''
                }));
                setErrors({});
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                !isIndia
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
              }`}
            >
              🇳🇵 Nepal
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  country: 'India',
                  state: '',
                  district: '',
                  city: '',
                  pinCode: '',
                  ward: ''
                }));
                setErrors({});
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                isIndia
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
              }`}
            >
              🇮🇳 India
            </button>
          </div>
        </div>

        {/* Validation Errors Header */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-50 text-red-650 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100">
            <AlertTriangle size={15} />
            <span>Please fix: {Object.values(errors).join(', ')}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Full Name</label>
              <input 
                required
                type="text"
                placeholder=""
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
                Contact Phone ({isIndia ? '+91' : '+977'})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-sm font-semibold text-gray-500">
                  {isIndia ? '+91' : '+977'}
                </span>
                <input 
                  required
                  type="tel"
                  placeholder=""
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\s+/g, '') })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-14 pr-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Optional */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">WhatsApp Number (Optional)</label>
            <input 
              type="tel"
              placeholder=""
              value={formData.whatsapp || ''}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
            />
          </div>

          {/* State / Province Selection */}
          <div className="space-y-1.5 font-sans">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
              {isIndia ? 'State / UT' : 'Province'}
            </label>
            <input
              required
              type="text"
              list="states-province-list"
              placeholder=""
              value={formData.state || ''}
              onChange={e => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  state: val,
                  district: '',
                  city: ''
                }));
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
            />
            <datalist id="states-province-list">
              {statesList.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* District & City/Municipality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 font-sans">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">District</label>
              <input
                required
                type="text"
                list="district-list"
                placeholder=""
                value={formData.district || ''}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    district: val,
                    city: ''
                  }));
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
              <datalist id="district-list">
                {districtsList.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 font-sans">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
                {isIndia ? 'City' : 'Muni / Rural Muni'}
              </label>
              <input
                required
                type="text"
                list="city-muni-list"
                placeholder=""
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
              <datalist id="city-muni-list">
                {citiesList.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Ward / sector for Nepal OR PIN Code for India */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isIndia ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">PIN Code (6 Digits)</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder=""
                  value={formData.pinCode || ''}
                  onChange={e => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Ward Number</label>
                <input
                  required
                  type="text"
                  placeholder=""
                  value={formData.ward || ''}
                  onChange={e => setFormData({ ...formData, ward: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Street Address / Tole</label>
              <input
                required
                type="text"
                placeholder=""
                value={formData.streetAddress || ''}
                onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* House Name & Landmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">Nearby Landmark (Optional)</label>
              <input
                type="text"
                placeholder=""
                value={formData.landmark || ''}
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">House / Flat / Shop Number (Opt)</label>
              <input
                type="text"
                placeholder=""
                value={formData.houseNumber || ''}
                onChange={e => setFormData({ ...formData, houseNumber: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-700 text-sm cursor-pointer uppercase tracking-wider"
          >
            <CheckCircle2 size={18} className="text-white" />
            Save Address
          </button>
        </div>
      </div>
    </form>
  );
}
