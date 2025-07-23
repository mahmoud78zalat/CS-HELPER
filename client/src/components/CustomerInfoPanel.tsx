import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerInfoPanel() {
  const { customerData, updateCustomerData } = useCustomerData();
  const { toast } = useToast();

  const handleDetectCountry = () => {
    const phone = customerData.customer_phone || '';
    let detectedCountry = '';
    
    // Arab countries phone code detection
    if (phone.startsWith('+971') || phone.startsWith('971')) {
      detectedCountry = '🇦🇪 United Arab Emirates';
    } else if (phone.startsWith('+966') || phone.startsWith('966')) {
      detectedCountry = '🇸🇦 Saudi Arabia';
    } else if (phone.startsWith('+965') || phone.startsWith('965')) {
      detectedCountry = '🇰🇼 Kuwait';
    } else if (phone.startsWith('+974') || phone.startsWith('974')) {
      detectedCountry = '🇶🇦 Qatar';
    } else if (phone.startsWith('+973') || phone.startsWith('973')) {
      detectedCountry = '🇧🇭 Bahrain';
    } else if (phone.startsWith('+968') || phone.startsWith('968')) {
      detectedCountry = '🇴🇲 Oman';
    } else if (phone.startsWith('+20') || phone.startsWith('20')) {
      detectedCountry = '🇪🇬 Egypt';
    } else if (phone.startsWith('+962') || phone.startsWith('962')) {
      detectedCountry = '🇯🇴 Jordan';
    } else if (phone.startsWith('+961') || phone.startsWith('961')) {
      detectedCountry = '🇱🇧 Lebanon';
    }
    
    if (detectedCountry) {
      updateCustomerData('customer_country', detectedCountry);
      toast({
        title: "Country Detected",
        description: `Customer is from ${detectedCountry}`,
      });
    } else {
      toast({
        title: "Unable to Detect",
        description: "Country could not be detected from phone number",
        variant: "destructive",
      });
    }
  };

  const handleCopyInfo = () => {
    const info = `Customer Information:
Name: ${customerData.customer_name || 'N/A'}
Phone: ${customerData.customer_phone || 'N/A'}
Email: ${customerData.customer_email || 'N/A'}
Country: ${customerData.customer_country || 'N/A'}
Gender: ${customerData.gender || 'N/A'}`;

    navigator.clipboard.writeText(info);
    toast({
      title: "Success",
      description: "Customer information copied to clipboard!",
    });
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Customer Name</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="Enter customer name"
            value={customerData.customer_name || ''}
            onChange={(e) => updateCustomerData('customer_name', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              type="tel"
              className="flex-1 text-sm"
              placeholder="+971 50 123 4567"
              value={customerData.customer_phone || ''}
              onChange={(e) => updateCustomerData('customer_phone', e.target.value)}
            />
            <Button
              type="button"
              onClick={handleDetectCountry}
              className="px-3 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
              disabled={!customerData.customer_phone}
            >
              Detect Country
            </Button>
          </div>
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Email</Label>
          <Input
            type="email"
            className="w-full text-sm"
            placeholder="customer@email.com"
            value={customerData.customer_email || ''}
            onChange={(e) => updateCustomerData('customer_email', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Country</Label>
          <Select 
            value={customerData.customer_country || ''} 
            onValueChange={(value) => updateCustomerData('customer_country', value)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🇦🇪 United Arab Emirates">🇦🇪 United Arab Emirates</SelectItem>
              <SelectItem value="🇸🇦 Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
              <SelectItem value="🇰🇼 Kuwait">🇰🇼 Kuwait</SelectItem>
              <SelectItem value="🇶🇦 Qatar">🇶🇦 Qatar</SelectItem>
              <SelectItem value="🇧🇭 Bahrain">🇧🇭 Bahrain</SelectItem>
              <SelectItem value="🇴🇲 Oman">🇴🇲 Oman</SelectItem>
              <SelectItem value="🇪🇬 Egypt">🇪🇬 Egypt</SelectItem>
              <SelectItem value="🇯🇴 Jordan">🇯🇴 Jordan</SelectItem>
              <SelectItem value="🇱🇧 Lebanon">🇱🇧 Lebanon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Gender</Label>
          <Select 
            value={customerData.gender || ''} 
            onValueChange={(value) => updateCustomerData('gender', value)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleCopyInfo}
          className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-md text-sm hover:shadow-lg transition-all duration-200"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Customer Info
        </Button>
      </div>
    </div>
  );
}
