/**
 * Normalize ALL Flat Numbers
 * ==========================
 * 
 * Cleans up ALL customer flat numbers by removing spaces and uppercasing.
 * e.g., "13 B3" → "13B3", "3 b4" → "3B4", "3b6" → "3B6"
 * 
 * Usage:
 *   DRY RUN:   node scripts/normalize-all-flats.js
 *   EXECUTE:   node scripts/normalize-all-flats.js --execute
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const IS_DRY_RUN = !process.argv.includes('--execute')

function normalize(input) {
    if (!input) return null
    return input.replace(/\s+/g, '').toUpperCase().trim() || null
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║        NORMALIZE ALL FLAT NUMBERS                          ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    if (IS_DRY_RUN) {
        console.log('║  🔍 MODE: DRY RUN (no changes will be made)                ║')
        console.log('║  To apply changes, run with: --execute                      ║')
    } else {
        console.log('║  ⚡ MODE: LIVE EXECUTION (changes WILL be applied)          ║')
    }
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log()

    const customers = await prisma.customer.findMany({
        where: { flatNumber: { not: null } }
    })

    console.log(`📋 Total customers with flat numbers: ${customers.length}\n`)

    let updateCount = 0

    for (const customer of customers) {
        const original = customer.flatNumber
        const normalized = normalize(original)

        // Skip if no digits — likely a name, not a flat number (e.g., "Loss", "Lathika", "Assn Athul")
        if (!/\d/.test(original)) {
            console.log(`  ⏭️  Skipping "${original}" (looks like a name, not a flat number)`)
            continue
        }

        // Skip if already clean
        if (original === normalized) continue

        updateCount++
        console.log(`  🔄 "${original}" → "${normalized}"  (name: "${customer.name}" → "Flat ${normalized}")`)

        if (!IS_DRY_RUN) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    flatNumber: normalized,
                    name: `Flat ${normalized}`
                }
            })
        }
    }

    console.log()
    if (updateCount === 0) {
        console.log('✅ All flat numbers are already clean!')
    } else {
        console.log(`${IS_DRY_RUN ? '📝 Would update' : '✅ Updated'}: ${updateCount} customer(s)`)
        if (IS_DRY_RUN) {
            console.log('⚠️  Run with --execute to apply changes.')
        }
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
