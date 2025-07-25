import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCustomerData } from "@/hooks/useCustomerData";

export default function AdditionalInfoPanel() {
  const { customerData, updateCustomerData } = useCustomerData();

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Item Name</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="Product name"
            value={customerData.itemname || ''}
            onChange={(e) => updateCustomerData('itemname', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Delivery Date</Label>
          <Input
            type="date"
            className="w-full text-sm"
            value={customerData.deliverydate || ''}
            onChange={(e) => updateCustomerData('deliverydate', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Waiting Time</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="2 business days"
            value={customerData.waitingtime || ''}
            onChange={(e) => updateCustomerData('waitingtime', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
