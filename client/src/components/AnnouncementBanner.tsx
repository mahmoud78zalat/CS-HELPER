import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  useEffect(() => {
    const fetchUnacknowledgedAnnouncements = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/announcements/unacknowledged/${user.id}`);
        if (response.ok) {
          const announcements = await response.json();
          if (announcements && announcements.length > 0) {
            // Show the highest priority announcement
            setAnnouncement(announcements[0]);
            setIsVisible(true);
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
    if (!announcement || !user?.id) return;

    try {
      const response = await fetch(`/api/announcements/${announcement.id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setIsVisible(false);
        setAnnouncement(null);
      }
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
    }
  };

  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  const IconComponent = priorityIcons[announcement.priority];
  const iconColorClass = priorityColors[announcement.priority];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card 
        className="mx-auto max-w-4xl shadow-lg border-2"
        style={{
          backgroundColor: announcement.backgroundColor,
          color: announcement.textColor,
          borderColor: announcement.borderColor,
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColorClass}`} />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
              <div 
                className="prose prose-sm max-w-none"
                style={{ color: announcement.textColor }}
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>

            <Button
              onClick={handleAcknowledge}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 hover:bg-white/10"
              style={{ color: announcement.textColor }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Got it
            </Button>

            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 hover:bg-white/10 p-2"
              style={{ color: announcement.textColor }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs opacity-75">
            <span>Priority: {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
            <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}