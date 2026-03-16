const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const isExecute = process.argv.includes('--execute')

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║        SYNC EXISTING PURCHASES TO EXPENSES                   ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(isExecute ? '║  ⚡ MODE: LIVE EXECUTION (changes WILL be applied)          ║' : '║  🔍 MODE: DRY RUN (no changes will be made)                ║')
  console.log(!isExecute ? '║  To apply changes, run with: --execute                       ║' : '║                                                              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  try {
    const receivedPurchases = await prisma.purchase.findMany({
      where: { status: 'RECEIVED' },
      include: { supplier: true }
    })

    console.log(`📋 Total RECEIVED purchases in database: ${receivedPurchases.length}\n`)

    let alreadySynced = 0
    let newlySynced = 0
    let errors = 0

    for (const purchase of receivedPurchases) {
      const noteStr = `Auto-generated from PO: ${purchase.id}`
      const existingExpense = await prisma.expense.findFirst({
        where: { note: noteStr }
      })

      if (existingExpense) {
        alreadySynced++
        continue
      }

      if (isExecute) {
        try {
          await prisma.expense.create({
            data: {
              supermarketId: purchase.supermarketId,
              title: `Purchase from ${purchase.supplier?.name || 'Unknown Supplier'} (Inv: ${purchase.invoiceNumber || 'N/A'})`,
              amount: purchase.totalAmount,
              category: 'Purchase',
              date: purchase.date,
              note: noteStr
            }
          })
          console.log(`  ✅ Synced: PO from ${purchase.supplier?.name} (₹${purchase.totalAmount})`)
          newlySynced++
        } catch (e) {
          console.error(`  ❌ Failed to sync PO ${purchase.id}:`, e.message)
          errors++
        }
      } else {
        console.log(`  🔄 Would sync: PO from ${purchase.supplier?.name} (₹${purchase.totalAmount})`)
        newlySynced++
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY:')
    console.log(`  • Already Synced: ${alreadySynced}`)
    if (isExecute) {
      console.log(`  • Newly Synced:   ${newlySynced}`)
      if (errors > 0) console.log(`  • Errors:         ${errors}`)
    } else {
      console.log(`  • Pending Sync:   ${newlySynced}`)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('Fatal execution error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
