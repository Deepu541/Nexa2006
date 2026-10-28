import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any): string {
  if (!date) return 'Processing...';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function compressImage(base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => reject(error);
  });
}

/**
 * Calculates the Haversine distance between two points in km.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return Math.round(d * 10) / 10;
}

export function formatAuthError(err: any): string {
  if (!err) return "Strategic authentication failure.";
  
  const msg = typeof err === 'string' ? err : (err.message || "");
  const code = (typeof err === 'object' && err !== null ? err.code : "") || (msg.match(/\((auth\/[a-z0-9-]+)\)/)?.[1]) || "";

  if (code.includes('invalid-credential') || msg.includes('invalid-credential')) {
    return "Access denied. Invalid credentials provided.";
  }
  if (code.includes('user-not-found') || msg.includes('user-not-found')) {
    return "Identity record not found. Please register.";
  }
  if (code.includes('wrong-password') || msg.includes('wrong-password')) {
    return "Incorrect verification key. Please try again.";
  }
  if (code.includes('email-already-in-use') || msg.includes('email-already-in-use')) {
    return "This identity is already active in our mainframe.";
  }
  if (code.includes('weak-password') || msg.includes('weak-password')) {
    return "Security constraint failure. Password is too simple.";
  }
  if (code.includes('too-many-requests') || msg.includes('too-many-requests')) {
    return "System congestion. Please try again shortly.";
  }
  if (code.includes('network-request-failed') || msg.includes('network-request-failed')) {
    return "Network connectivity failure. Check your connection.";
  }
  if (code.includes('requires-recent-login') || msg.includes('requires-recent-login')) {
    return "Session expired. Detailed re-authentication required.";
  }

  // Clean up the firebase error message if it falls through
  return msg.replace(/Firebase: Error\s?/g, '').replace(/\(auth\/[a-z0-9-]+\)\.?/g, '').trim() || "Mainframe synchronization error.";
}

/**
 * Recursively removes all keys with 'undefined' values from an object or array.
 * This is crucial for Firestore writes, as Firestore does not accept 'undefined' fields.
 */
export function scrubUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => scrubUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = scrubUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Resolves absolute API URL when running inside native Android packages (where there is no local Express server),
 * and uses standard relative paths when running in the web browser.
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://ais-dev-nyemsvzv66mfskcm6ltluv-891562925218.asia-southeast1.run.app';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Check if running on Android/WebView (Capacitor mode)
  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);
  const isCapacitor = typeof window !== 'undefined' && ((window as any).Capacitor || isAndroid || window.location.protocol === 'capacitor:' || window.location.protocol === 'file:');

  if (isCapacitor) {
    return `${baseUrl}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

