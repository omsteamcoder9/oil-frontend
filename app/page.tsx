import { fetchActiveCategories } from '@/lib/categoryService';
import HomeClient from '@/components/home/HomeClient';

// ✅ SERVER COMPONENT - Home Page
export default async function HomePage() {
  const categories = await fetchActiveCategories();
  const featuredCategories = categories.slice(0, 3);

  return (
    <HomeClient 
      categories={categories}
    />
  );
}