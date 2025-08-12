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
  createdBy?: string;
  createdAt: string; // Changed from Date to string since API returns string
  updatedAt: string; // Changed from Date to string since API returns string
  version?: number;
  lastAnnouncedAt?: string; // Changed from Date to string since API returns string
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnacknowledgedAnnouncements = async () => {
      if (!user?.id) return;

      try {
        // Use the announcements API to get unacknowledged announcements
        const response = await fetch(`/api/announcements/unacknowledged/${user.id}`);
        if (response.ok) {
          const fetchedAnnouncements = await response.json();
          if (fetchedAnnouncements && fetchedAnnouncements.length > 0) {
            // Sort by priority (urgent > high > medium > low) and then by creation date
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const sortedAnnouncements = fetchedAnnouncements.sort((a: Announcement, b: Announcement) => {
              const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            setAnnouncements(sortedAnnouncements);
            setIsVisible(true);
          }
        } else {
          console.log('No unacknowledged announcements found or API error');
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnacknowledgedAnnouncements();
  }, [user?.id]);

  const handleAcknowledgeAll = async () => {
    if (!announcements.length || !user?.id || isAcknowledging) return;

    setIsAcknowledging(true);

    try {
      // Hide the modal immediately for better UX
      setIsVisible(false);
      
      // Process all announcements
      const acknowledgmentPromises = announcements.map(async (announcement) => {
        try {
          // Try to sync to notification system first
          const response = await fetch(`/api/announcements/${announcement.id}/acknowledge`, {
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
            // Successfully acknowledged via API
            console.log(`Announcement ${announcement.id} acknowledged successfully`);
            return { success: true, id: announcement.id };
          } else {
            throw new Error(`API failed with status ${response.status}`);
          }
        } catch (apiError) {
          console.warn(`API failed for ${announcement.id}, falling back to localStorage:`, apiError);
          
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

          // Try to sync to original database
          try {
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
              return { success: true, id: announcement.id };
            } else {
              const errorText = await response.text();
              throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
          } catch (syncError) {
            console.error(`Sync failed for announcement ${announcement.id}:`, syncError);
            return { success: false, id: announcement.id, error: syncError };
          }
        }
      });

      const results = await Promise.allSettled(acknowledgmentPromises);
      const failedAcknowledgments = results
        .map((result, index) => ({ result, announcement: announcements[index] }))
        .filter(({ result }) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success));

      if (failedAcknowledgments.length > 0) {
        toast({
          title: "Some acknowledgments failed",
          description: `${failedAcknowledgments.length} out of ${announcements.length} acknowledgments couldn't be synced to server.`,
          variant: "default",
        });
      }

      // Clear announcements array
      setAnnouncements([]);
      
    } catch (error) {
      console.error('Error acknowledging announcements:', error);
      toast({
        title: "Error saving acknowledgments",
        description: "There was an issue saving your acknowledgments. Please try again.",
        variant: "destructive",
      });
      // If everything fails, show the announcements again
      setIsVisible(true);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading || !announcements.length || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {announcements.map((announcement, index) => {
            const IconComponent = priorityIcons[announcement.priority];
            const iconColorClass = priorityColors[announcement.priority];
            
            return (
              <Card 
                key={announcement.id}
                className="shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-300"
                style={{
                  backgroundColor: announcement.backgroundColor,
                  color: announcement.textColor,
                  borderColor: announcement.borderColor,
                  transform: `translateY(${index * 4}px)`,
                  opacity: 1 - (index * 0.1),
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

                    {index === 0 && (
                      <Button
                        onClick={() => setIsVisible(false)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 hover:bg-white/10 p-2 opacity-60 hover:opacity-100"
                        style={{ color: announcement.textColor }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 text-xs opacity-75">
                    <span>Priority: {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
                    <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Single acknowledgment button for all announcements */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleAcknowledgeAll}
            disabled={isAcknowledging}
            className="px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all bg-white text-gray-900 hover:bg-gray-100 border-2 border-gray-300"
          >
            {isAcknowledging ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-b-transparent mr-3"></div>
                Processing...
              </div>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-3" />
                Got it ({announcements.length} announcement{announcements.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}