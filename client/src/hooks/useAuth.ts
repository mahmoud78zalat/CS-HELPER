import { useEffect, useState } from "react";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-login as admin for development
    setTimeout(() => {
      const adminUser: User = {
        id: "admin-user",
        email: "admin@example.com",
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        status: "active",
        profileImageUrl: null,
        lastSeen: new Date(),
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(adminUser);
      setIsLoading(false);
    }, 50);

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
