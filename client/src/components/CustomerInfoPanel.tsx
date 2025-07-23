import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Trash2, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CustomerInfoPanel() {
  const { customerData, updateCustomerData, clearCustomerData } = useCustomerData();
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



  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Language Switcher */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-slate-600" />
            <Label className="text-xs font-medium text-slate-600">Live Chat Language</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={customerData.language === 'en' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => updateCustomerData('language', 'en')}
          >
            🇬🇧 EN
          </Button>
          <Button
            variant={customerData.language === 'ar' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => updateCustomerData('language', 'ar')}
          >
            🇴🇲 AR
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Switch between English and Arabic templates for live chat responses
        </p>
      </div>

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
          onClick={clearCustomerData}
          variant="outline"
          className="w-full mt-3 text-sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Info
        </Button>
      </div>
    </div>
  );
}
