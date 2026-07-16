// lib/categoryService.ts
import { Category, CategoryResponse } from '@/types/category';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data: CategoryResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// lib/categoryService.ts
export async function fetchActiveCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/active`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active categories: ${response.status}`);
    }

    const data: CategoryResponse = await response.json();
    const categories = data.data || [];
    
    // REMOVE THE .reverse() LINE
    // return categories.reverse();
    
    // Just return categories as they come from API
    return categories;
  } catch (error) {
    console.error('Error fetching active categories:', error);
    return [];
  }
}
// lib/categoryService.ts - Add this function
export async function getCategoryBySlug(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/slug/${slug}`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
} 