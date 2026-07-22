import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { id: venueId } = await params;
		const { newRating } = await request.json();

		if (typeof newRating !== "number" || newRating < 1 || newRating > 5) {
			return NextResponse.json(
				{ message: "Рейтинг має бути числом від 1 до 5" },
				{ status: 400 },
			);
		}

		await prisma.venue.update({
			where: { id: venueId },
			data: { rating: newRating },
		});

		return NextResponse.json({
			message: `Рейтинг закладу встановлено на ${newRating}`,
		});
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}
