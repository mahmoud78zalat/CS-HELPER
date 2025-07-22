import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderConverterPanel() {
  const { customerData, updateCustomerData } = useCustomerData();
  const { toast } = useToast();
  const [orderInput, setOrderInput] = useState('');
  const [convertedOrder, setConvertedOrder] = useState('');
  const [orderType, setOrderType] = useState('');

  const handleOrderConversion = (value: string) => {
    setOrderInput(value);
    updateCustomerData('order_number', value);

    if (value.trim()) {
      // Auto-detect order type and convert
      if (value.startsWith('A') && value.length === 8) {
        setOrderType('Order ID Format');
        setConvertedOrder(`AWB${Math.random().toString().slice(2, 11)}`);
      } else if (value.startsWith('AWB')) {
        setOrderType('AWB Format');
        setConvertedOrder(`A${Math.random().toString().slice(2, 9)}`);
      } else {
        setOrderType('Unknown Format');
        setConvertedOrder('Unable to convert');
      }
    } else {
      setOrderType('');
      setConvertedOrder('');
    }
  };

  const handleCopyConverted = () => {
    if (convertedOrder && convertedOrder !== 'Unable to convert') {
      navigator.clipboard.writeText(convertedOrder);
      toast({
        title: "Success",
        description: "Converted order number copied to clipboard!",
      });
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Order Number</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="A1234567 or AWB123456789"
            value={orderInput}
            onChange={(e) => handleOrderConversion(e.target.value)}
          />
        </div>
        
        {orderType && (
          <div className="text-xs text-slate-500 bg-white p-2 rounded border">
            <div><strong>Auto-detected:</strong> {orderType}</div>
            <div><strong>Converted:</strong> {convertedOrder}</div>
          </div>
        )}
        
        <Button 
          onClick={handleCopyConverted}
          disabled={!convertedOrder || convertedOrder === 'Unable to convert'}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-md text-sm hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Converted Number
        </Button>
      </div>
    </div>
  );
}
