import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { NewsCategory } from "@prisma/client";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string; newsId: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role === "USER")
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);

	try {
		const { id: venueId, newsId } = await params;
		const body = await request.json();
		const { title, content, image, category } = body;

		const venue = await prisma.venue.findUnique({ where: { id: venueId } });
		if (!venue)
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);

		if (user.role !== "SUPERADMIN" && venue.userId !== user.userId) {
			return NextResponse.json(
				{ message: "Доступ заборонено" },
				{ status: 403 },
			);
		}

		const existingNews = await prisma.news.findUnique({
			where: { id: newsId },
		});
		if (!existingNews || existingNews.venueId !== venueId) {
			return NextResponse.json(
				{ message: "Новину не знайдено" },
				{ status: 404 },
			);
		}

		const newsCategory = Object.values(NewsCategory).includes(category)
			? category
			: existingNews.category;

		const updatedNews = await prisma.news.update({
			where: { id: newsId },
			data: {
				title: title || existingNews.title,
				content: content || existingNews.content,
				image: image !== undefined ? image : existingNews.image,
				category: newsCategory,
			},
		});

		return NextResponse.json(
			{ message: "Новину успішно оновлено!", news: updatedNews },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string; newsId: string }> },
) {
	const user = await verifyAuth(request);
	if (!user)
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);

	try {
		const { id: venueId, newsId } = await params;

		const venue = await prisma.venue.findUnique({ where: { id: venueId } });
		if (!venue)
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);

		if (user.role !== "SUPERADMIN" && venue.userId !== user.userId) {
			return NextResponse.json(
				{ message: "Доступ заборонено" },
				{ status: 403 },
			);
		}

		const existingNews = await prisma.news.findUnique({
			where: { id: newsId },
		});
		if (!existingNews || existingNews.venueId !== venueId) {
			return NextResponse.json(
				{ message: "Новину не знайдено" },
				{ status: 404 },
			);
		}

		await prisma.news.delete({ where: { id: newsId } });

		return NextResponse.json(
			{ message: "Новину успішно видалено!" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
