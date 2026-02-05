const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const invoiceSuffix = '1770284464578'

    // Find the sale first
    console.log(`Searching for invoice containing: ${invoiceSuffix}...`)

    const sales = await prisma.sale.findMany({
        where: {
            invoiceNumber: {
                contains: invoiceSuffix
            }
        },
        include: {
            items: true
        }
    })

    if (sales.length === 0) {
        console.log('No sale found with that invoice number.')
        return
    }

    if (sales.length > 1) {
        console.log(`Found ${sales.length} matching sales. Please be more specific.`)
        sales.forEach(s => console.log(` - ${s.invoiceNumber} (ID: ${s.id})`))
        return
    }

    const sale = sales[0]
    console.log(`Found Sale: ${sale.invoiceNumber} (ID: ${sale.id})`)
    console.log(`Date: ${sale.date}`)
    console.log(`Total: ${sale.totalAmount}`)
    console.log(`Items: ${sale.items.length}`)

    // Delete items first
    console.log('Deleting sale items...')
    const deletedItems = await prisma.saleItem.deleteMany({
        where: {
            saleId: sale.id
        }
    })
    console.log(`Deleted ${deletedItems.count} items.`)

    // Delete sale
    console.log('Deleting sale record...')
    await prisma.sale.delete({
        where: {
            id: sale.id
        }
    })
    console.log('Sale deleted successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
