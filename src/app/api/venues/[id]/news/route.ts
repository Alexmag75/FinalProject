import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { NewsCategory } from "@prisma/client";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: venueId } = await params;

		const newsList = await prisma.news.findMany({
			where: { venueId,
				isPromoted: true},
			orderBy: { createdAt: "desc" }, // Свежие новости сверху
		});

		return NextResponse.json({ news: newsList }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role === UserRole.USER) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const { id: venueId } = await params;
		const body = await request.json();
		const { title, content, image, category } = body;

		if (!title || !content) {
			return NextResponse.json(
				{ message: "Заголовок та текст новини є обов’язковими" },
				{ status: 400 },
			);
		}

		const venue = await prisma.venue.findUnique({ where: { id: venueId } });
		if (!venue)
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);

		if (user.role !== UserRole.SUPERADMIN && venue.userId !== user.userId) {
			return NextResponse.json(
				{ message: "У вас немає прав для цієї дії" },
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
		});

		return NextResponse.json(
			{ message: "Новину успішно додано!", news: newNews },
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
