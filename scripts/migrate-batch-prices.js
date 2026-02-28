const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting data migration for batch pricing...');

    // 1. Get all products with their prices
    const products = await prisma.product.findMany();

    for (const product of products) {
        console.log(`Migrating batches for product: ${product.name}`);

        // Update all batches of this product with the current product price as fallback
        await prisma.productBatch.updateMany({
            where: {
                productId: product.id,
                costPrice: null
            },
            data: {
                costPrice: product.costPrice,
                sellingPrice: product.sellingPrice
            }
        });
    }

    console.log('Migration completed successfully.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
