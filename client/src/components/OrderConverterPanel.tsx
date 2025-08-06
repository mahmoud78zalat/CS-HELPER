import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Copy, Coins, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONVERSION_RATES = {
  'UAE': { symbol: 'AED', rate: 0.01 }, // 1000 points = 10 AED
  'KSA': { symbol: 'SAR', rate: 0.01 }, // 1000 points = 10 SAR  
  'QATAR': { symbol: 'QTR', rate: 0.01 }, // 1000 points = 10 QTR
  'MALAYSIA': { symbol: 'MYR', rate: 0.01 }, // 1000 points = 10 MYR
  'BAHRAIN': { symbol: 'BAH', rate: 0.001 }, // 1000 points = 1 BAH
  'KUWAIT': { symbol: 'KWT', rate: 0.001 }, // 1000 points = 1 KWT
  'OMAN': { symbol: 'OMR', rate: 0.001 }, // 1000 points = 1 OMR
  'SINGAPORE': { symbol: 'SGD', rate: 0.003 }, // 1000 points = 3 SGD
  'OTHER': { symbol: 'USD', rate: 0.003 }, // 1000 points = 3 USD (Rest of countries)
};

export default function OrderConverterPanel() {
  const { customerData, updateCustomerData } = useCustomerData();
  const { toast } = useToast();
  const [orderInput, setOrderInput] = useState('');
  const [convertedOrder, setConvertedOrder] = useState('');
  const [orderType, setOrderType] = useState('');
  const [pointsInput, setPointsInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('UAE');
  const [convertedCurrency, setConvertedCurrency] = useState('');

  const handleOrderConversion = (value: string) => {
    setOrderInput(value);
    updateCustomerData('order_number', value);

    if (value.trim()) {
      // New logic: Input must start with 'A' and total length must be >= 13
      if (value.startsWith('A') && value.length >= 13) {
        setOrderType('Order ID Format');
        
        // Remove first 'A' letter
        let processed = value.substring(1);
        
        // Handle dash removal logic - if there's a dash after 13 characters, remove it and numbers after it
        const dashIndex = processed.indexOf('-');
        if (dashIndex >= 0 && (dashIndex + 1 + 1) >= 13) { // +1 for 'A' already removed, +1 for dash position
          processed = processed.substring(0, dashIndex);
        }
        
        // If length > 12 (13-1 for removed A), remove extra characters from the end
        if (processed.length > 12) {
          processed = processed.substring(0, 12);
        }
        
        // Remove last 5 characters from what remains
        if (processed.length > 5) {
          processed = processed.substring(0, processed.length - 5);
        }
        
        setConvertedOrder(processed);

      } else {
        setOrderType('Invalid Format');
        setConvertedOrder('Must start with A and be at least 13 characters');
      }
    } else {
      setOrderType('');
      setConvertedOrder('');
    }
  };

  const handlePointsConversion = (points: string, country: string) => {
    setPointsInput(points);
    setSelectedCountry(country);
    
    const pointsNum = parseFloat(points);
    if (!isNaN(pointsNum) && pointsNum > 0) {
      const rate = CONVERSION_RATES[country as keyof typeof CONVERSION_RATES];
      const converted = (pointsNum * rate.rate).toFixed(2);
      setConvertedCurrency(`${converted} ${rate.symbol}`);
    } else {
      setConvertedCurrency('');
    }
  };



  const handleCopyText = (text: string, description: string) => {
    if (text && text !== 'Unable to convert' && text !== 'Must start with A and be at least 13 characters') {
      navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: `${description} copied to clipboard!`,
      });
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
      {/* Order/User ID Conversion */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-500" />
          <Label className="text-sm font-medium text-slate-700">Order/User ID Converter</Label>
        </div>
        
        <div>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="A123456789101 (min 13 chars, starts with A/U)"
            value={orderInput}
            onChange={(e) => handleOrderConversion(e.target.value)}
          />
        </div>
        
        {orderType && (
          <div className="text-xs text-slate-600 bg-white p-3 rounded border">
            <div className="flex justify-between items-center mb-2">
              <span><strong>Detected:</strong> {orderType}</span>
            </div>
            <div className="space-y-2">
              <div><strong>Result:</strong> {convertedOrder}</div>
              {convertedOrder && convertedOrder !== 'Unable to convert' && convertedOrder !== 'Must start with A and be at least 13 characters' && (
                <Button 
                  onClick={() => handleCopyText(convertedOrder, 'Converted ID')}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Result
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Points to Currency Conversion */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-green-500" />
          <Label className="text-sm font-medium text-slate-700">Points to Currency</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Enter points"
            value={pointsInput}
            onChange={(e) => handlePointsConversion(e.target.value, selectedCountry)}
            className="text-sm"
          />
          <Select value={selectedCountry} onValueChange={(value) => handlePointsConversion(pointsInput, value)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UAE">UAE (AED)</SelectItem>
              <SelectItem value="KSA">KSA (SAR)</SelectItem>
              <SelectItem value="QATAR">Qatar (QTR)</SelectItem>
              <SelectItem value="MALAYSIA">Malaysia (MYR)</SelectItem>
              <SelectItem value="BAHRAIN">Bahrain (BAH)</SelectItem>
              <SelectItem value="KUWAIT">Kuwait (KWT)</SelectItem>
              <SelectItem value="OMAN">Oman (OMR)</SelectItem>
              <SelectItem value="SINGAPORE">Singapore (SGD)</SelectItem>
              <SelectItem value="OTHER">Other Countries (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {convertedCurrency && (
          <div className="text-xs text-slate-600 bg-white p-3 rounded border">
            <div className="flex justify-between items-center mb-2">
              <span><strong>Converted Amount:</strong> {convertedCurrency}</span>
            </div>
            <Button 
              onClick={() => handleCopyText(convertedCurrency, 'Currency amount')}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Amount
            </Button>
          </div>
        )}
      </div>


    </div>
  );
}
