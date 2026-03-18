import { supabase } from '../supabase';
import type { Report } from '../../types/report';

export async function fetchReports(): Promise<Report[]> {
  try {
    let allReports: any[] = [];
    const pageSize = 1000;
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        allReports = [...allReports, ...data];
        hasMore = data.length === pageSize;
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    return allReports as Report[];
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    throw error;
  }
}

export async function createReport(report: Omit<Report, 'id' | 'created_at'>): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Authentication required');

    const { error } = await supabase
      .from('reports')
      .insert([{
        ...report,
        user_id: user.id
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to create report:', error);
    throw error;
  }
}