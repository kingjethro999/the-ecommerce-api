/* eslint-disable style/operator-linebreak */
/* eslint-disable object-shorthand */
/* eslint-disable no-console */
/* eslint-disable style/quote-props */
// import { PrismaClient } from "@prisma/client";

import prisma from "./db";

// const prisma = new PrismaClient();

// Helper function to generate slug from title
function generateSlug(title: string): string {
  const result = title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const randomNumber = Math.floor(Math.random() * 1000 + 1);
  const str = `${result}-${randomNumber}`;
  return str;
}

// Helper function to get random Unsplash image
function getUnsplashImage(
  width: number = 800,
  height: number = 600,
  query: string = ""
): string {
  const searchQuery = query ? `/${query}` : "";
  return `https://source.unsplash.com/${width}x${height}${searchQuery}`;
}

// Helper function to get random price
function getRandomPrice(min: number = 10, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random stock quantity
function getRandomStock(min: number = 10, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Type definitions
interface DepartmentData {
  title: string;
  description: string;
  bannerImage: string;
}

// interface BrandData {
//   title: string;
//   description: string;
// }

// interface BannerData {
//   title: string;
//   description: string;
//   imageUrl: string;
//   linkUrl: string;
// }

async function main() {
  console.log("Starting database seeding...");

  // Clean existing data
  // await prisma.sale.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // Create departments
  const departments: DepartmentData[] = [
    {
      title: "Electronics",
      description: "Latest electronic devices and gadgets",
      bannerImage: getUnsplashImage(1200, 400, "electronics"),
    },
    {
      title: "Fashion",
      description: "Trendy clothing and accessories",
      bannerImage: getUnsplashImage(1200, 400, "fashion"),
    },
    {
      title: "Home & Garden",
      description: "Everything for your home and garden",
      bannerImage: getUnsplashImage(1200, 400, "home-garden"),
    },
    {
      title: "Sports & Outdoors",
      description: "Sports equipment and outdoor gear",
      bannerImage: getUnsplashImage(1200, 400, "sports"),
    },
    {
      title: "Books & Media",
      description: "Books, movies, and digital media",
      bannerImage: getUnsplashImage(1200, 400, "books"),
    },
    {
      title: "Health & Beauty",
      description: "Health and beauty products",
      bannerImage: getUnsplashImage(1200, 400, "beauty"),
    },
    {
      title: "Automotive",
      description: "Car accessories and automotive parts",
      bannerImage: getUnsplashImage(1200, 400, "automotive"),
    },
    {
      title: "Toys & Games",
      description: "Fun toys and games for all ages",
      bannerImage: getUnsplashImage(1200, 400, "toys"),
    },
    {
      title: "Food & Beverages",
      description: "Gourmet food and beverages",
      bannerImage: getUnsplashImage(1200, 400, "food"),
    },
    {
      title: "Office Supplies",
      description: "Office equipment and supplies",
      bannerImage: getUnsplashImage(1200, 400, "office"),
    },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    const department = await prisma.department.create({
      data: {
        title: dept.title,
        slug: generateSlug(dept.title),
        bannerImage: dept.bannerImage,
        description: dept.description,
        isActive: true,
      },
    });
    createdDepartments.push(department);
    console.log(`Created department: ${department.title}`);
  }

  // Create categories for each department
  const categoryData = {
    Electronics: ["Smartphones", "Laptops", "Cameras", "Audio Equipment"],
    Fashion: ["Men's Clothing", "Women's Clothing", "Shoes", "Accessories"],
    "Home & Garden": [
      "Furniture",
      "Kitchen Appliances",
      "Garden Tools",
      "Home Decor",
    ],
    "Sports & Outdoors": [
      "Fitness Equipment",
      "Outdoor Gear",
      "Team Sports",
      "Water Sports",
    ],
    "Books & Media": [
      "Fiction Books",
      "Non-Fiction",
      "Movies & TV",
      "Digital Media",
    ],
    "Health & Beauty": [
      "Skincare",
      "Makeup",
      "Health Supplements",
      "Personal Care",
    ],
    Automotive: [
      "Car Accessories",
      "Car Care",
      "Tools & Equipment",
      "Replacement Parts",
    ],
    "Toys & Games": [
      "Board Games",
      "Action Figures",
      "Educational Toys",
      "Video Games",
    ],
    "Food & Beverages": ["Snacks", "Beverages", "Gourmet Food", "Health Foods"],
    "Office Supplies": [
      "Stationery",
      "Office Electronics",
      "Furniture",
      "Storage Solutions",
    ],
  };

  const createdCategories = [];
  for (const department of createdDepartments) {
    const cats = categoryData[department.title as keyof typeof categoryData];
    for (const catName of cats) {
      const category = await prisma.category.create({
        data: {
          name: catName,
          slug: generateSlug(catName),
          image: getUnsplashImage(
            400,
            300,
            catName.replace(/\s+/g, "-").toLowerCase()
          ),
          bannerImage: getUnsplashImage(
            1200,
            400,
            catName.replace(/\s+/g, "-").toLowerCase()
          ),
          description: `Premium ${catName.toLowerCase()} collection`,
          isActive: true,
          departmentId: department.id,
        },
      });
      createdCategories.push(category);
      console.log(`Created category: ${category.name}`);
    }
  }

  // Create brands
  const brands = [
    { title: "TechPro", description: "Leading technology solutions" },
    { title: "StyleCraft", description: "Premium fashion and lifestyle" },
    { title: "HomeEssentials", description: "Quality home products" },
    { title: "FitLife", description: "Sports and fitness equipment" },
    {
      title: "EcoChoice",
      description: "Sustainable and eco-friendly products",
    },
    { title: "LuxuryLine", description: "High-end luxury items" },
  ];

  const createdBrands = [];
  for (const brand of brands) {
    const createdBrand = await prisma.brand.create({
      data: {
        title: brand.title,
        slug: generateSlug(brand.title),
        bannerImage: getUnsplashImage(1200, 400, "brand"),
        logo: getUnsplashImage(200, 200, "logo"),
        description: brand.description,
        isActive: true,
      },
    });
    createdBrands.push(createdBrand);
    console.log(`Created brand: ${createdBrand.title}`);
  }

  // Create products for each category
  const productNames = {
    Smartphones: ["iPhone Pro Max", "Samsung Galaxy Ultra"],
    Laptops: ['MacBook Pro 16"', "Dell XPS 13"],
    Cameras: ["Canon EOS R6", "Sony A7 III"],
    "Audio Equipment": ["Bose QuietComfort", "Sony WH-1000XM4"],
    "Men's Clothing": ["Classic Denim Jacket", "Cotton Polo Shirt"],
    "Women's Clothing": ["Floral Summer Dress", "Elegant Blazer"],
    Shoes: ["Running Sneakers", "Leather Boots"],
    Accessories: ["Leather Wallet", "Silk Scarf"],
    Furniture: ["Ergonomic Office Chair", "Modern Coffee Table"],
    "Kitchen Appliances": ["Stainless Steel Blender", "Espresso Machine"],
    "Garden Tools": ["Pruning Shears", "Garden Hose"],
    "Home Decor": ["Ceramic Vase", "Wall Art Canvas"],
    "Fitness Equipment": ["Yoga Mat", "Resistance Bands"],
    "Outdoor Gear": ["Hiking Backpack", "Camping Tent"],
    "Team Sports": ["Basketball", "Soccer Ball"],
    "Water Sports": ["Surfboard", "Swim Goggles"],
    "Fiction Books": ["Mystery Novel", "Romance Novel"],
    "Non-Fiction": ["Self-Help Guide", "Biography"],
    "Movies & TV": ["Action Movie Collection", "TV Series Box Set"],
    "Digital Media": ["Music Streaming Gift Card", "E-book Collection"],
    Skincare: ["Anti-Aging Serum", "Moisturizing Cream"],
    Makeup: ["Lipstick Set", "Eyeshadow Palette"],
    "Health Supplements": ["Vitamin C Tablets", "Protein Powder"],
    "Personal Care": ["Electric Toothbrush", "Hair Dryer"],
    "Car Accessories": ["Phone Mount", "Seat Covers"],
    "Car Care": ["Car Wax", "Tire Cleaner"],
    "Tools & Equipment": ["Socket Wrench Set", "Jump Starter"],
    "Replacement Parts": ["Air Filter", "Brake Pads"],
    "Board Games": ["Strategy Board Game", "Family Card Game"],
    "Action Figures": ["Superhero Figure", "Collectible Model"],
    "Educational Toys": ["STEM Learning Kit", "Puzzle Set"],
    "Video Games": ["Adventure Game", "Racing Game"],
    Snacks: ["Organic Trail Mix", "Gourmet Cookies"],
    Beverages: ["Craft Coffee Beans", "Premium Tea Set"],
    "Gourmet Food": ["Artisan Cheese", "Truffle Oil"],
    "Health Foods": ["Superfood Smoothie Mix", "Organic Quinoa"],
    Stationery: ["Premium Notebook", "Gel Pen Set"],
    "Office Electronics": ["Wireless Mouse", "Bluetooth Keyboard"],
    "Storage Solutions": ["File Organizer", "Desk Caddy"],
  };

  for (const category of createdCategories) {
    const products: string[] = productNames[
      category.name as keyof typeof productNames
    ] || ["Premium Product 1", "Premium Product 2"];

    for (const productName of products) {
      const price = getRandomPrice(20, 800);
      const buyingPrice = Math.floor(price * 0.6); // 60% of selling price
      const stockQty = getRandomStock(5, 150);
      const randomBrand =
        createdBrands[Math.floor(Math.random() * createdBrands.length)];

      const product = await prisma.product.create({
        data: {
          name: productName,
          slug: generateSlug(productName),
          imageUrl: getUnsplashImage(
            600,
            600,
            productName.replace(/\s+/g, "-").toLowerCase()
          ),
          productImages: [
            getUnsplashImage(
              600,
              600,
              productName.replace(/\s+/g, "-").toLowerCase()
            ),
            getUnsplashImage(
              600,
              600,
              productName.replace(/\s+/g, "-").toLowerCase()
            ),
            getUnsplashImage(
              600,
              600,
              productName.replace(/\s+/g, "-").toLowerCase()
            ),
          ],
          description: `High-quality ${productName.toLowerCase()} with premium features and excellent durability. Perfect for both professional and personal use.`,
          summary: `Premium ${productName.toLowerCase()} with excellent quality and features.`,
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
          isDeal: Math.random() > 0.8, // 20% chance of being a deal
          price: price,
          buyingPrice: buyingPrice,
          dealPrice: Math.random() > 0.8 ? Math.floor(price * 0.8) : null, // 20% off if it's a deal
          stockQty: stockQty,
          lowStockAlert: 10,
          discount:
            Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : null, // 5-25% discount
          categoryId: category.id,
          brandId: randomBrand.id,
        },
      });
      console.log(`Created product: ${product.name}`);
    }
  }

  // Create banners
  const banners = [
    {
      title: "Summer Sale",
      description: "Up to 50% off on selected items",
      imageUrl: getUnsplashImage(1200, 400, "summer-sale"),
      linkUrl: "/categories/fashion",
    },
    {
      title: "New Electronics",
      description: "Latest gadgets and tech accessories",
      imageUrl: getUnsplashImage(1200, 400, "electronics-banner"),
      linkUrl: "/categories/electronics",
    },
    {
      title: "Home Essentials",
      description: "Transform your living space",
      imageUrl: getUnsplashImage(1200, 400, "home-essentials"),
      linkUrl: "/categories/home-garden",
    },
    {
      title: "Fitness Collection",
      description: "Get fit with our premium equipment",
      imageUrl: getUnsplashImage(1200, 400, "fitness-equipment"),
      linkUrl: "/categories/sports-outdoors",
    },
    {
      title: "Beauty & Care",
      description: "Premium skincare and beauty products",
      imageUrl: getUnsplashImage(1200, 400, "beauty-products"),
      linkUrl: "/categories/health-beauty",
    },
    {
      title: "Books & Media",
      description: "Discover new worlds through reading",
      imageUrl: getUnsplashImage(1200, 400, "books-media"),
      linkUrl: "/categories/books-media",
    },
  ];

  for (const banner of banners) {
    await prisma.banner.create({
      data: {
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        mobileImageUrl: getUnsplashImage(
          800,
          600,
          banner.title.replace(/\s+/g, "-").toLowerCase()
        ),
        linkUrl: banner.linkUrl,
        isActive: true,
      },
    });
    console.log(`Created banner: ${banner.title}`);
  }

  // Print summary
  const departmentCount = await prisma.department.count();
  const categoryCount = await prisma.category.count();
  const brandCount = await prisma.brand.count();
  const productCount = await prisma.product.count();
  const bannerCount = await prisma.banner.count();

  console.log("\n=== SEEDING SUMMARY ===");
  console.log(`Departments: ${departmentCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Brands: ${brandCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Banners: ${bannerCount}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
