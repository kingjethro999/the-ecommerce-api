import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";
import prisma from "../../../prisma/db.js";
export const list = async (c) => {
    const departments = await prisma.department.findMany({
        include: {
            _count: {
                select: {
                    categories: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return c.json(departments);
};
export const navList = async (c) => {
    const departments = await prisma.department.findMany({
        select: {
            id: true,
            slug: true,
            title: true,
        },
    });
    return c.json(departments);
};
export const catList = async (c) => {
    const departments = await prisma.department.findMany({
        select: {
            id: true,
            slug: true,
            title: true,
            categories: {
                select: {
                    id: true,
                    image: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });
    return c.json(departments);
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
    const existingDepartment = await prisma.department.findUnique({
        where: { slug: data.slug },
    });
    if (existingDepartment) {
        return c.json({
            message: "Department with this slug already exists",
        }, HttpStatusCodes.CONFLICT);
    }
    const department = await prisma.department.create({
        data,
        select: {
            id: true,
        },
    });
    return c.json(department, HttpStatusCodes.CREATED);
};
export const getOne = async (c) => {
    const { id } = c.req.valid("param");
    const department = await prisma.department.findUnique({
        where: { id },
        include: {
            categories: {
                include: {
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            },
        },
    });
    if (!department) {
        return c.json({
            message: "Department not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(department, HttpStatusCodes.OK);
};
export const getOneBySlug = async (c) => {
    const { slug } = c.req.valid("param");
    const department = await prisma.department.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            bannerImage: true,
            description: true,
            categories: {
                select: {
                    name: true,
                    id: true,
                    slug: true,
                    image: true,
                },
            },
        },
    });
    if (!department) {
        return c.json({
            message: "Department not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(department, HttpStatusCodes.OK);
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
    const existingDepartment = await prisma.department.findUnique({
        where: { id },
    });
    if (!existingDepartment) {
        return c.json({
            message: "Department not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if slug is unique if slug is being updated
    if (data.slug && data.slug !== existingDepartment.slug) {
        const departmentWithSlug = await prisma.department.findUnique({
            where: { slug: data.slug },
        });
        if (departmentWithSlug) {
            return c.json({
                message: "Department with this slug already exists",
            }, HttpStatusCodes.CONFLICT);
        }
    }
    const updatedDepartment = await prisma.department.update({
        where: { id },
        data,
        select: {
            id: true,
        },
    });
    return c.json(updatedDepartment, HttpStatusCodes.OK);
};
export const remove = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const { id } = c.req.valid("param");
    const department = await prisma.department.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    categories: true,
                },
            },
        },
    });
    if (!department) {
        return c.json({
            message: "Department not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    // Check if department has categories
    if (department._count.categories > 0) {
        return c.json({
            message: "Cannot delete department with existing categories",
        }, HttpStatusCodes.BAD_REQUEST);
    }
    await prisma.department.delete({
        where: { id },
    });
    return c.json({
        message: "Department deleted successfully",
    }, HttpStatusCodes.OK);
};
