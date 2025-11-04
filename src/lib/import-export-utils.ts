import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'https://cod-ecommerce-two.vercel.app/api/adminb/bulk';

export interface ImportExportConfig {
  entityType: 'employees' | 'sellers' | 'warehouse' | 'payout' | 'delivery';
  displayName: string;
}

export const ENTITY_CONFIGS: Record<string, ImportExportConfig> = {
  employees: { entityType: 'employees', displayName: 'Employees' },
  sellers: { entityType: 'sellers', displayName: 'Sellers' },
  warehouse: { entityType: 'warehouse', displayName: 'Warehouse Managers' },
  payout: { entityType: 'payout', displayName: 'Payout Managers' },
  delivery: { entityType: 'delivery', displayName: 'Delivery Agents' },
};

export const handleImport = async (
  file: File,
  entityType: string,
  onSuccess?: () => void
): Promise<void> => {
  try {
    const config = ENTITY_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    toast.loading(`Importing ${config.displayName}...`, { id: 'import' });

    const response = await axios.post(
      `${BASE_URL}/${config.entityType}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success(
      `Successfully imported ${config.displayName}! ${response.data?.message || ''}`,
      { id: 'import' }
    );

    if (onSuccess) {
      onSuccess();
    }
  } catch (error: any) {
    console.error('Import error:', error);
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      `Failed to import ${ENTITY_CONFIGS[entityType]?.displayName || entityType}`;
    
    toast.error(errorMessage, { id: 'import' });
    throw error;
  }
};

export const handleExport = async (
  entityType: string,
  onSuccess?: () => void
): Promise<void> => {
  try {
    const config = ENTITY_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    toast.loading(`Exporting ${config.displayName}...`, { id: 'export' });

    const response = await axios.get(
      `${BASE_URL}/${config.entityType}/export/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${config.displayName}_export_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success(`Successfully exported ${config.displayName}!`, { id: 'export' });

    if (onSuccess) {
      onSuccess();
    }
  } catch (error: any) {
    console.error('Export error:', error);
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      `Failed to export ${ENTITY_CONFIGS[entityType]?.displayName || entityType}`;
    
    toast.error(errorMessage, { id: 'export' });
    throw error;
  }
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid Excel file (.xlsx, .xls) or CSV file',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB',
    };
  }

  return { isValid: true };
};
