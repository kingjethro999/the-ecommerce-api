import { getAuth } from "@hono/clerk-auth";
import * as HttpStatusCodes from "stoker/http-status-codes";
import prisma from "../../../prisma/db.js";
export const list = async (c) => {
    const banners = await prisma.banner.findMany({
        select: {
            id: true,
            title: true,
            linkUrl: true,
            imageUrl: true,
            mobileImageUrl: true,
            description: true,
        },
        where: {
            isActive: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return c.json(banners);
};
export const create = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const data = c.req.valid("json");
    const banner = await prisma.banner.create({
        data,
    });
    return c.json(banner, HttpStatusCodes.CREATED);
};
export const getOne = async (c) => {
    const { id } = c.req.valid("param");
    const banner = await prisma.banner.findUnique({
        where: { id },
    });
    if (!banner) {
        return c.json({
            message: "Banner not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(banner, HttpStatusCodes.OK);
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
    const existingBanner = await prisma.banner.findUnique({
        where: { id },
    });
    if (!existingBanner) {
        return c.json({
            message: "Banner not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    const updatedBanner = await prisma.banner.update({
        where: { id },
        data,
    });
    return c.json(updatedBanner, HttpStatusCodes.OK);
};
export const remove = async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
        return c.json({
            message: "You are not logged in.",
        }, HttpStatusCodes.UNAUTHORIZED);
    }
    const { id } = c.req.valid("param");
    const banner = await prisma.banner.findUnique({
        where: { id },
    });
    if (!banner) {
        return c.json({
            message: "Banner not found",
        }, HttpStatusCodes.NOT_FOUND);
    }
    await prisma.banner.delete({
        where: { id },
    });
    return c.json({
        message: "Banner deleted successfully",
    }, HttpStatusCodes.OK);
};
