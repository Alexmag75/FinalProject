import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const currentUser = await verifyAuth(request);
	if (!currentUser) {
		return NextResponse.json(
			{ message: "Неавторизований доступ або аккаунт заблоковано" },
			{ status: 401 },
		);
	}

	try {
		const { id: venueId } = await params;
		const body = await request.json();
		const { rating, text, isComplaint, complaintReason } = body;

		if (!rating || rating < 1 || rating > 5) {
			return NextResponse.json(
				{ message: "Оцінка є обов’язковою і має бути від 1 до 5 зірок" },
				{ status: 400 },
			);
		}

		const venueExists = await prisma.venue.findUnique({
			where: { id: venueId },
		});
		if (!venueExists) {
			return NextResponse.json(
				{ message: "Обраний заклад не знайдено" },
				{ status: 404 },
			);
		}

		const result = await prisma.$transaction(async (tx) => {
			const newReview = await tx.review.create({
				data: {
					rating: parseInt(rating),
					text: text || "",
					userId: currentUser.userId,
					venueId: venueId,
					isComplaint: isComplaint === true,
					complaintReason: isComplaint ? complaintReason : null,
				},
				include: {
					user: { select: { name: true } },
				},
			});

			const aggregations = await tx.review.aggregate({
				where: { venueId: venueId },
				_avg: {
					rating: true,
				},
			});

			const newAverageRating = aggregations._avg.rating || rating;

			await tx.venue.update({
				where: { id: venueId },
				data: {
					rating: parseFloat(newAverageRating.toFixed(1)),
				},
			});

			return newReview;
		});

		const successMessage = isComplaint
			? "Скарга на обман успішно надіслана модераторам. Дякуємо за пильність!"
			: "Відгук успішно додано, рейтинг закладу оновлено!";

		return NextResponse.json(
			{
				message: successMessage,
				review: result,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
