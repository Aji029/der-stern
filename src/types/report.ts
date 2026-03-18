export interface Report {
  id: string;
  type: 'Sales' | 'Inventory' | 'Customer';
  data: any;
  date_range_start: Date;
  date_range_end: Date;
  created_at: Date;
}