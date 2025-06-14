
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: number;
  name: string;
  specialization: string;
  email: string;
  mobile: string;
  status: "Active" | "Inactive";
  payType: "Fixed" | "Revenue Share";
  payAmount?: number;
  payPercentage?: number;
  tdsPercentage?: number | null;
  paymentTerms: string;
  assignedBatches?: string[];
  attendance?: {
    [batch: string]: {
      date: string;
      status: "Present" | "Absent" | "Late";
    }[];
  };
}

interface EditPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onEditPartner: (id: number, updatedPartner: Partial<Partner>) => void;
}

const EditPartnerDialog: React.FC<EditPartnerDialogProps> = ({
  open,
  onOpenChange,
  partner,
  onEditPartner,
}) => {
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        specialization: partner.specialization,
        email: partner.email,
        mobile: partner.mobile,
        status: partner.status,
        payType: partner.payType,
        payAmount: partner.payAmount ?? 0,
        payPercentage: partner.payPercentage ?? 0,
        paymentTerms: partner.paymentTerms,
        tdsPercentage: partner.tdsPercentage ?? 0, // Initialize with 0 or existing value
      });
    }
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async () => {
    if (!partner) return;

    // Basic client-side validation (can be expanded)
    if (!formData.name?.trim()) {
      toast({ title: "Validation Error", description: "Partner name is required.", variant: "destructive" });
      return;
    }
    if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Validation Error", description: "A valid email is required.", variant: "destructive" });
      return;
    }
    if (!formData.mobile?.trim() || !/^\+?[0-9]{10,15}$/.test(formData.mobile)) {
      toast({ title: "Validation Error", description: "A valid phone number is required.", variant: "destructive" });
      return;
    }
    if (formData.tdsPercentage !== null && formData.tdsPercentage !== undefined && (isNaN(Number(formData.tdsPercentage)) || Number(formData.tdsPercentage) < 0 || Number(formData.tdsPercentage) > 100)) {
      toast({
        title: "Invalid TDS Percentage",
        description: "TDS Percentage must be a number between 0 and 100",
        variant: "destructive"
      });
      return;
    }

    // Ensure numeric fields are numbers or null
    await onEditPartner(partner.id, formData);
    onOpenChange(false); 
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>
            Update the details for {partner.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="col-span-2"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="specialization" className="text-right">Specialization</Label>
            <Input
              id="specialization"
              name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              className="col-span-2"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="col-span-2"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="mobile" className="text-right">Phone</Label>
            <Input
              id="mobile"
              name="mobile"
              value={formData.mobile || ''}
              onChange={handleChange}
              className="col-span-2"
            />
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value as "Active" | "Inactive")}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="payType" className="text-right">Pay Type</Label>
            <Select
              value={formData.payType}
              onValueChange={(value) => handleSelectChange('payType', value as "Fixed" | "Revenue Share")}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select pay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Revenue Share">Revenue Share</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.payType === "Fixed" ? (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="payAmount" className="text-right">Pay Amount</Label>
              <Input
                id="payAmount"
                name="payAmount"
                type="number"
                min="0" 
                value={formData.payAmount || 0}
                onChange={handleNumberChange}
                className="col-span-2"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="payPercentage" className="text-right">Pay Percentage (%)</Label>
              <Input
                id="payPercentage"
                name="payPercentage"
                type="number"
                min="0" 
                value={formData.payPercentage || 0}
                onChange={handleNumberChange}
                className="col-span-2"
              />
            </div>
          )}
          
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="paymentTerms" className="text-right">Payment Terms</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => handleSelectChange('paymentTerms', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="After each batch">After each batch</SelectItem>
                <SelectItem value="Before batch commencement">Before batch commencement</SelectItem>
                <SelectItem value="15 days after batch completion">15 days after batch completion</SelectItem>
                <SelectItem value="30 days after batch completion">30 days after batch completion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="tdsPercentage" className="text-right">TDS Percentage</Label>
            <Input
              id="tdsPercentage"
              name="tdsPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.tdsPercentage ?? 0} // Use ?? 0 to default to 0
              onChange={handleNumberChange}
              className="col-span-2"
              placeholder="e.g. 10"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartnerDialog;
