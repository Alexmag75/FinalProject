import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "1", 10);
		const skip = (page - 1) * limit;
		const onlyRatings = searchParams.get("onlyRatings") === "true";
		const whereCondition: any = { userId: user.userId };

		if (onlyRatings) {
			whereCondition.rating = {
				gt: 0,
			};
		}

		const totalItems = await prisma.review.count({
			where: whereCondition,
		});

		const reviews = await prisma.review.findMany({
			where: whereCondition,
			include: {
				venue: {
					select: {
						id: true,
						name: true,
						mainImage: true,
						type: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
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

		return NextResponse.json({ reviews, pagination }, { status: 200 });
	} catch (error) {
		console.error("Помилка при отриманні відгуків/оцінок:", error);
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
		const { searchParams } = new URL(request.url);
		const reviewId = searchParams.get("id");
		if (!reviewId)
			return NextResponse.json(
				{ message: "ID відгуку не вказано" },
				{ status: 400 },
			);

		const review = await prisma.review.findUnique({ where: { id: reviewId } });
		if (!review || review.userId !== user.userId) {
			return NextResponse.json(
				{ message: "Відгук не знайдено або доступ заборонено" },
				{ status: 403 },
			);
		}

		await prisma.review.delete({ where: { id: reviewId } });
		return NextResponse.json(
			{ message: "Відгук успішно видалено" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
