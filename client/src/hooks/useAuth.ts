import { useEffect, useState } from "react";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // BETA TESTING MODE: Auto-login as admin
    // TODO: Remove this block and uncomment the fetch logic below when ready for production
    setTimeout(() => {
      const betaUser: User = {
        id: "beta-admin-user",
        email: "admin@bfl.com",
        firstName: "Beta",
        lastName: "Admin",
        role: "admin",
        status: "active",
        profileImageUrl: null,
        lastSeen: new Date(),
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Beta testing: Auto-login as admin');
      setUser(betaUser);
      setIsLoading(false);
    }, 50); // Further reduced timeout for faster loading

    /* 
    // PRODUCTION CODE: Uncomment this block when ready to enable real authentication
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User data received:', userData);
          setUser(userData);
        } else {
          console.log('No authenticated user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    */
  }, []);

  const signOut = async () => {
    // BETA TESTING MODE: Just reload page
    // TODO: Use real logout when authentication is enabled
    setUser(null);
    setIsLoading(false);
    window.location.reload();
    // window.location.href = '/api/logout'; // Uncomment for production
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
