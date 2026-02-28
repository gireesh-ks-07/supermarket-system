const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function sync() {
    const remoteUrl = "postgresql://postgres.dfnbjihmyhrjnvbospwt:Sreehari@12345@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
    const localUrl = "postgresql://postgres@localhost:5432/supermarket_local";

    const remotePrisma = new PrismaClient({ datasources: { db: { url: remoteUrl } } });
    const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });

    try {
        console.log('Fetching remote data...');
        const models = ['Supermarket', 'User', 'Supplier', 'Product', 'ProductBatch', 'Customer', 'Sale', 'SaleItem', 'Purchase', 'PurchaseItem', 'Expense', 'Payment', 'Notification'];
        const allData = {};
        for (const model of models) {
            try {
                allData[model] = await remotePrisma.$queryRawUnsafe(`SELECT * FROM "${model}"`);
                console.log(`- Fetched ${allData[model].length} ${model}s`);
            } catch (err) {
                console.log(`- Skipping ${model} (might not exist): ${err.message}`);
                allData[model] = [];
            }
        }

        console.log('Cleaning local DB...');
        const tables = ['SaleItem', 'Notification', 'Payment', 'Sale', 'PurchaseItem', 'ProductBatch', 'Purchase', 'Product', 'Expense', 'Supplier', 'Customer', 'User', 'Supermarket'];
        for (const table of tables) {
            const modelName = table[0].toLowerCase() + table.slice(1);
            if (localPrisma[modelName]) {
                await localPrisma[modelName].deleteMany();
            }
        }

        console.log('Importing...');
        for (const item of allData.Supermarket) await localPrisma.supermarket.create({ data: item });
        for (const item of allData.User) await localPrisma.user.create({ data: item });
        for (const item of allData.Supplier) await localPrisma.supplier.create({ data: item });
        for (const item of allData.Customer) await localPrisma.customer.create({ data: item });
        for (const item of allData.Product) await localPrisma.product.create({ data: item });
        for (const item of allData.Purchase) await localPrisma.purchase.create({ data: item });
        for (const item of allData.PurchaseItem) await localPrisma.purchaseItem.create({ data: item });

        for (const item of allData.ProductBatch) {
            const { costPrice, sellingPrice, ...rest } = item;
            await localPrisma.productBatch.create({ data: { ...rest, costPrice: item.costPrice || null, sellingPrice: item.sellingPrice || null } });
        }

        for (const item of allData.Sale) await localPrisma.sale.create({ data: item });

        console.log(`Importing ${allData.SaleItem.length} SaleItems...`);
        let count = 0;
        for (const item of allData.SaleItem) {
            try {
                const { batchId, costPrice, ...rest } = item;
                await localPrisma.saleItem.create({
                    data: {
                        ...rest,
                        batchId: item.batchId || null,
                        costPrice: item.costPrice || null
                    }
                });
                count++;
            } catch (err) {
                // Usually silences or logs first few
            }
        }
        console.log(`Successfully imported ${count} SaleItems.`);

        for (const item of allData.Expense) await localPrisma.expense.create({ data: item });
        for (const item of allData.Payment) await localPrisma.payment.create({ data: item });
        for (const item of allData.Notification) await localPrisma.notification.create({ data: item });

        console.log('Sync completed successfully!');
    } catch (e) {
        console.error('CRITICAL SYNC ERROR:', e);
    } finally {
        await remotePrisma.$disconnect();
        await localPrisma.$disconnect();
    }
}

sync();
