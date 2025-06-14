
import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { processCsvFile, isValidEmail, isValidPhone } from '@/utils/gcsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppDispatch } from '@/hooks/reduxHooks/hooks';
import { bulkImportUsers } from '@/store/user/userSlice';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CsvUser {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string; // Made role required as per backend
  status: string; // Made status required
  date_of_birth?: string;
  employee_code?: string;
  joining_date?: string;
  alternate_contact?: string;
  address?: string;
  password?: string;
}

interface ValidationError {
  row: number;
  rowIndex: number; // 0-based index for easier data access
  field: string;
  message: string;
}

const ImportUsersDialog: React.FC<ImportUsersDialogProps> = ({ open, onOpenChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CsvUser[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'success'>('select');
  const validRoles = ['Admin', 'Account Manager', 'Facility Manager'];
  const validStatuses = ['Active', 'Inactive', 'Pending'];
  const isValidDate = (dateString: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(dateString);

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setIsProcessing(true);
      
      try {
        const data = await processCsvFile(file);
        const errors: ValidationError[] = [];
        
        // Validate each row
        data.forEach((row, index) => {
          const rowIndex = index; // 0-based index
          const rowNum = index + 1; // 1-based for user messages

          // First Name
          if (!row.firstname || row.firstname.trim().length === 0) {
            errors.push({ row: rowNum, rowIndex, field: 'firstname', message: 'First name is required.' });
          } else if (row.firstname.length < 2) {
            errors.push({ row: rowNum, rowIndex, field: 'firstname', message: 'First name must be at least 2 characters.' });
          } else if (row.firstname.length > 50) {
            errors.push({ row: rowNum, rowIndex, field: 'firstname', message: 'First name cannot exceed 50 characters.' });
          }

          // Last Name
          if (row.lastname && row.lastname.length > 50) {
            errors.push({ row: rowNum, rowIndex, field: 'lastname', message: 'Last name cannot exceed 50 characters.' });
          }

          // Email
          if (!isValidEmail(row.email)) {
            errors.push({ row: rowNum, rowIndex, field: 'email', message: 'Invalid email format.' });
          }

          // Phone
          if (row.phone && !isValidPhone(row.phone)) {
            errors.push({ row: rowNum, rowIndex, field: 'phone', message: 'Invalid phone number format (must be 10 digits).' });
          }

          // Role
          if (!row.role || !validRoles.map(r => r.toLowerCase()).includes(row.role.toLowerCase())) {
            errors.push({ row: rowNum, rowIndex, field: 'role', message: `Invalid role. Must be one of: ${validRoles.join(', ')}.` });
          }

          // Status
          if (!row.status || !validStatuses.map(s => s.toLowerCase()).includes(row.status.toLowerCase())) {
            errors.push({ row: rowNum, rowIndex, field: 'status', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
          }

          // Date of Birth
          if (row.date_of_birth && !isValidDate(row.date_of_birth)) {
            errors.push({ row: rowNum, rowIndex, field: 'date_of_birth', message: 'Invalid Date of Birth format. Use YYYY-MM-DD.' });
          }

          // Employee Code
          if (row.employee_code && row.employee_code.length > 20) {
            errors.push({ row: rowNum, rowIndex, field: 'employee_code', message: 'Employee code cannot exceed 20 characters.' });
          }

          // Joining Date
          if (row.joining_date && !isValidDate(row.joining_date)) {
            errors.push({ row: rowNum, rowIndex, field: 'joining_date', message: 'Invalid Joining Date format. Use YYYY-MM-DD.' });
          }

          // Alternate Contact
          if (row.alternate_contact && !isValidPhone(row.alternate_contact)) {
            errors.push({ row: rowNum, rowIndex, field: 'alternate_contact', message: 'Invalid alternate contact format (must be 10 digits).' });
          }

          // Password
          if (row.password && row.password.length < 8) {
            errors.push({ row: rowNum, rowIndex, field: 'password', message: 'Password must be at least 8 characters.' });
          }
        });
        
        // Normalize data for backend (e.g., role and status to correct casing if needed, or ensure null for optional empty fields)
        const normalizedData = data.map(row => ({
          ...row,
          role: row.role ? validRoles.find(r => r.toLowerCase() === row.role.toLowerCase()) || row.role : '', // Keep original if not found for error display
          status: row.status ? validStatuses.find(s => s.toLowerCase() === row.status.toLowerCase()) || row.status : '', // Keep original
          lastname: row.lastname || undefined, // Send undefined if empty for optional fields
          phone: row.phone || undefined,
          date_of_birth: row.date_of_birth || undefined,
          employee_code: row.employee_code || undefined,
          joining_date: row.joining_date || undefined,
          alternate_contact: row.alternate_contact || undefined,
          address: row.address || undefined,
          password: row.password || undefined,
        }));

        setParsedData(normalizedData);
        setValidationErrors(errors);
        setStep('preview');
        
        if (errors.length === 0) {
          toast({
            title: "File Processed Successfully",
            description: `${data.length} users ready for import`,
          });
        } else {
          toast({
            title: "Validation Issues Found",
            description: `${errors.length} issues need to be fixed`,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process CSV file",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handleDownloadSample = () => {
    const csvContent = 
      "firstname,lastname,email,phone,role,status,date_of_birth,employee_code,joining_date,alternate_contact,address,password\n" +
      "John,Doe,john.doe@example.com,1234567890,Admin,Active,1990-01-01,EMP001,2023-01-01,0987654321,123 Main St,password123\n" +
      "Jane,Smith,jane.smith@example.com,1122334455,Account Manager,Active,,,,,,,\n" +
      "Bob,,bob.johnson@example.com,,Facility Manager,Pending,,,,,,securepassword";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors first",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // Prepare data for backend: ensure status is lowercase, and optional fields are null if empty
    const dataToSubmit = parsedData.map(user => ({
      first_name: user.firstname,
      last_name: user.lastname || null,
      email: user.email,
      phone: user.phone || null,
      role: user.role, // Assuming backend handles casing or frontend already normalized
      status: user.status.toLowerCase(), // Backend expects lowercase
      date_of_birth: user.date_of_birth || null,
      employee_code: user.employee_code || null,
      joining_date: user.joining_date || null,
      alternate_contact: user.alternate_contact || null,
      address: user.address || null,
      password: user.password || null, // Send null if password is not provided
    }));
    try {
      await dispatch(bulkImportUsers({ users: dataToSubmit })).unwrap();
      toast({
        title: "Import Successful",
        description: `Successfully imported ${parsedData.length} users`,
      });
      
      setStep('success');
      
      // Refresh parent component if needed
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error: any) {
      const rawErrors = error?.response?.data?.errors;
      const errorMessages: string[] = [];

      if (rawErrors && typeof rawErrors === 'object') {
        for (const key in rawErrors) {
          const fieldErrors = rawErrors[key]; // e.g., ["The users.2.email has already been taken."]
          const match = key.match(/users\.(\d+)\.(\w+)/);

          if (match && Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            const rowNum = parseInt(match[1]) + 1; // 1-based index

            // Remove just `users.N.` from the error message string
            const rawMessage = fieldErrors[0];
            const cleanMessage = rawMessage.replace(/users\.\d+\./, '');

            errorMessages.push(`Row ${rowNum} – ${cleanMessage}`);
          }
        }
      }

      toast({
        title: "Import Failed",
        description: (
          <ul className="list-disc pl-4">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        ),
        variant: "destructive",
        duration: Infinity,
      });

  } finally {
    setIsUploading(false);
  }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setStep('select');
    onOpenChange(false);
  };
  
  const renderSelectStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium">Download Sample CSV</h3>
        <p className="text-gray-500">
          Download a sample CSV file with the correct format for importing users.
        </p>
        <Button 
          variant="outline" 
          onClick={handleDownloadSample}
          className="gap-2"
        >
          <Download size={18} />
          Download Sample CSV
        </Button>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium">Upload User CSV</h3>
        <p className="text-gray-500">
          Required columns: firstname, email, role, status.
          <br/>
          Optional: lastname, phone, date_of_birth, employee_code, joining_date, alternate_contact, address, password.
          Valid roles include: Admin, Account Manager, Facility Manager.
        </p>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-white hover:border-purple-400 transition-colors">
            <span className="text-gray-500 truncate">
              {selectedFile ? selectedFile.name : 'Choose CSV file...'}
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
              {isProcessing ? 'Processing...' : 'Browse'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
  
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Preview Import Data</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('select')}>
            Back
          </Button>
          <Button 
            onClick={handleImport}
            disabled={validationErrors.length > 0 || isUploading}
            className="gap-2"
          >
            {isUploading ? 'Importing...' : 'Import Users'}
          </Button>
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-red-800 font-medium mb-2">Validation Errors:</h4>
          <ul className="space-y-1">
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                Row {error.row}: {error.field} - {error.message}
              </li>
            ))}
            {validationErrors.length > 5 && (
              <li className="text-sm text-red-700">
                ... and {validationErrors.length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="border rounded-md max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Emp. Code</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Alt. Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Password</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedData.slice(0, 10).map((user, index) => { // Show first 10 rows in preview
              const hasError = validationErrors.some(e => e.row === index + 1);
              return (
                <TableRow key={index} className={hasError ? 'bg-red-50' : ''}>
                  <TableCell>{user.firstname}</TableCell>
                  <TableCell>{user.lastname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{user.date_of_birth}</TableCell>
                  <TableCell>{user.employee_code}</TableCell>
                  <TableCell>{user.joining_date}</TableCell>
                  <TableCell>{user.alternate_contact}</TableCell>
                  <TableCell>{user.address}</TableCell>
                  <TableCell>{user.password ? '********' : ''}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {parsedData.length > 10 && (
          <div className="p-2 text-center text-sm text-gray-500">
            ... and {parsedData.length - 10} more rows
          </div>
        )}
      </div>
    </div>
  );
  
  const renderSuccessStep = () => (
    <div className="text-center space-y-4 py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-medium">Import Successful!</h3>
      <p className="text-gray-500">
        Successfully imported {parsedData.length} users
      </p>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-2">
          {step !== 'select' && step !== 'success' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setStep('select')}
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <DialogTitle className="text-xl">
            Import Users from CSV
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {step === 'select' && renderSelectStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
        
        <div className="flex justify-end border-t pt-4 mt-6">
          <Button variant="outline" onClick={handleClose}>
            {step === 'success' ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;