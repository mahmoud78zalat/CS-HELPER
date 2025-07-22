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
          <Input
            type="tel"
            className="w-full text-sm"
            placeholder="+971 50 123 4567"
            value={customerData.customer_phone || ''}
            onChange={(e) => updateCustomerData('customer_phone', e.target.value)}
          />
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
