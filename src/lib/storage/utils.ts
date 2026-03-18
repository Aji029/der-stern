export const getStorageData = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    // Parse the data and handle date conversion
    const parsedData = JSON.parse(data, (key, value) => {
      // Convert date strings back to Date objects
      if (key === 'orderDate' || key === 'deliveryDate') {
        return value ? new Date(value) : null;
      }
      return value;
    });
    
    return parsedData;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
};