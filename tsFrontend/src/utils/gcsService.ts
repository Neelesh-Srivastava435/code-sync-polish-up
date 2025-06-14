import api from '@/api/axios';

/**
 * Uploads a file to GCS via backend API and returns its public URL.
 */
export const uploadToGCS = async (file: File, folder: string = 'uploads'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Uploads profile image to GCS
 */
export const uploadProfileImage = async (file: File): Promise<string> => {
  return uploadToGCS(file, 'profiles');
};

/**
 * Processes CSV file and returns parsed data
 */
export const processCsvFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        console.log('CSV Headers:', headers);
        const requiredHeaders = ['firstname', 'email', 'phone', 'role'];
        
        // Validate headers
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
          return;
        }
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= headers.length) {
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            // Validate required fields
            if (row.firstname && row.email && row.phone) {
              data.push(row);
            }
          }
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};