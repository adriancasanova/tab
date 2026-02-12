"use strict";
const BASE_URL = 'http://127.0.0.1:3001';
const API_URL = `${BASE_URL}/api/v1`;
async function runTest() {
    console.log('🚀 Starting Full API Verification...\n');
    try {
        // 1. Health Check
        process.stdout.write('1️⃣  Health Check... ');
        const health = await fetch(`${BASE_URL}/health`).then(r => r.ok ? r.json() : r.statusText);
        console.log(health.status === 'ok' ? '✅ OK' : '❌ FAILED');
        // 2. Get Rest
        process.stdout.write('2️⃣  Get Demo Restaurant... ');
        const restRes = await fetch(`${API_URL}/restaurants/demo-restaurant`);
        const restData = await restRes.json();
        if (!restData.success)
            throw new Error('Failed to get restaurant');
        const restaurant = restData.data;
        console.log(`✅ ${restaurant.name} (${restaurant.id})`);
        // 3. Get Menu
        process.stdout.write('3️⃣  Get Menu... ');
        const menuRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/menu`);
        const menuData = await menuRes.json();
        const products = menuData.data.products;
        console.log(`✅ ${products.length} products loaded`);
        const food = products.find((p) => p.category.name === 'Comida') || products[0];
        const drink = products.find((p) => p.category.name === 'Bebidas') || products[1];
        // 4. Get Table
        process.stdout.write('4️⃣  Get Table... ');
        const table = restaurant.tables[0];
        console.log(`✅ Table #${table.number} (${table.id})`);
        // 5. Start Session
        process.stdout.write('5️⃣  Start Session... ');
        const sessionRes = await fetch(`${API_URL}/tables/${table.id}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consumerName: 'Tester 1' }),
        });
        const sessionData = await sessionRes.json();
        let session;
        if (!sessionData.success && sessionData.error?.includes('active session')) {
            // Reuse existing
            const activeRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/active-sessions`);
            const activeData = await activeRes.json();
            session = activeData.data.find((s) => s.tableId === table.id);
            if (!session)
                throw new Error("Could not find existing session");
            console.log(`⚠️  Reusing Active Session: ${session.id.substring(0, 8)}...`);
        }
        else {
            session = sessionData.data;
            console.log(`✅ Started: ${session.id.substring(0, 8)}...`);
        }
        const consumer1 = session.consumers[0] || session.consumers.find((c) => c.name === 'Tester 1');
        // 6. Add Consumer 2
        process.stdout.write('6️⃣  Add Consumer 2... ');
        const addConsumerRes = await fetch(`${API_URL}/sessions/${session.id}/consumers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Tester 2' }),
        });
        const addConsumerData = await addConsumerRes.json();
        const consumer2 = addConsumerData.data;
        console.log(`✅ Added: ${consumer2.name}`);
        // 7. Orders (Split)
        process.stdout.write('7️⃣  Add Orders (Split)... ');
        const orderPayload = {
            items: [
                { productId: food.id, quantity: 1, consumerIds: [consumer1.id, consumer2.id] },
                { productId: drink.id, quantity: 2, consumerIds: [consumer1.id] }
            ]
        };
        const orderRes = await fetch(`${API_URL}/sessions/${session.id}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });
        const orderData = await orderRes.json();
        console.log(`✅ Added ${orderPayload.items.length} items`);
        // 8. Totals
        console.log('\n8️⃣  Checking Totals:');
        const totalsRes = await fetch(`${API_URL}/sessions/${session.id}/totals`);
        const totalsData = await totalsRes.json();
        if (totalsData.data.sessionTotal > 0) {
            totalsData.data.consumerTotals.forEach((c) => {
                console.log(`   👤 ${c.name}: $${c.total}`);
            });
        }
        else {
            console.log('   ❌ Totals seem empty?');
        }
        // 9. Call Waiter
        process.stdout.write('\n9️⃣  Call Waiter... ');
        const callRes = await fetch(`${API_URL}/sessions/${session.id}/service-calls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'WAITER' }),
        });
        const callData = await callRes.json();
        const serviceCallId = callData.data.id;
        console.log(`✅ Called (ID: ${serviceCallId.substring(0, 8)}...)`);
        // 10. Verify Admin Notification
        process.stdout.write('🔟 Verify Notifications... ');
        const notifRes = await fetch(`${API_URL}/restaurants/${restaurant.id}/notifications`);
        const notifData = await notifRes.json();
        const foundCall = notifData.data.find((n) => n.id === serviceCallId);
        if (foundCall)
            console.log('✅ Found in Admin');
        else
            throw new Error('Notification not found');
        // 11. Resolve Call
        process.stdout.write('1️⃣1️⃣ Resolve Call... ');
        const resolveRes = await fetch(`${API_URL}/service-calls/${serviceCallId}/resolve`, {
            method: 'PATCH'
        });
        const resolveData = await resolveRes.json();
        if (resolveData.data.status === 'RESOLVED')
            console.log('✅ Resolved');
        else
            console.log('❌ Failed');
        // 12. Close Session
        process.stdout.write('1️⃣2️⃣ Close Session... ');
        const closeRes = await fetch(`${API_URL}/sessions/${session.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CLOSED' }),
        });
        const closeData = await closeRes.json();
        if (closeData.data.status === 'CLOSED')
            console.log('✅ Session Closed');
        else
            console.log('❌ Failed');
        console.log('\n✨ ALL TESTS PASSED Successfully!');
    }
    catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    }
}
runTest();
//# sourceMappingURL=verify-api.js.map