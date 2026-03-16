/**
 * Merge Duplicate Flat Customers Script
 * ======================================
 * 
 * This script finds duplicate customer records for the same flat
 * (e.g., "4B7", "4 B 7", "4 B7", "4b7") and merges them into one.
 * 
 * All Sales, Payments linked to duplicate customers are reassigned
 * to the canonical (primary) customer, and duplicates are deleted.
 * 
 * Usage:
 *   DRY RUN (preview only, no changes):
 *     DATABASE_URL="postgresql://..." node scripts/merge-duplicate-flats.js
 * 
 *   LIVE RUN (actually merge):
 *     DATABASE_URL="postgresql://..." node scripts/merge-duplicate-flats.js --execute
 * 
 *   You can also set DATABASE_URL in your .env file and run:
 *     node scripts/merge-duplicate-flats.js
 *     node scripts/merge-duplicate-flats.js --execute
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const IS_DRY_RUN = !process.argv.includes('--execute')

// ─── Normalization ──────────────────────────────────────────────
// Remove all spaces, convert to uppercase: "4 B 7" → "4B7", "4b7" → "4B7"
function normalizeFlatNumber(input) {
    if (!input) return null
    const cleaned = input.replace(/\s+/g, '').toUpperCase().trim()
    return cleaned || null
}

// Try to extract a flat number from a customer name like "Flat 4 B 7" or "4 b7"
function extractFlatFromName(name) {
    if (!name) return null
    // Remove "Flat " prefix if present (case-insensitive)
    let cleaned = name.replace(/^flat\s*/i, '').trim()
    return normalizeFlatNumber(cleaned)
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║        MERGE DUPLICATE FLAT CUSTOMERS                      ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    if (IS_DRY_RUN) {
        console.log('║  🔍 MODE: DRY RUN (no changes will be made)                ║')
        console.log('║  To apply changes, run with: --execute                      ║')
    } else {
        console.log('║  ⚡ MODE: LIVE EXECUTION (changes WILL be applied)          ║')
    }
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log()

    // 1. Fetch ALL customers
    const allCustomers = await prisma.customer.findMany({
        include: {
            sales: { select: { id: true } },
            payments: { select: { id: true } }
        }
    })

    console.log(`📋 Total customers in database: ${allCustomers.length}`)
    console.log()

    // 2. Normalize and group by flat number
    const flatGroups = {} // normalized flat → [customer records]

    for (const customer of allCustomers) {
        let normalizedFlat = null

        // Try flatNumber field first
        if (customer.flatNumber) {
            normalizedFlat = normalizeFlatNumber(customer.flatNumber)
        }

        // If no flatNumber, try extracting from name
        if (!normalizedFlat && customer.name) {
            normalizedFlat = extractFlatFromName(customer.name)
        }

        // Skip customers with no identifiable flat
        if (!normalizedFlat) continue

        if (!flatGroups[normalizedFlat]) {
            flatGroups[normalizedFlat] = []
        }
        flatGroups[normalizedFlat].push(customer)
    }

    // 3. Find groups with duplicates (more than 1 customer per normalized flat)
    const duplicateGroups = Object.entries(flatGroups).filter(([, customers]) => customers.length > 1)

    if (duplicateGroups.length === 0) {
        console.log('✅ No duplicate flats found! Database is clean.')
        return
    }

    console.log(`🔴 Found ${duplicateGroups.length} flat(s) with duplicate customer records:\n`)

    let totalSalesMoved = 0
    let totalPaymentsMoved = 0
    let totalCustomersDeleted = 0

    for (const [normalizedFlat, customers] of duplicateGroups) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📍 Flat: ${normalizedFlat} (${customers.length} duplicate records)`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

        // Sort: pick the one with most transactions as canonical, ties broken by having flatNumber set
        customers.sort((a, b) => {
            const aTotal = a.sales.length + a.payments.length
            const bTotal = b.sales.length + b.payments.length

            // Prefer the one with more transactions
            if (bTotal !== aTotal) return bTotal - aTotal

            // Prefer the one with flatNumber set (not null)
            if (a.flatNumber && !b.flatNumber) return -1
            if (!a.flatNumber && b.flatNumber) return 1

            // Prefer the one with a phone number
            if (a.phone && !b.phone) return -1
            if (!a.phone && b.phone) return 1

            return 0
        })

        const canonical = customers[0]
        const duplicates = customers.slice(1)

        // Collect phone from duplicates if canonical doesn't have one
        let bestPhone = canonical.phone
        if (!bestPhone) {
            for (const dup of duplicates) {
                if (dup.phone) { bestPhone = dup.phone; break }
            }
        }

        console.log(`  ✅ KEEP (canonical): id=${canonical.id}`)
        console.log(`     flatNumber="${canonical.flatNumber}" | name="${canonical.name}" | phone="${canonical.phone}"`)
        console.log(`     Sales: ${canonical.sales.length} | Payments: ${canonical.payments.length}`)
        console.log()

        for (const dup of duplicates) {
            const salesCount = dup.sales.length
            const paymentsCount = dup.payments.length

            console.log(`  ❌ MERGE & DELETE: id=${dup.id}`)
            console.log(`     flatNumber="${dup.flatNumber}" | name="${dup.name}" | phone="${dup.phone}"`)
            console.log(`     Sales to move: ${salesCount} | Payments to move: ${paymentsCount}`)

            totalSalesMoved += salesCount
            totalPaymentsMoved += paymentsCount
            totalCustomersDeleted++

            if (!IS_DRY_RUN) {
                await prisma.$transaction(async (tx) => {
                    // Move all Sales from duplicate → canonical
                    if (salesCount > 0) {
                        await tx.sale.updateMany({
                            where: { customerId: dup.id },
                            data: { customerId: canonical.id }
                        })
                    }

                    // Move all Payments from duplicate → canonical
                    if (paymentsCount > 0) {
                        await tx.payment.updateMany({
                            where: { customerId: dup.id },
                            data: { customerId: canonical.id }
                        })
                    }

                    // Delete the duplicate customer (now has no references)
                    await tx.customer.delete({
                        where: { id: dup.id }
                    })
                })
                console.log(`     ✅ Merged and deleted.`)
            }
        }

        // Update canonical customer with clean data
        if (!IS_DRY_RUN) {
            await prisma.customer.update({
                where: { id: canonical.id },
                data: {
                    flatNumber: normalizedFlat,
                    name: `Flat ${normalizedFlat}`,
                    phone: bestPhone
                }
            })
            console.log(`  ✅ Canonical updated: flatNumber="${normalizedFlat}", name="Flat ${normalizedFlat}", phone="${bestPhone}"`)
        } else {
            console.log(`  📝 Would update canonical to: flatNumber="${normalizedFlat}", name="Flat ${normalizedFlat}", phone="${bestPhone}"`)
        }

        console.log()
    }

    // ─── Summary ────────────────────────────────────────────────
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║                        SUMMARY                              ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  Duplicate flat groups found:  ${String(duplicateGroups.length).padStart(5)}                        ║`)
    console.log(`║  Customer records to delete:   ${String(totalCustomersDeleted).padStart(5)}                        ║`)
    console.log(`║  Sales to reassign:            ${String(totalSalesMoved).padStart(5)}                        ║`)
    console.log(`║  Payments to reassign:         ${String(totalPaymentsMoved).padStart(5)}                        ║`)
    console.log('╠══════════════════════════════════════════════════════════════╣')

    if (IS_DRY_RUN) {
        console.log('║  ⚠️  This was a DRY RUN — no changes were made.            ║')
        console.log('║  Run with --execute to apply these changes.                 ║')
    } else {
        console.log('║  ✅ All changes applied successfully!                       ║')
    }
    console.log('╚══════════════════════════════════════════════════════════════╝')
}

main()
    .catch((e) => {
        console.error('❌ Script failed with error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
