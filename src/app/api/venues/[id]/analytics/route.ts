import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const { id: venueId } = await params;
		const venue = await prisma.venue.findUnique({
			where: { id: venueId },
			select: { userId: true },
		});

		if (!venue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		if (user.role !== "SUPERADMIN" && venue.userId !== user.userId) {
			return NextResponse.json(
				{ message: "У вас немає прав для перегляду статистики" },
				{ status: 403 },
			);
		}

		const views = await prisma.venueView.groupBy({
			by: ["createdAt"],
			where: { venueId },
			_count: {
				id: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const stats = views.map((v) => ({
			date: v.createdAt.toISOString().split("T")[0],
			count: v._count.id,
		}));

		return NextResponse.json({ stats }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
