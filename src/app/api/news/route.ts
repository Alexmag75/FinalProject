import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { NewsCategory } from "@prisma/client";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const venueId = searchParams.get("venueId");
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "9", 10);
		const skip = (page - 1) * limit;

		const user = await verifyAuth(request);
		const isSuperAdmin = user?.role === UserRole.SUPERADMIN;
		const whereCondition: any = {};
		if (
			category &&
			Object.values(NewsCategory).includes(category as NewsCategory)
		) {
			whereCondition.category = category as NewsCategory;
		}

		if (venueId) {
			whereCondition.venueId = venueId;
		}

		if (!isSuperAdmin) {
			if (!whereCondition.category) {
				whereCondition.OR = [
					{ category: NewsCategory.GENERAL },
					{ isPromoted: true },
				];
			} else if (whereCondition.category !== NewsCategory.GENERAL) {
				whereCondition.isPromoted = true;
			}
		}

		const totalItems = await prisma.news.count({
			where: whereCondition,
		});

		const newsList = await prisma.news.findMany({
			where: whereCondition,
			include: {
				venue: {
					select: { id: true, name: true, mainImage: true, address: true },
				},
			},
			orderBy: [{ isPromoted: "desc" }, { createdAt: "desc" }],
			skip: skip,
			take: limit,
		});

		const totalPages = Math.ceil(totalItems / limit);

		const pagination = {
			currentPage: page,
			totalPages: totalPages || 1,
			totalItems: totalItems,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		};

		return NextResponse.json(
			{
				news: newsList,
				pagination,
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	if (user.role === UserRole.USER) {
		return NextResponse.json(
			{
				message: "Доступ заборонено. Тільки для менеджерів та адміністраторів",
			},
			{ status: 403 },
		);
	}

	try {
		const body = await request.json();
		const { title, content, image, category, venueId } = body;

		if (!title || !content || !venueId) {
			return NextResponse.json(
				{ message: "Заголовок, текст та ID закладу є обов’язковими" },
				{ status: 400 },
			);
		}

		const venue = await prisma.venue.findUnique({
			where: { id: venueId },
			select: { userId: true },
		});

		if (!venue) {
			return NextResponse.json(
				{ message: "Вказаний заклад не знайдено" },
				{ status: 404 },
			);
		}

		if (venue.userId !== user.userId && user.role !== UserRole.SUPERADMIN) {
			return NextResponse.json(
				{ message: "У вас немає прав для публікації новин від цього закладу" },
				{ status: 403 },
			);
		}

		const newsCategory = Object.values(NewsCategory).includes(category)
			? category
			: NewsCategory.GENERAL;

		const newNews = await prisma.news.create({
			data: {
				title,
				content,
				image: image || null,
				category: newsCategory,
				venueId,
			},
			include: {
				venue: { select: { name: true } },
			},
		});

		return NextResponse.json(
			{ message: "Новину успішно опубліковано!", news: newNews },
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
