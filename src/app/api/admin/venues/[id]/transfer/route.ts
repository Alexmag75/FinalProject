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
		return NextResponse.json(
			{ message: "Доступ заборонено: тільки для супер-адмінів" },
			{ status: 403 },
		);
	}

	try {
		const { id: venueId } = await params;
		const { newUserId } = await request.json();
		if (!newUserId) {
			return NextResponse.json(
				{ message: "ID нового власника не вказано" },
				{ status: 400 },
			);
		}
		const venue = await prisma.venue.findUnique({ where: { id: venueId } });
		if (!venue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
		if (!newUser) {
			return NextResponse.json(
				{ message: "Користувача-одержувача не знайдено" },
				{ status: 404 },
			);
		}

		await prisma.venue.update({
			where: { id: venueId },
			data: { userId: newUserId },
		});

		return NextResponse.json(
			{
				message: `Права на заклад успішно передані користувачу ${newUser.name || newUser.email}`,
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
