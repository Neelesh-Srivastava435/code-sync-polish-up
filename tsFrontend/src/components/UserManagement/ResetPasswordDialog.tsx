import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from '@/hooks/reduxHooks/hooks';
import { resetUserPassword } from '@/store/user/userSlice';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react'; // Added Eye and EyeOff icons

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (formData.password !== formData.password_confirmation) {
      toast({
        title: "Error",
        description: "New Password and Confirm Password do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dispatch(resetUserPassword({
        userId: user.id,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      })).unwrap();
      
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      
      setFormData({ password: '', password_confirmation: '' });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ password: '', password_confirmation: '' });
    setShowPassword(false); // Reset visibility state on close
    setShowConfirmPassword(false); // Reset visibility state on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Reset password for: <strong>{user.firstName} {user.lastName}</strong> ({user.email})
              </p>
            </div>
            
            <div className="relative">
              <Label htmlFor="password" className="mb-1 block p-2">New Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter new password"
                required
                minLength={8}
                className="pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="relative">
              <Label htmlFor="password_confirmation" className="mb-1 block p-2">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.password_confirmation}
                onChange={(e) => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                placeholder="Confirm new password"
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
