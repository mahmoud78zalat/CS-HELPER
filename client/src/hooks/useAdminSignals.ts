import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface RefreshSignal {
  type: string;
  message: string;
  timestamp: number;
  adminId?: string;
  adminEmail?: string;
}

export function useAdminSignals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastCheckRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessingRefresh, setIsProcessingRefresh] = useState(false);

  useEffect(() => {
    // Only run for authenticated users
    if (!user) return;

    const checkForSignals = async () => {
      try {
        const response = await fetch(`/api/admin/refresh-signal?lastCheck=${lastCheckRef.current}`);
        if (response.ok) {
          const signal: RefreshSignal = await response.json();
          
          if (signal.type === 'FORCE_REFRESH' && !isProcessingRefresh) {
            setIsProcessingRefresh(true);
            
            // Don't refresh the admin who initiated the refresh
            if (signal.adminId && signal.adminId === user.id) {
              console.log('[AdminSignals] Skipping refresh for initiating admin');
              lastCheckRef.current = signal.timestamp;
              setIsProcessingRefresh(false);
              return;
            }
            
            // Show toast notification
            toast({
              title: "System Update",
              description: signal.message || "Admin has initiated a system refresh. Page will reload shortly.",
              duration: 3000,
            });
            
            console.log(`[AdminSignals] Received refresh signal from ${signal.adminEmail || 'admin'}, refreshing page in 2 seconds`);
            
            // Refresh the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            
            // Update last check timestamp
            lastCheckRef.current = signal.timestamp;
          } else if (signal.type === 'NO_REFRESH') {
            // Update timestamp for NO_REFRESH responses
            if (signal.timestamp) {
              lastCheckRef.current = signal.timestamp;
            }
          }
        }
      } catch (error) {
        // Silently ignore network errors for this polling mechanism
        console.log('[AdminSignals] Check failed (this is normal):', error);
      }
    };

    // Check immediately and then every 10 seconds for faster response
    checkForSignals();
    intervalRef.current = setInterval(checkForSignals, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, toast, isProcessingRefresh]);

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