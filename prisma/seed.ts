/* eslint-disable style/operator-linebreak */
/* eslint-disable object-shorthand */
/* eslint-disable no-console */
/* eslint-disable style/quote-props */
// import { PrismaClient } from "@prisma/client";

import prisma from "./db";

// Helpers removed – not needed for banner-only seeding.

// Public banner images deployed on the frontend (vercel)
const BANNER_BASE = "https://the-ecommercesolution.vercel.app/bannerimg";
const bannerPayload = [
  {
    title: "Hero Banner 1",
    description: "Featured promotions and top deals",
    imageUrl: `${BANNER_BASE}/ecommerce1.jpg`,
    mobileImageUrl: `${BANNER_BASE}/ecommerce1.jpg`,
    linkUrl: "/",
  },
  {
    title: "Hero Banner 2",
    description: "Latest arrivals across departments",
    imageUrl: `${BANNER_BASE}/ecommerce2.jpg`,
    mobileImageUrl: `${BANNER_BASE}/ecommerce2.jpg`,
    linkUrl: "/",
  },
  {
    title: "Hero Banner 3",
    description: "Shop curated collections",
    imageUrl: `${BANNER_BASE}/ecommerce3.jpg`,
    mobileImageUrl: `${BANNER_BASE}/ecommerce3.jpg`,
    linkUrl: "/",
  },
];
// Removed non-banner dataset definitions (departments, categories).

async function main() {
  console.log("Starting database seeding...");
  // Skipped: departments/categories seeding removed.

  // 3) Upsert Banners using provided images
  let bannerCount = 0;
  for (const b of bannerPayload) {
    await prisma.banner.upsert({
      where: { id: (await prisma.banner.findFirst({ where: { imageUrl: b.imageUrl } }))?.id ?? "_none_" },
      update: {
        title: b.title,
        description: b.description,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl,
        linkUrl: b.linkUrl,
        isActive: true,
      },
      create: {
        title: b.title,
        description: b.description,
        imageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl,
        linkUrl: b.linkUrl,
        isActive: true,
      },
    });
    bannerCount += 1;
  }
  console.log(`Upserted banners: ${bannerCount}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
