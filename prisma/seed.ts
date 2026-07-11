import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in correct order (respect FK constraints)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.USER,
    },
  });

  console.log(`  ✅ Created ${3} users`);

  // ── Categories ─────────────────────────────────────
  const categoriesData = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest gadgets, devices, and electronic accessories',
      imageUrl: 'https://picsum.photos/seed/electronics/400/300',
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashionable apparel for men, women, and children',
      imageUrl: 'https://picsum.photos/seed/clothing/400/300',
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Everything for your home and outdoor spaces',
      imageUrl: 'https://picsum.photos/seed/home-garden/400/300',
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Fiction, non-fiction, and educational titles',
      imageUrl: 'https://picsum.photos/seed/books/400/300',
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Equipment, gear, and apparel for sports enthusiasts',
      imageUrl: 'https://picsum.photos/seed/sports/400/300',
    },
    {
      name: 'Toys & Games',
      slug: 'toys-games',
      description: 'Fun and educational toys for all ages',
      imageUrl: 'https://picsum.photos/seed/toys/400/300',
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) => prisma.category.create({ data: cat })),
  );

  console.log(`  ✅ Created ${categories.length} categories`);

  // ── Products ───────────────────────────────────────
  const productsData = [
    // Electronics (index 0)
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description:
        'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio.',
      price: 249.99,
      stock: 50,
      sku: 'ELEC-HP-001',
      imageUrl: 'https://picsum.photos/seed/headphones/400/300',
      categoryIndex: 0,
    },
    {
      name: 'Smart Watch Pro',
      description:
        'Advanced fitness tracking, GPS, heart rate monitor, and 7-day battery life. Water resistant to 50m.',
      price: 349.99,
      stock: 30,
      sku: 'ELEC-SW-002',
      imageUrl: 'https://picsum.photos/seed/smartwatch/400/300',
      categoryIndex: 0,
    },
    {
      name: 'Bluetooth Portable Speaker',
      description:
        'Waterproof portable speaker with 360-degree sound, 20-hour playback, and built-in microphone.',
      price: 79.99,
      stock: 100,
      sku: 'ELEC-SP-003',
      imageUrl: 'https://picsum.photos/seed/speaker/400/300',
      categoryIndex: 0,
    },
    {
      name: 'USB-C Hub 7-in-1',
      description:
        'Multi-port adapter with HDMI 4K, USB 3.0, SD card reader, and 100W power delivery.',
      price: 39.99,
      stock: 200,
      sku: 'ELEC-HUB-004',
      imageUrl: 'https://picsum.photos/seed/usbhub/400/300',
      categoryIndex: 0,
    },
    // Clothing (index 1)
    {
      name: 'Classic Fit Oxford Shirt',
      description:
        'Timeless button-down shirt in premium cotton. Perfect for casual and semi-formal occasions.',
      price: 59.99,
      stock: 80,
      sku: 'CLTH-OX-001',
      imageUrl: 'https://picsum.photos/seed/oxford/400/300',
      categoryIndex: 1,
    },
    {
      name: 'Slim Fit Chino Pants',
      description:
        'Stretch cotton chinos with modern slim fit. Available in multiple colors.',
      price: 49.99,
      stock: 60,
      sku: 'CLTH-CH-002',
      imageUrl: 'https://picsum.photos/seed/chinos/400/300',
      categoryIndex: 1,
    },
    {
      name: 'Wool Blend Overcoat',
      description:
        'Elegant wool blend coat with satin lining. Perfect for winter layering.',
      price: 189.99,
      stock: 25,
      sku: 'CLTH-CT-003',
      imageUrl: 'https://picsum.photos/seed/overcoat/400/300',
      categoryIndex: 1,
    },
    // Home & Garden (index 2)
    {
      name: 'Indoor Herb Garden Kit',
      description:
        'Self-watering planter with LED grow lights. Grow fresh herbs year-round.',
      price: 44.99,
      stock: 45,
      sku: 'HOME-HG-001',
      imageUrl: 'https://picsum.photos/seed/herb-garden/400/300',
      categoryIndex: 2,
    },
    {
      name: 'Stainless Steel Cookware Set',
      description:
        '10-piece professional cookware set with tri-ply construction. Oven safe to 500°F.',
      price: 299.99,
      stock: 20,
      sku: 'HOME-CW-002',
      imageUrl: 'https://picsum.photos/seed/cookware/400/300',
      categoryIndex: 2,
    },
    {
      name: 'Scented Soy Candle Collection',
      description:
        'Set of 3 hand-poured soy candles. Long-lasting, clean-burning, and beautifully scented.',
      price: 34.99,
      stock: 150,
      sku: 'HOME-CD-003',
      imageUrl: 'https://picsum.photos/seed/candles/400/300',
      categoryIndex: 2,
    },
    // Books (index 3)
    {
      name: 'Clean Code: A Handbook of Agile Software',
      description:
        'Robert C. Martin\'s classic guide to writing clean, maintainable, and efficient code.',
      price: 39.99,
      stock: 90,
      sku: 'BOOK-CC-001',
      imageUrl: 'https://picsum.photos/seed/cleancode/400/300',
      categoryIndex: 3,
    },
    {
      name: 'Design Patterns: Elements of Reusable Software',
      description:
        'The seminal catalog of 23 design patterns for object-oriented programming.',
      price: 44.99,
      stock: 70,
      sku: 'BOOK-DP-002',
      imageUrl: 'https://picsum.photos/seed/designpatterns/400/300',
      categoryIndex: 3,
    },
    {
      name: 'The Pragmatic Programmer',
      description:
        'Timeless tips and techniques for becoming a better software developer.',
      price: 49.99,
      stock: 85,
      sku: 'BOOK-PP-003',
      imageUrl: 'https://picsum.photos/seed/pragmatic/400/300',
      categoryIndex: 3,
    },
    // Sports (index 4)
    {
      name: 'Yoga Mat Premium',
      description:
        'Extra-thick, non-slip yoga mat with alignment lines. Includes carrying strap.',
      price: 29.99,
      stock: 120,
      sku: 'SPRT-YM-001',
      imageUrl: 'https://picsum.photos/seed/yogamat/400/300',
      categoryIndex: 4,
    },
    {
      name: 'Adjustable Dumbbell Set',
      description:
        'Space-saving adjustable dumbbells from 5-52.5 lbs. Quick-change weight system.',
      price: 199.99,
      stock: 15,
      sku: 'SPRT-DB-002',
      imageUrl: 'https://picsum.photos/seed/dumbbells/400/300',
      categoryIndex: 4,
    },
    {
      name: 'Insulated Water Bottle',
      description:
        'Double-wall vacuum insulated. Keeps drinks cold 24h or hot 12h. BPA-free, 32oz.',
      price: 24.99,
      stock: 200,
      sku: 'SPRT-WB-003',
      imageUrl: 'https://picsum.photos/seed/waterbottle/400/300',
      categoryIndex: 4,
    },
    // Toys & Games (index 5)
    {
      name: 'Wooden Building Blocks Set',
      description:
        '100-piece natural wood block set. Encourages creativity, spatial reasoning, and fine motor skills.',
      price: 32.99,
      stock: 65,
      sku: 'TOYS-BB-001',
      imageUrl: 'https://picsum.photos/seed/blocks/400/300',
      categoryIndex: 5,
    },
    {
      name: 'Strategy Board Game',
      description:
        'Award-winning strategy game for 2-4 players. Average play time: 60-90 minutes.',
      price: 44.99,
      stock: 40,
      sku: 'TOYS-BG-002',
      imageUrl: 'https://picsum.photos/seed/boardgame/400/300',
      categoryIndex: 5,
    },
    {
      name: 'Remote Control Racing Car',
      description:
        'High-speed RC car reaching 30mph. Rechargeable battery, 30min runtime. Suitable ages 8+.',
      price: 54.99,
      stock: 35,
      sku: 'TOYS-RC-003',
      imageUrl: 'https://picsum.photos/seed/rccar/400/300',
      categoryIndex: 5,
    },
    {
      name: 'Interactive Learning Tablet',
      description:
        'Educational tablet for ages 3-7. Teaches letters, numbers, shapes, and more with touch screen.',
      price: 39.99,
      stock: 55,
      sku: 'TOYS-LT-004',
      imageUrl: 'https://picsum.photos/seed/learningtab/400/300',
      categoryIndex: 5,
    },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          sku: p.sku,
          imageUrl: p.imageUrl,
          categoryId: categories[p.categoryIndex].id,
        },
      }),
    ),
  );

  console.log(`  ✅ Created ${products.length} products`);

  // ── Cart for user1 ─────────────────────────────────
  const cart = await prisma.cart.create({
    data: {
      userId: user1.id,
      cartItems: {
        create: [
          {
            productId: products[0].id, // Headphones
            quantity: 1,
          },
          {
            productId: products[2].id, // Portable Speaker
            quantity: 2,
          },
        ],
      },
    },
  });

  console.log(`  ✅ Created cart for ${user1.email}`);

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
