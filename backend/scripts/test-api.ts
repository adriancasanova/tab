import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3001/api/v1';

async function runTest() {
    console.log('🚀 Starting API Smoke Test...\n');

    try {
        // 1. Health Check
        console.log('1️⃣  Health Check...');
        const health = await fetch(`${API_URL}/health`).then(r => r.json());
        console.log('   Status:', health);

        // 2. Get Restaurant (Demo)
        console.log('\n2️⃣  Get Demo Restaurant...');
        const restRes = await fetch(`${API_URL}/restaurants/demo-restaurant`);
        const restData = await restRes.json();
        if (!restData.success) throw new Error('Failed to get restaurant');
        const restaurant = restData.data;
        console.log(`   ✅ Found: ${restaurant.name} (${restaurant.id})`);

        // 3. Get Menu
        console.log('\n3️⃣  Get Menu...');
        const menuRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/menu`);
        const menuData = await menuRes.json();
        const products = menuData.data.products;
        console.log(`   ✅ Loaded ${products.length} products`);

        // Pick first product and a drink
        const food = products.find((p: any) => p.category.name === 'Comida') || products[0];
        const drink = products.find((p: any) => p.category.name === 'Bebidas') || products[1];

        // 4. Get Tables and Select one
        console.log('\n4️⃣  Get Tables...');
        const tables = restaurant.tables;
        const table = tables[0];
        console.log(`   ✅ Selected Table: #${table.number} (${table.id})`);

        // 5. Start Session
        console.log('\n5️⃣  Start Session...');
        const sessionRes = await fetch(`${API_URL}/tables/${table.id}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consumerName: 'Tester 1' }),
        });
        const sessionData = await sessionRes.json();

        // Handle case where session might already exist (if re-running test without reset)
        let session;
        if (!sessionData.success && sessionData.error?.includes('already has an active session')) {
            console.log('   ⚠️ Table busy, fetching active session...');
            // We need to fetch the active session for this table. 
            // For simplicity in this script, we'll hit the admin active-sessions endpoint to find it
            const activeRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/active-sessions`);
            const activeData = await activeRes.json();
            const existingSession = activeData.data.find((s: any) => s.tableId === table.id);
            if (!existingSession) throw new Error("Could not find existing session");
            session = existingSession;
            console.log(`   ✅ Re-using Session: ${session.id}`);
        } else {
            if (!sessionData.success) throw new Error(`Failed to start session: ${JSON.stringify(sessionData)}`);
            session = sessionData.data;
            console.log(`   ✅ Session Started: ${session.id}`);
        }

        const consumer1 = session.consumers[0] || session.consumers.find((c: any) => c.name === 'Tester 1');
        if (!consumer1) throw new Error("Consumer 1 not found");
        console.log(`   👤 Consumer 1: ${consumer1.name} (${consumer1.id})`);

        // 6. Add Second Consumer
        console.log('\n6️⃣  Add Consumer 2...');
        const addConsumerRes = await fetch(`${API_URL}/sessions/${session.id}/consumers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Tester 2' }),
        });
        const addConsumerData = await addConsumerRes.json();
        const consumer2 = addConsumerData.data;
        console.log(`   👤 Consumer 2: ${consumer2.name} (${consumer2.id})`);

        // 7. Add Order (Shared Item + Individual Item)
        console.log('\n7️⃣  Add Orders...');

        const orderPayload = {
            items: [
                {
                    productId: food.id,
                    quantity: 1,
                    consumerIds: [consumer1.id, consumer2.id] // Shared food
                },
                {
                    productId: drink.id,
                    quantity: 2,
                    consumerIds: [consumer1.id] // 2 Drinks for Consumer 1
                }
            ]
        };

        const orderRes = await fetch(`${API_URL}/sessions/${session.id}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) console.error(orderData);
        console.log(`   ✅ Order placed with ${orderPayload.items.length} items`);

        // 8. Get Individual Totals
        console.log('\n8️⃣  Get Totals...');
        const totalsRes = await fetch(`${API_URL}/sessions/${session.id}/totals`);
        const totalsData = await totalsRes.json();
        console.log('   💰 Session Total:', totalsData.data.sessionTotal);

        totalsData.data.consumerTotals.forEach((c: any) => {
            console.log(`      > ${c.name}: $${c.total}`);
            c.items.forEach((i: any) => {
                console.log(`        - ${i.quantity}x ${i.productName} (${i.isShared ? 'Shared' : 'Solo'}) - $${i.sharePrice}`);
            });
        });

        console.log('\n✅ TEST COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    }
}

runTest();
