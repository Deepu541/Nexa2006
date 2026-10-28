import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loginAsMockUser: (email: string, role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const isMocked = localStorage.getItem('user_mock_auth') === 'true';
    if (isMocked) {
      try {
        const cached = localStorage.getItem('user_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            uid: parsed.userId,
            email: parsed.email,
            displayName: parsed.fullName,
            emailVerified: true
          } as any as User;
        }
      } catch (e) {}
    }
    return auth.currentUser;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('user_profile_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        localStorage.removeItem('user_profile_cache');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const isMocked = localStorage.getItem('user_mock_auth') === 'true';
    if (isMocked) return false;
    return !auth.currentUser || !profile;
  });

  const loginAsMockUser = (email: string, role: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const mockUid = `mock-${role}-${Date.now()}`;
    const mockProfile: UserProfile = {
      userId: mockUid,
      email: normalizedEmail,
      fullName: normalizedEmail.split('@')[0].toUpperCase(),
      role: role as any,
      status: 'active',
      wishlist: [],
      addresses: [],
      createdAt: new Date().toISOString()
    };
    
    const mockUser = {
      uid: mockUid,
      email: normalizedEmail,
      displayName: normalizedEmail.split('@')[0].toUpperCase(),
      emailVerified: true,
    } as any as User;

    setUser(mockUser);
    setProfile(mockProfile);
    localStorage.setItem('user_profile_cache', JSON.stringify(mockProfile));
    localStorage.setItem('user_mock_auth', 'true');
    setLoading(false);
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // If we are currently mocked, ignore any sign out trigger from real firebase initialization
      const isMocked = localStorage.getItem('user_mock_auth') === 'true';
      if (isMocked) {
        setLoading(false);
        return;
      }

      setUser(authUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (!authUser) {
        setProfile(null);
        localStorage.removeItem('user_profile_cache');
        setLoading(false);
        return;
      }

      // Check cache again for specific user
      const cached = localStorage.getItem('user_profile_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.userId === authUser.uid) {
            setProfile(parsed);
            setLoading(false); // Immediate transition if cache hits
          }
        } catch (e) {}
      }

      const docRef = doc(db, 'users', authUser.uid);
      
      // Fast fetch first, then fallback to snapshot if needed for real-time
      const syncProfile = async () => {
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
             // One-time role check for specifically designated emails
             const uEmail = (authUser.email || '').toLowerCase();
             const isAdminEmail = uEmail.includes('admin') || uEmail.includes('owner') || uEmail === 'nexamartowner@gmail.com' || uEmail.includes('dipakjaiswal811') || uEmail.includes('dipak');
             const isRiderEmail = uEmail.includes('rider') || uEmail.includes('delivery');
             const isVendorEmail = uEmail.includes('vendor') || uEmail.includes('seller') || uEmail.includes('merchant');

             if (isAdminEmail && profileData.role !== 'admin') {
               await setDoc(docRef, { role: 'admin' }, { merge: true });
               profileData.role = 'admin';
             } else if (isRiderEmail && profileData.role !== 'rider') {
               await setDoc(docRef, { role: 'rider' }, { merge: true });
               profileData.role = 'rider';
             } else if (isVendorEmail && profileData.role !== 'vendor') {
               await setDoc(docRef, { role: 'vendor' }, { merge: true });
               profileData.role = 'vendor';
             }
            
            if (profileData.status === 'blocked') {
              setProfile(profileData);
              setLoading(false);
              auth.signOut();
            } else {
              setProfile(profileData);
              localStorage.setItem('user_profile_cache', JSON.stringify(profileData));
              setLoading(false);
            }
          } else {
            // New User Setup
            const tuEmail = (authUser.email || '').toLowerCase();
            const initialIsAdmin = tuEmail.includes('admin') || tuEmail.includes('owner') || tuEmail === 'nexamartowner@gmail.com' || tuEmail.includes('dipakjaiswal811') || tuEmail.includes('dipak');
            const initialIsRider = tuEmail.includes('rider') || tuEmail.includes('delivery');
            const initialIsVendor = tuEmail.includes('vendor') || tuEmail.includes('seller') || tuEmail.includes('merchant');

            const newProfile: UserProfile = {
              userId: authUser.uid,
              fullName: authUser.displayName || 'User',
              email: authUser.email || '',
              role: initialIsAdmin ? 'admin' : initialIsRider ? 'rider' : initialIsVendor ? 'vendor' : 'customer',
              status: 'active',
              wishlist: [],
              addresses: [],
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
            setLoading(false);
          }
        } catch (e) {
          console.error("Profile sync error:", e);
          setLoading(false);
        }
      };

      syncProfile();

      // Maintain live sync for status/role changes
      unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
          localStorage.setItem('user_profile_cache', JSON.stringify(profileData));
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('user_profile_cache');
    localStorage.removeItem('user_mock_auth');
    setUser(null);
    setProfile(null);
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut, setProfile, loginAsMockUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
