
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: {
                _count: {
                    select: { products: true, categories: true, tables: true }
                }
            }
        });

        console.log('RESTAURANTS IN DB:');
        restaurants.forEach(r => {
            console.log(`- ID: ${r.id}, Name: ${r.name}, Slug: ${r.slug}`);
            console.log(`  Counts: Products: ${r._count.products}, Categories: ${r._count.categories}, Tables: ${r._count.tables}`);
        });

        const allProducts = await prisma.product.findMany({ take: 5 });
        console.log('\nSAMPLE PRODUCTS:');
        allProducts.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.name}, RestaurantID: ${p.restaurantId}`);
        });

    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
