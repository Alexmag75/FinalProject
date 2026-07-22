import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: venueId } = await params;

		const venueExists = await prisma.venue.findUnique({
			where: { id: venueId },
		});
		if (!venueExists) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		const recentView = await prisma.venueView.findFirst({
			where: {
				venueId: venueId,
				userIp: ip,
				createdAt: {
					gte: twentyFourHoursAgo,
				},
			},
		});

		if (recentView) {
			return NextResponse.json(
				{ message: "Перегляд вже зафіксовано за останні 24 години" },
				{ status: 200 },
			);
		}

		await prisma.venueView.create({
			data: {
				venueId: venueId,
				userIp: ip,
			},
		});

		return NextResponse.json(
			{ message: "Новий унікальний перегляд зафіксовано" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
