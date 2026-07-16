import { fetchActiveCategories } from '@/lib/categoryService';
import { getAllProducts } from '@/lib/productService';
import HeaderClient from './HeaderClient';

interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default async function HeaderWrapper() {
  let categoriesWithProducts: Category[] = [];
  
  try {
    // Fetch all active categories
    const allCategories = await fetchActiveCategories();
    
    // Filter categories that have products (server-side)
    const categoriesWithProductsList: Category[] = [];
    
    for (const category of allCategories) {
      try {
        const response = await getAllProducts({ category: category._id });
        if (response.data && response.data.length > 0) {
          categoriesWithProductsList.push(category);
        }
      } catch (error) {
        console.error(`Error checking products for category ${category.name}:`, error);
        // Include category even if check fails to prevent empty header
        categoriesWithProductsList.push(category);
      }
    }
    
    categoriesWithProducts = categoriesWithProductsList;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
  
  return <HeaderClient initialCategories={categoriesWithProducts} />;
}