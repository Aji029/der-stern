import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/category';

interface CategoryContextType {
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProductsToCategory: (categoryId: string, productIds: string[]) => Promise<void>;
  removeProductFromCategory: (categoryId: string, productId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map database fields to our Category type
      const mappedCategories: Category[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        productIds: item.product_ids || [], // Ensure we have an empty array if null
        createdAt: new Date(item.created_at)
      }));

      setCategories(mappedCategories);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('Authentication required');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name,
          product_ids: [],
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addProductsToCategory = async (categoryId: string, productIds: string[]) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) throw new Error('Category not found');

      const updatedProductIds = [...new Set([...category.productIds, ...productIds])];

      const { error } = await supabase
        .from('categories')
        .update({ product_ids: updatedProductIds })
        .eq('id', categoryId);

      if (error) throw error;
      
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const removeProductFromCategory = async (categoryId: string, productId: string) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) throw new Error('Category not found');

      const updatedProductIds = category.productIds.filter(id => id !== productId);

      const { error } = await supabase
        .from('categories')
        .update({ product_ids: updatedProductIds })
        .eq('id', categoryId);

      if (error) throw error;
      
      await loadCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      addCategory,
      deleteCategory,
      addProductsToCategory,
      removeProductFromCategory,
      isLoading,
      error,
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}