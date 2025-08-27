/* eslint-disable style/operator-linebreak */
// import { PrismaClient } from "@/generated/prisma";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        transactionOptions: {
            maxWait: 10000, // default: 2000
            timeout: 15000, // default: 5000
        },
    }).$extends(withAccelerate());
// eslint-disable-next-line node/no-process-env
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
export default prisma;
