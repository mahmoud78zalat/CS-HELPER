import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  lastAnnouncedAt?: Date;
}

const priorityIcons = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
  urgent: AlertCircle,
};

const priorityColors = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnacknowledgedAnnouncements = async () => {
      if (!user?.id) return;

      try {
        // Use the persistent notification API to get unacknowledged announcements
        const response = await fetch(`/api/persistent/user/${user.id}/unacknowledged-announcements`);
        if (response.ok) {
          const announcements = await response.json();
          if (announcements && announcements.length > 0) {
            const firstAnnouncement = announcements[0];
            setAnnouncement(firstAnnouncement);
            setIsVisible(true);
          }
        } else {
          // Fallback to original method if persistent API fails
          console.log('Persistent API failed, using fallback method');
          const response = await fetch(`/api/announcements/unacknowledged/${user.id}`);
          if (response.ok) {
            const announcements = await response.json();
            if (announcements && announcements.length > 0) {
              const firstAnnouncement = announcements[0];
              
              // Check if this announcement was already acknowledged locally (version-aware)
              const localKey = `announcement_ack_${user.id}_${firstAnnouncement.id}`;
              const localAckData = localStorage.getItem(localKey);
              
              let shouldShow = true;
              
              if (localAckData) {
                try {
                  const ackData = JSON.parse(localAckData);
                  const localVersion = ackData.version || 1;
                  const currentVersion = firstAnnouncement.version || 1;
                  
                  // Show announcement if it's been re-announced (version bumped)
                  shouldShow = currentVersion > localVersion;
                } catch (e) {
                  // If parsing fails, treat as not acknowledged
                  shouldShow = true;
                }
              }
              
              if (shouldShow) {
                setAnnouncement(firstAnnouncement);
                setIsVisible(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnacknowledgedAnnouncements();
  }, [user?.id]);

  const handleAcknowledge = async () => {
    if (!announcement || !user?.id || isAcknowledging) return;

    setIsAcknowledging(true);

    try {
      // Hide the modal immediately for better UX
      setIsVisible(false);
      setAnnouncement(null);

      // Try to sync to persistent notification system first
      try {
        const response = await fetch(`/api/persistent/announcements/${announcement.id}/acknowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: user.id,
            version: announcement.version || 1
          }),
        });

        if (response.ok) {
          // Successfully acknowledged via persistent API
          console.log('Announcement acknowledged via persistent API');
          return;
        } else {
          throw new Error(`Persistent API failed with status ${response.status}`);
        }
      } catch (persistentError) {
        console.warn('Persistent API failed, falling back to original method:', persistentError);
        
        // Fallback: Store acknowledgment in localStorage immediately for instant feedback with version tracking
        const localKey = `announcement_ack_${user.id}_${announcement.id}`;
        const ackData = {
          userId: user.id,
          announcementId: announcement.id,
          acknowledgedAt: new Date().toISOString(),
          version: announcement.version || 1,
          synced: false
        };
        localStorage.setItem(localKey, JSON.stringify(ackData));

        // Try to sync to original database with retry mechanism
        let syncAttempts = 0;
        const maxRetries = 2;
        
        const attemptSync = async (): Promise<boolean> => {
          try {
            syncAttempts++;
            const response = await fetch(`/api/announcements/${announcement.id}/acknowledge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: user.id }),
            });

            if (response.ok) {
              // Mark as synced in localStorage
              const updatedAckData = { ...ackData, synced: true };
              localStorage.setItem(localKey, JSON.stringify(updatedAckData));
              return true;
            } else {
              const errorText = await response.text();
              throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
          } catch (syncError) {
            console.error(`Sync attempt ${syncAttempts} failed:`, syncError);
            
            if (syncAttempts < maxRetries) {
              // Wait 1 second before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              return attemptSync();
            }
            return false;
          }
        };

        const syncSuccess = await attemptSync();
        
        if (!syncSuccess) {
          toast({
            title: "Acknowledgment recorded locally",
            description: "Your acknowledgment was saved but couldn't sync to server after 2 attempts.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      toast({
        title: "Error saving acknowledgment",
        description: "There was an issue saving your acknowledgment. Please try again.",
        variant: "destructive",
      });
      // If everything fails, show the announcement again
      setIsVisible(true);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  const IconComponent = priorityIcons[announcement.priority];
  const iconColorClass = priorityColors[announcement.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card 
        className="mx-auto max-w-2xl w-full shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-300"
        style={{
          backgroundColor: announcement.backgroundColor,
          color: announcement.textColor,
          borderColor: announcement.borderColor,
        }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <IconComponent className={`h-6 w-6 mt-0.5 flex-shrink-0 ${iconColorClass}`} />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl mb-3">{announcement.title}</h3>
              <div 
                className="prose prose-sm max-w-none leading-relaxed"
                style={{ color: announcement.textColor }}
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>

            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 hover:bg-white/10 p-2 opacity-60 hover:opacity-100"
              style={{ color: announcement.textColor }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4 text-xs opacity-75">
            <span>Priority: {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
            <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ 
                backgroundColor: announcement.textColor,
                color: announcement.backgroundColor,
              }}
            >
              {isAcknowledging ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Got it
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}