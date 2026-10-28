export const getGoogleMapsKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
              import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
         (typeof process !== 'undefined' ? (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY) : '');
  return typeof key === 'string' ? key.trim() : '';
};

export const isGoogleMapsKeyValid = () => {
  const key = getGoogleMapsKey();
  if (!key) return false;
  
  const invalidPatterns = [
    'YOUR_API_KEY',
    'PUT_YOUR',
    'GOOGLE_MAPS_PLATFORM_KEY',
    'INSERT_KEY',
    'API_KEY_HERE',
    'DEFAULT_KEY'
  ];
  
  return key.length > 20 && !invalidPatterns.some(p => key.includes(p));
};
