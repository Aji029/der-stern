import { format } from 'date-fns';
import type { Order } from '../types/order';
import type { SammelrechnungWithDetails } from '../types/sammelrechnung';

let lastInvoiceNumber = 0;

export function generateCustomInvoiceNumber(order: Order): string {
  // Generate date part in YYYYMMDD format
  const datePart = format(order.orderDate, 'yyyyMMdd');
  
  // Increment the counter
  lastInvoiceNumber++;
  
  // Format the number with leading zeros (4 digits)
  const numberPart = lastInvoiceNumber.toString().padStart(4, '0');
  
  // Combine date and number
  return `${datePart}-${numberPart}`;
}

export function generateSammelrechnungNumber(sammelrechnung: SammelrechnungWithDetails): string {
  try {
    // Ensure we have a valid date by using current date as fallback
    const date = sammelrechnung.createdAt ? new Date(sammelrechnung.createdAt) : new Date();
    const datePart = format(date, 'yyyyMMdd');
    
    // Extract the sequence number from the original number (last 4 digits)
    // If no number exists, use a fallback
    const numberPart = sammelrechnung.number ? 
      sammelrechnung.number.slice(-4) : 
      '0000';
    
    // Combine date and number
    return `${datePart}-${numberPart}`;
  } catch (error) {
    console.error('Error generating Sammelrechnung number:', error);
    // Fallback to current date and zeros if there's an error
    return `${format(new Date(), 'yyyyMMdd')}-0000`;
  }
}

export function generateDeliveryNoteNumber(order: Order): string {
  // Generate date part in YYYYMMDD format
  const datePart = format(order.orderDate, 'yyyyMMdd');
  
  // Use a different prefix for delivery notes
  const prefix = 'L';
  
  // Format the number with leading zeros (4 digits)
  const numberPart = lastInvoiceNumber.toString().padStart(4, '0');
  
  // Combine prefix, date and number
  return `${prefix}${datePart}-${numberPart}`;
}