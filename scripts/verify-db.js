const { PrismaClient } = require('@prisma/client');

async function verify() {
    const prisma = new PrismaClient();
    try {
        const product = await prisma.product.findFirst();
        console.log('Sample Product:', JSON.stringify(product, null, 2));

        const batch = await prisma.productBatch.findFirst();
        console.log('Sample Batch:', JSON.stringify(batch, null, 2));

        const sale = await prisma.sale.findFirst();
        console.log('Sample Sale:', JSON.stringify(sale, null, 2));

        const items = await prisma.saleItem.findMany({ take: 5 });
        console.log('Sample SaleItems:', JSON.stringify(items, null, 2));

        const count = await prisma.productBatch.count({
            where: { costPrice: null }
        });
        console.log('Batches with NULL costPrice:', count);

        const sicount = await prisma.saleItem.count({
            where: { costPrice: null }
        });
        console.log('SaleItems with NULL costPrice:', sicount);

    } catch (e) {
        console.error('Verification failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
