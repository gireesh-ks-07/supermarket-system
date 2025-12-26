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
