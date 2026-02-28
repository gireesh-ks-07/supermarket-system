const { PrismaClient } = require('@prisma/client');

async function migrate() {
    const prisma = new PrismaClient();
    try {
        console.log('--- Migrating SaleItem historical prices ---');
        const saleItems = await prisma.saleItem.findMany({
            where: { costPrice: null },
            include: { product: true }
        });

        console.log(`Found ${saleItems.length} items to update.`);
        let count = 0;
        for (const item of saleItems) {
            await prisma.saleItem.update({
                where: { id: item.id },
                data: {
                    costPrice: item.product.costPrice
                }
            });
            count++;
            if (count % 500 === 0) console.log(`Updated ${count}...`);
        }
        console.log('Migration of SaleItems completed.');
    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
