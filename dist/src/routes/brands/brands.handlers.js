import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";
import prisma from "../../../prisma/db.js";
export const list = async (c) => {
    const brands = await prisma.brand.findMany({
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return c.json(brands);
};
export const create = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const data = c.req.valid("json");
    // Check if slug is unique
    const existingBrand = await prisma.brand.findUnique({
        where: { slug: data.slug },
    });
    if (existingBrand) {
        return c.json({
            message: "Brand with this slug already exists",
        }, HttpStatusCodes.CONFLICT);
    }
    const brand = await prisma.brand.create({
        data,
    });
    return c.json(brand, HttpStatusCodes.CREATED);
};
export const getOne = async (c) => {
    const { id } = c.req.valid("param");
    const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
            products: {
                include: {
                    category: true,
                },
            },
        },
    });
    if (!brand) {
        return c.json({
            message: "Brand not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(brand, HttpStatusCodes.OK);
};
export const update = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const existingBrand = await prisma.brand.findUnique({
        where: { id },
    });
    if (!existingBrand) {
        return c.json({
            message: "Brand not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if slug is unique if slug is being updated
    if (data.slug && data.slug !== existingBrand.slug) {
        const brandWithSlug = await prisma.brand.findUnique({
            where: { slug: data.slug },
        });
        if (brandWithSlug) {
            return c.json({
                message: "Brand with this slug already exists",
            }, HttpStatusCodes.CONFLICT);
        }
    }
    const updatedBrand = await prisma.brand.update({
        where: { id },
        data,
    });
    return c.json(updatedBrand, HttpStatusCodes.OK);
};
export const remove = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const { id } = c.req.valid("param");
    const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });
    if (!brand) {
        return c.json({
            message: "Brand not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if brand has products
    if (brand._count.products > 0) {
        return c.json({
            message: "Cannot delete brand with existing products",
        }, HttpStatusCodes.BAD_REQUEST);
    }
    await prisma.brand.delete({
        where: { id },
    });
    return c.json({
        message: "Brand deleted successfully",
    }, HttpStatusCodes.OK);
};
