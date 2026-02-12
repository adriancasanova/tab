import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create test users
    const passwordHash = await bcrypt.hash('demo123', 12);
    const trialPasswordHash = await bcrypt.hash('trial123', 12);

    // Active user (full access)
    const activeUser = await prisma.user.upsert({
        where: { email: 'demo@gastrosplit.com' },
        update: {},
        create: {
            email: 'demo@gastrosplit.com',
            passwordHash: passwordHash,
            status: 'ACTIVE',
            role: 'OWNER',
            firstName: 'Demo',
            lastName: 'User',
            businessName: 'Demo Business',
        },
    });
    console.log(`✅ Active user created: ${activeUser.email}`);

    // Trial user (limited time)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15); // 15 days trial

    const trialUser = await prisma.user.upsert({
        where: { email: 'trial@gastrosplit.com' },
        update: {},
        create: {
            email: 'trial@gastrosplit.com',
            passwordHash: trialPasswordHash,
            status: 'TRIAL',
            role: 'OWNER',
            firstName: 'Trial',
            lastName: 'User',
            businessName: 'Trial Business',
            trialEndsAt: trialEndsAt,
        },
    });
    console.log(`✅ Trial user created: ${trialUser.email}`);

    // Create a demo restaurant (owned by active user)
    const restaurant = await prisma.restaurant.upsert({
        where: { slug: 'demo-restaurant' },
        update: { ownerId: activeUser.id },
        create: {
            name: 'GastroSplit Demo',
            slug: 'demo-restaurant',
            timezone: 'America/Argentina/Buenos_Aires',
            ownerId: activeUser.id,
        },
    });

    console.log(`✅ Restaurant created: ${restaurant.name}`);

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { id: 'cat-entradas' },
            update: {},
            create: {
                id: 'cat-entradas',
                restaurantId: restaurant.id,
                name: 'Entradas',
                displayOrder: 1,
                imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80',
            },
        }),
        prisma.category.upsert({
            where: { id: 'cat-comida' },
            update: {},
            create: {
                id: 'cat-comida',
                restaurantId: restaurant.id,
                name: 'Comida',
                displayOrder: 2,
                imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
            },
        }),
        prisma.category.upsert({
            where: { id: 'cat-bebidas' },
            update: {},
            create: {
                id: 'cat-bebidas',
                restaurantId: restaurant.id,
                name: 'Bebidas',
                displayOrder: 3,
                imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
            },
        }),
        prisma.category.upsert({
            where: { id: 'cat-postres' },
            update: {},
            create: {
                id: 'cat-postres',
                restaurantId: restaurant.id,
                name: 'Postres',
                displayOrder: 4,
                imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
            },
        }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create products
    const products = [
        {
            id: 'prod-1',
            categoryId: 'cat-comida',
            name: 'Pizza Margherita',
            description: 'Tomate, mozzarella, albahaca fresca.',
            price: 12000,
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
        },
        {
            id: 'prod-2',
            categoryId: 'cat-comida',
            name: 'Salmón Rosado',
            description: 'Grillado con vegetales de estación.',
            price: 25000,
            imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80',
        },
        {
            id: 'prod-3',
            categoryId: 'cat-bebidas',
            name: 'Cerveza IPA',
            description: 'Artesanal, lupulada y refrescante.',
            price: 5000,
            imageUrl: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=500&q=80',
        },
        {
            id: 'prod-4',
            categoryId: 'cat-postres',
            name: 'Tiramisú',
            description: 'Clásico postre italiano.',
            price: 6500,
            imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80',
        },
        {
            id: 'prod-5',
            categoryId: 'cat-bebidas',
            name: 'Agua Mineral',
            description: 'Con o sin gas, 500ml.',
            price: 2000,
            imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=500&q=80',
        },
        {
            id: 'prod-6',
            categoryId: 'cat-entradas',
            name: 'Ensalada César',
            description: 'Lechuga, pollo, parmesano, croutones.',
            price: 9500,
            imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80',
        },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { id: product.id },
            update: {},
            create: {
                ...product,
                restaurantId: restaurant.id,
            },
        });
    }

    console.log(`✅ Created ${products.length} products`);

    // Create tables 1-10
    for (let i = 1; i <= 10; i++) {
        const tableId = `table-${i}`;
        await prisma.table.upsert({
            where: { id: tableId },
            update: {},
            create: {
                id: tableId,
                restaurantId: restaurant.id,
                number: String(i),
                isEnabled: true,
            },
        });
    }

    console.log('✅ Created 10 tables');

    console.log('🎉 Seeding complete!');
    console.log(`\n📍 Restaurant ID: ${restaurant.id}`);
    console.log(`📍 Restaurant Slug: ${restaurant.slug}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
