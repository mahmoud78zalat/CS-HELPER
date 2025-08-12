import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCustomerData } from "@/hooks/useCustomerData";

export default function AdditionalInfoPanel() {
  const { customerData, updateCustomerData } = useCustomerData();

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Delivery/Refund Date</Label>
          <Input
            type="date"
            className="w-full text-sm"
            value={customerData.delivery_date || ''}
            onChange={(e) => updateCustomerData('delivery_date', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Amount</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="Amount (e.g., 150.00)"
            value={customerData.amount || ''}
            onChange={(e) => updateCustomerData('amount', e.target.value)}
          />
        </div>
        
        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">OTP</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="OTP / Validation Code"
            value={customerData.otp || ''}
            onChange={(e) => updateCustomerData('otp', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1">Reference Number</Label>
          <Input
            type="text"
            className="w-full text-sm"
            placeholder="71547****"
            value={customerData.ref_number || ''}
            onChange={(e) => updateCustomerData('ref_number', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
