import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Search, Copy, ChevronDown, RefreshCw } from "lucide-react";

interface CheckOrderModalProps {
  onClose: () => void;
}

export default function CheckOrderModal({ onClose }: CheckOrderModalProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [converterId, setConverterId] = useState('');
  const [converterResult, setConverterResult] = useState('');
  const { toast } = useToast();

  const handleSearch = () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number or AWB",
        variant: "destructive",
      });
      return;
    }

    // Mock search result - in real implementation, this would call an API
    setSearchResult({
      orderNumber: orderNumber.startsWith('A') ? orderNumber : `A${Math.random().toString().slice(2, 9)}`,
      awbNumber: orderNumber.startsWith('AWB') ? orderNumber : `AWB${Math.random().toString().slice(2, 11)}`,
      status: 'Delivered',
      deliveryDate: 'March 15, 2024',
      deliveryAddress: 'Dubai, UAE',
      trackingHistory: [
        { status: 'Delivered', date: 'March 15, 2024 2:30 PM', color: 'green' },
        { status: 'Out for delivery', date: 'March 15, 2024 8:00 AM', color: 'blue' },
        { status: 'In transit', date: 'March 14, 2024 6:00 PM', color: 'yellow' },
        { status: 'Shipped', date: 'March 12, 2024 10:00 AM', color: 'gray' },
      ]
    });
  };

  const handleCopyTrackingInfo = () => {
    if (searchResult) {
      const trackingInfo = `Order Status: ${searchResult.status}
Order Number: ${searchResult.orderNumber}
AWB Number: ${searchResult.awbNumber}
Delivery Date: ${searchResult.deliveryDate}
Delivery Address: ${searchResult.deliveryAddress}

Tracking History:
${searchResult.trackingHistory.map((item: any) => `- ${item.status} - ${item.date}`).join('\n')}`;

      navigator.clipboard.writeText(trackingInfo);
      toast({
        title: "Success",
        description: "Tracking information copied to clipboard!",
      });
    }
  };

  const handleOrderConverter = () => {
    if (!converterId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Order ID",
        variant: "destructive",
      });
      return;
    }

    // Order ID to AWB conversion logic from the provided brief
    let orderId = converterId.trim();
    
    // Remove any existing prefixes
    orderId = orderId.replace(/^(A|AWB)/i, '');
    
    // Convert Order ID to AWB using the provided logic
    // AWB = A + (Order ID + 10000000)
    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      toast({
        title: "Error",
        description: "Order ID must be a valid number",
        variant: "destructive",
      });
      return;
    }

    const awb = 'A' + (orderIdNum + 10000000).toString();
    setConverterResult(awb);

    // Copy to clipboard automatically
    navigator.clipboard.writeText(awb);
    toast({
      title: "Success",
      description: `AWB ${awb} copied to clipboard!`,
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
            <Label htmlFor="order-input" className="text-sm font-medium text-slate-700 mb-2">
              Order Number or AWB
            </Label>
            <Input
              id="order-input"
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter order number (A1234567) or AWB tracking number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSearch}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Order
          </Button>

          {searchResult && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
              <h4 className="font-semibold text-slate-800 mb-3">
                Order Status: <span className="text-green-600">{searchResult.status}</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order Number:</span>
                  <span className="font-medium">{searchResult.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">AWB Number:</span>
                  <span className="font-medium">{searchResult.awbNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Date:</span>
                  <span className="font-medium">{searchResult.deliveryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Address:</span>
                  <span className="font-medium">{searchResult.deliveryAddress}</span>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="font-medium text-slate-800 mb-2">Tracking History</h5>
                <div className="space-y-2 text-xs">
                  {searchResult.trackingHistory.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 bg-${item.color}-500 rounded-full`}></div>
                      <span>{item.status} - {item.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCopyTrackingInfo}
                className="w-full mt-4 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Tracking Info
              </Button>
            </div>
          )}

          {/* Order Converter Section */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div>
              <button
                onClick={() => setIsConverterOpen(!isConverterOpen)}
                className="w-full flex items-center justify-between text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="font-medium text-slate-800">Order ID to AWB Converter</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isConverterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isConverterOpen && (
                <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <Label htmlFor="converter-input" className="text-sm font-medium text-slate-700 mb-2">
                      Order ID
                    </Label>
                    <Input
                      id="converter-input"
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Order ID (e.g., 1234567)"
                      value={converterId}
                      onChange={(e) => setConverterId(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleOrderConverter}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert to AWB
                  </Button>

                  {converterResult && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-green-600 font-medium">AWB Number:</span>
                          <div className="text-lg font-bold text-green-800 mt-1">{converterResult}</div>
                        </div>
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(converterResult);
                            toast({
                              title: "Copied!",
                              description: "AWB number copied to clipboard",
                            });
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
