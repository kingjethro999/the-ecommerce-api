import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";
import prisma from "../../../prisma/db.js";
export const list = async (c) => {
    const categories = await prisma.category.findMany({
        include: {
            department: true,
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
    return c.json(categories);
};
export const create = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const data = c.req.valid("json");
    // Check if department exists
    const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
    });
    if (!department) {
        return c.json({
            message: "Department not found",
        }, HttpStatusCodes.BAD_REQUEST);
    }
    // Check if slug is unique
    const existingCategory = await prisma.category.findUnique({
        where: { slug: data.slug },
    });
    if (existingCategory) {
        return c.json({
            message: "Category with this slug already exists",
        }, HttpStatusCodes.CONFLICT);
    }
    const category = await prisma.category.create({
        data,
    });
    return c.json(category, HttpStatusCodes.CREATED);
};
export const getOne = async (c) => {
    const { slug } = c.req.valid("param");
    const category = await prisma.category.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            bannerImage: true,
            description: true,
            departmentId: true,
            products: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                    price: true,
                    discount: true,
                },
            },
        },
    });
    if (!category) {
        return c.json({
            message: "Category not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    const similarCategories = await prisma.category.findMany({
        where: {
            departmentId: category.departmentId,
            id: {
                not: category.id, // Exclude the current cat
            },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
        },
    });
    const result = {
        ...category,
        similarCategories,
    };
    return c.json(result, HttpStatusCodes.OK);
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
    const existingCategory = await prisma.category.findUnique({
        where: { id },
    });
    if (!existingCategory) {
        return c.json({
            message: "Category not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if department exists if departmentId is being updated
    if (data.departmentId) {
        const department = await prisma.department.findUnique({
            where: { id: data.departmentId },
        });
        if (!department) {
            return c.json({
                message: "Department not found",
            }, HttpStatusCodes.BAD_REQUEST);
        }
    }
    // Check if slug is unique if slug is being updated
    if (data.slug && data.slug !== existingCategory.slug) {
        const categoryWithSlug = await prisma.category.findUnique({
            where: { slug: data.slug },
        });
        if (categoryWithSlug) {
            return c.json({
                message: "Category with this slug already exists",
            }, HttpStatusCodes.CONFLICT);
        }
    }
    const updatedCategory = await prisma.category.update({
        where: { id },
        data,
        select: {
            id: true,
        },
    });
    return c.json(updatedCategory, HttpStatusCodes.OK);
};
export const remove = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const { id } = c.req.valid("param");
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });
    if (!category) {
        return c.json({
            message: "Category not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if category has products
    if (category._count.products > 0) {
        return c.json({
            message: "Cannot delete category with existing products",
        }, HttpStatusCodes.BAD_REQUEST);
    }
    await prisma.category.delete({
        where: { id },
    });
    return c.json({
        message: "Category deleted successfully",
    }, HttpStatusCodes.OK);
};
