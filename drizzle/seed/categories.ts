import { db } from '../../src/config/db.js';
import { Categories } from '../../src/schema/Categories.js';
import { eq } from 'drizzle-orm';

const categoryData = [
  { name: 'Textbooks', description: 'Buy and sell textbooks used in your university courses.' },
  { name: 'Electronics', description: 'Laptops, phones, and other electronics.' },
  { name: 'Clothing & Accessories', description: 'Apparel, shoes, and fashion accessories.' },
  { name: 'Room Rentals', description: 'Find or list rooms for rent near the campus.' },
  { name: 'Furniture', description: 'Desks, chairs, shelves, and other dorm/home furniture.' },
  { name: 'Lost & Found', description: 'Post or browse items that are lost or found on campus.' },
  { name: 'Event Tickets', description: 'Sell or buy tickets for university events.' },
  { name: 'Tutoring & Services', description: 'Offer or find tutoring, design, resume help, etc.' },
  { name: 'Bikes & Transport', description: 'Bicycles, scooters, and other transportation.' },
  { name: 'Sports Equipment', description: 'Equipment and gear for various sports.' },
  { name: 'Club Merchandise', description: 'Merch from university clubs and societies.' },
  { name: 'Miscellaneous', description: 'Everything else that doesn’t fit a specific category.' },
];

async function seedCategories() {
  for (const category of categoryData) {
    const exists = await db.select().from(Categories).where(eq(Categories.name, category.name));

    if (exists.length === 0) {
      await db.insert(Categories).values(category);
    }
  }

  console.log('✅ Categories seeded');
}

seedCategories().catch((err) => {
  console.error('❌ Failed to seed categories:', err);
});
