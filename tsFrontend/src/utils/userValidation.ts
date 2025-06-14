// /var/www/youngachivers-bk/tsFrontend/src/utils/formValidation.ts

import { UserData } from '@/types/user'; // Import the interface


export const validateFormData = (formData: UserData): string[] => {
    const errors: string[] = [];
  
    if (!formData.firstName?.trim()) errors.push("First Name is required.");
    if (!formData.lastName?.trim()) errors.push("Last Name is required.");
    if (!formData.email) {
      errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Invalid email format.");
    }
    if (!formData.phone) {
      errors.push("Phone Number is required.");
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.push("Phone Number must be 10 digits.");
    }
    if (formData.alternateContact && !/^[0-9]{10}$/.test(formData.alternateContact)) {
      errors.push("Alternate Contact must be 10 digits.");
    }
    if (!formData.role) errors.push("Role is required.");
    if (!formData.status) errors.push("Status is required.");
  
    // Basic date validation (YYYY-MM-DD format)
    if (formData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      errors.push("Invalid Date of Birth format. Use YYYY-MM-DD.");
    }
    if (formData.joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.joiningDate)) {
      errors.push("Invalid Joining Date format. Use YYYY-MM-DD.");
    }
  
    // Password matching (only if password is provided)
    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.push("New password and confirm password do not match.");
    }
  
    return errors;
  };
