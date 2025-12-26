import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const supermarket = await prisma.supermarket.create({
    data: {
      name: 'SuperMart One',
      address: '123 Market St',
      phone: '555-0123'
    }
  })

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN',
      supermarketId: supermarket.id
    }
  })

  const cashier = await prisma.user.create({
    data: {
      username: 'cashier',
      password: hashedPassword,
      name: 'John Doe',
      role: 'BILLING_STAFF',
      pin: '1234',
      supermarketId: supermarket.id
    }
  })

<<<<<<< HEAD
=======
  const stockManager = await prisma.user.create({
    data: {
      username: 'manager',
      password: hashedPassword,
      name: 'Stock Manager',
      role: 'STOCK_MANAGER',
      supermarketId: supermarket.id
    }
  })

>>>>>>> b46e104 (Add .gitignore and remove node_modules)
  // Dummy Products (Kerala)
  const products = [
    { name: 'Matta Rice (Jaya)', barcode: '8901234001', category: 'Grains', unit: 'kg', costPrice: 42.00, sellingPrice: 55.00, taxPercent: 0 },
    { name: 'Coconut Oil (Kera)', barcode: '8901234002', category: 'Oils', unit: 'litre', costPrice: 180.00, sellingPrice: 210.00, taxPercent: 5 },
    { name: 'Milma Milk (Blue)', barcode: '8901234003', category: 'Dairy', unit: 'packet', costPrice: 24.00, sellingPrice: 26.00, taxPercent: 0 },
    { name: 'Eastern Chicken Masala', barcode: '8901234004', category: 'Spices', unit: 'packet', costPrice: 45.00, sellingPrice: 58.00, taxPercent: 5 },
    { name: 'Narasus Coffee Powder', barcode: '8901234005', category: 'Beverages', unit: 'packet', costPrice: 90.00, sellingPrice: 110.00, taxPercent: 5 },
    { name: 'Banana (Nendran)', barcode: '8901234006', category: 'Fruits', unit: 'kg', costPrice: 35.00, sellingPrice: 60.00, taxPercent: 0 },
    { name: 'Tata Tea dust', barcode: '8901234007', category: 'Beverages', unit: 'packet', costPrice: 130.00, sellingPrice: 155.00, taxPercent: 5 },
    { name: 'Parle-G Biscuit', barcode: '8901234008', category: 'Snacks', unit: 'packet', costPrice: 8.50, sellingPrice: 10.00, taxPercent: 18 },
    { name: 'Vim Dishwash Bar', barcode: '8901234009', category: 'Cleaning', unit: 'bar', costPrice: 22.00, sellingPrice: 28.00, taxPercent: 18 },
    { name: 'Sambar Mulaku (Chili)', barcode: '8901234010', category: 'Vegetables', unit: 'kg', costPrice: 80.00, sellingPrice: 120.00, taxPercent: 0 },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        supermarketId: supermarket.id,
        minStockLevel: 10
      }
    })
  }

  console.log('Added 10 dummy Kerala products')

  // Add Batches
  const allProducts = await prisma.product.findMany({ where: { supermarketId: supermarket.id } })
  for (const p of allProducts) {
    await prisma.productBatch.create({
      data: {
        productId: p.id,
        batchNumber: `BAT-${Math.floor(Math.random() * 1000)}`,
        quantity: Math.floor(Math.random() * 50) + 1, // 1 to 50
        expiryDate: new Date(Date.now() + (Math.random() * 180 * 24 * 60 * 60 * 1000)) // 0 to 180 days
      }
    })
  }
  console.log('Added batches for products')

  // Add Dummy Sales for last 7 days
  const modes = ['CASH', 'UPI', 'CARD']
  for (let i = 0; i < 7; i++) {
    const saleDate = new Date()
    saleDate.setDate(saleDate.getDate() - i)

    // Create 2-5 sales per day
    const salesCount = Math.floor(Math.random() * 4) + 2
    for (let j = 0; j < salesCount; j++) {
      const sale = await prisma.sale.create({
        data: {
          supermarketId: supermarket.id,
          cashierId: cashier.id,
          invoiceNumber: `INV-${i}${j}${Math.floor(Math.random() * 1000)}`,
          date: saleDate,
          paymentMode: modes[Math.floor(Math.random() * modes.length)],
          subTotal: 0,
          taxTotal: 0,
          totalAmount: 0,
        }
      })

      // Add 1-3 items per sale
      let totalAmount = 0
      const itemsCount = Math.floor(Math.random() * 3) + 1
      for (let k = 0; k < itemsCount; k++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)]
        const qty = Math.floor(Math.random() * 3) + 1
        const price = Number(product.sellingPrice)
        const total = qty * price

        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: qty,
            unitPrice: price,
            taxAmount: 0,
            total: total
          }
        })
        totalAmount += total
      }

      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          subTotal: totalAmount,
          totalAmount: totalAmount
        }
      })
    }
  }
  console.log('Added dummy sales for analytics')

  console.log({ supermarket, admin, cashier })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
