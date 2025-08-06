import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Check, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AgentSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function AgentSetupModal({ open, onOpenChange, onComplete }: AgentSetupModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [arabicFirstName, setArabicFirstName] = useState('');
  const [arabicLastName, setArabicLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !arabicFirstName.trim() || !arabicLastName.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in all name fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User authentication is required. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('[AgentSetup] Starting profile setup for user:', user.id);
      console.log('[AgentSetup] Setup data:', {
        userId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        arabicFirstName: arabicFirstName.trim(),
        arabicLastName: arabicLastName.trim(),
      });

      const response = await fetch('/api/users/setup-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          arabicFirstName: arabicFirstName.trim(),
          arabicLastName: arabicLastName.trim(),
        }),
      });

      const responseData = await response.json();
      console.log('[AgentSetup] API response status:', response.status);
      console.log('[AgentSetup] API response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData?.message || 'Failed to save profile');
      }

      console.log('[AgentSetup] ✅ Profile setup successful');
      toast({
        title: "Welcome to the team!",
        description: "Your profile has been set up successfully.",
      });

      // Give a small delay to ensure the toast shows before completing
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('[AgentSetup] Error setting up profile:', error);
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800">Welcome to the Team!</DialogTitle>
          <p className="text-slate-600 mt-2">
            Let's set up your profile with both English and Arabic names for customer communication.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Names Card */}
            <Card className="border-2 border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <User className="h-4 w-4" />
                  English Name
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="mt-1"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Arabic Names Card */}
            <Card className="border-2 border-green-100">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <User className="h-4 w-4" />
                  Arabic Name
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Arabic First Name</Label>
                  <Input
                    value={arabicFirstName}
                    onChange={(e) => setArabicFirstName(e.target.value)}
                    placeholder="أدخل اسمك الأول بالعربية"
                    className="mt-1"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Arabic Last Name</Label>
                  <Input
                    value={arabicLastName}
                    onChange={(e) => setArabicLastName(e.target.value)}
                    placeholder="أدخل اسم عائلتك بالعربية"
                    className="mt-1"
                    dir="rtl"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {(firstName || lastName || arabicFirstName || arabicLastName) && (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm text-slate-700">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">English:</span>
                    <span>{firstName} {lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Arabic:</span>
                    <span dir="rtl">{arabicFirstName} {arabicLastName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !arabicFirstName.trim() || !arabicLastName.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}