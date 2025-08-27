/* eslint-disable style/operator-linebreak */
/* eslint-disable object-shorthand */
/* eslint-disable no-console */
/* eslint-disable style/quote-props */
// import { PrismaClient } from "@prisma/client";
import prisma from "./db.js";
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
    await prisma.payment.deleteMany();
}
main()
    .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
