
import { toast } from 'react-toastify';

export const handleError = (error, customMessage = null) => {
  console.error('Error:', error);
  
  let message = customMessage;
  
  if (!message) {
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'Something went wrong. Please try again.';
    }
  }
  
  toast.error(message);
  return message;
};

export const handleSuccess = (message) => {
  toast.success(message);
};

export const handleWarning = (message) => {
  toast.warning(message);
};

export const handleInfo = (message) => {
  toast.info(message);
};
