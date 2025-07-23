import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Copy, ExternalLink, AlertTriangle } from "lucide-react";

interface CheckOrderModalProps {
  onClose: () => void;
}

export default function CheckOrderModal({ onClose }: CheckOrderModalProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [platform, setPlatform] = useState<'clickpost' | 'bfl'>('clickpost');
  const { toast } = useToast();

  const handleTrackOrder = () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number or AWB",
        variant: "destructive",
      });
      return;
    }

    const input = orderNumber.trim();
    let url = '';

    if (platform === 'clickpost') {
      // ClickPost logic
      if (input.startsWith('A')) {
        // Order Number
        url = `https://dashboard.clickpost.ai/track/orders?search_type=order_id&search_value=${input}`;
      } else {
        // AWB
        url = `https://dashboard.clickpost.ai/track/orders?search_type=awb&search_value=${input}`;
      }
    } else if (platform === 'bfl') {
      // BFL Panel logic - only allow order numbers starting with 'A'
      if (!input.startsWith('A')) {
        toast({
          title: "Invalid Input",
          description: "BFL Panel only accepts order numbers starting with 'A'",
          variant: "destructive",
        });
        return;
      }
      url = `https://new-panel.brandsforlessuae.com/dashboard/orders/${input}`;
    }

    // Open in new tab
    window.open(url, '_blank');
    
    toast({
      title: "Success",
      description: `Opened tracking in ${platform === 'clickpost' ? 'ClickPost' : 'BFL Panel'}`,
    });
  };





  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Check Order Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="platform-select" className="text-sm font-medium text-slate-700 mb-2">
              Tracking Platform
            </Label>
            <Select value={platform} onValueChange={(value: 'clickpost' | 'bfl') => setPlatform(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tracking platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clickpost">ClickPost</SelectItem>
                <SelectItem value="bfl">BFL Panel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="order-input" className="text-sm font-medium text-slate-700 mb-2">
              {platform === 'bfl' ? 'Order Number (must start with "A")' : 'Order Number or AWB'}
            </Label>
            <Input
              id="order-input"
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={platform === 'bfl' ? 'Enter order number (A1234567)' : 'Enter order number (A1234567) or AWB tracking number'}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
            {platform === 'bfl' && !orderNumber.startsWith('A') && orderNumber.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>BFL Panel only accepts order numbers starting with "A"</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTrackOrder}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in {platform === 'clickpost' ? 'ClickPost' : 'BFL Panel'}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Platform Information:</p>
              {platform === 'clickpost' ? (
                <div>
                  <p>• Order numbers starting with "A" → Search as Order ID</p>
                  <p>• Other formats → Search as AWB</p>
                </div>
              ) : (
                <div>
                  <p>• Only accepts order numbers starting with "A"</p>
                  <p>• Direct access to BFL internal panel</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
