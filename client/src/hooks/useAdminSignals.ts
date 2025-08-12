import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface RefreshSignal {
  type: string;
  message: string;
  timestamp: number;
}

export function useAdminSignals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastCheckRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run for authenticated users
    if (!user) return;

    const checkForSignals = async () => {
      try {
        const response = await fetch(`/api/admin/refresh-signal?lastCheck=${lastCheckRef.current}`);
        if (response.ok) {
          const signal: RefreshSignal = await response.json();
          
          if (signal.type === 'FORCE_REFRESH') {
            // Show toast notification
            toast({
              title: "System Update",
              description: signal.message,
              duration: 3000,
            });
            
            // Refresh the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            
            // Update last check timestamp
            lastCheckRef.current = signal.timestamp;
          }
        }
      } catch (error) {
        // Silently ignore network errors for this polling mechanism
        console.log('Admin signal check failed (this is normal):', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkForSignals();
    intervalRef.current = setInterval(checkForSignals, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, toast]);

  // Also listen for user deletion events via localStorage polling
  useEffect(() => {
    if (!user) return;

    const checkUserDeletion = async () => {
      try {
        // Check if current user still exists
        const response = await fetch(`/api/user/${user.id}/exists`);
        if (response.status === 404) {
          // User was deleted, force logout
          toast({
            title: "Account Deleted",
            description: "Your account has been deleted. Redirecting to login...",
            variant: "destructive",
            duration: 4000,
          });
          
          // Clear any cached auth data and redirect
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 2000);
        }
      } catch (error) {
        // Silently handle errors
        console.log('User deletion check failed:', error);
      }
    };

    // Check user deletion every 60 seconds
    const userCheckInterval = setInterval(checkUserDeletion, 60000);

    return () => {
      clearInterval(userCheckInterval);
    };
  }, [user, toast]);
}