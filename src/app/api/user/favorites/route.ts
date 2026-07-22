import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
	const user = await verifyAuth(request);
	if (!user)
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);

	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "9", 10);
		const skip = (page - 1) * limit;

		const whereCondition = { userId: user.userId };
		const totalItems = await prisma.favorite.count({ where: whereCondition });

		const favorites = await prisma.favorite.findMany({
			where: whereCondition,
			include: {
				venue: {
					include: {
						reviews: { select: { rating: true } },
					},
				},
			},
			skip,
			take: limit,
			orderBy: { id: "desc" },
		});

		const formattedVenues = favorites
			.map((fav: any) => {
				const venue = fav.venue;
				if (!venue) return null;

				const totalReviews = venue.reviews ? venue.reviews.length : 0;
				let averageRating = 0;

				if (totalReviews > 0) {
					const sum = venue.reviews.reduce(
						(acc: number, item: any) => acc + item.rating,
						0,
					);
					averageRating = Number((sum / totalReviews).toFixed(1));
				}

				const { reviews, ...venueData } = venue;

				return {
					...venueData,
					mainImage: venue.mainImage || null,
					isFavorite: true,
					rating: averageRating,
					reviewCount: totalReviews,
				};
			})
			.filter(Boolean);

		const totalPages = Math.ceil(totalItems / limit);

		return NextResponse.json(
			{
				venues: formattedVenues,
				pagination: {
					currentPage: page,
					totalPages: totalPages || 1,
					totalItems,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
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
	if (!user)
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);

	try {
		const { venueId } = await request.json();
		if (!venueId)
			return NextResponse.json(
				{ message: "ID закладу обов’язковий" },
				{ status: 400 },
			);

		const existing = await prisma.favorite.findFirst({
			where: { userId: user.userId, venueId },
		});

		if (existing)
			return NextResponse.json({ message: "Вже в обраному" }, { status: 400 });

		await prisma.favorite.create({
			data: { userId: user.userId, venueId },
		});

		return NextResponse.json(
			{ message: "Додано до обраного!" },
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const user = await verifyAuth(request);
	if (!user)
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);

	try {
		const { venueId } = await request.json();
		if (!venueId)
			return NextResponse.json(
				{ message: "ID закладу обов’язковий" },
				{ status: 400 },
			);

		const favorite = await prisma.favorite.findFirst({
			where: { userId: user.userId, venueId },
		});

		if (!favorite)
			return NextResponse.json(
				{ message: "Заклад не знайдено в обраному" },
				{ status: 404 },
			);

		await prisma.favorite.delete({
			where: { id: favorite.id },
		});

		return NextResponse.json(
			{ message: "Видалено з обраного" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
