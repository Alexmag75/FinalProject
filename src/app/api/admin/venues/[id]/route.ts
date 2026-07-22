import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const currentUser = await verifyAuth(request);
	if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено. Тільки для Супер-Адміністратора" },
			{ status: 403 },
		);
	}

	try {
		const { id } = await params;
		const body = await request.json();
		const { isApproved } = body;

		if (isApproved === undefined) {
			return NextResponse.json(
				{ message: "Параметр isApproved є обов’язковим" },
				{ status: 400 },
			);
		}

		const venue = await prisma.venue.findUnique({ where: { id } });
		if (!venue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		const updatedVenue = await prisma.venue.update({
			where: { id },
			data: { isApproved },
			select: { id: true, name: true, isApproved: true },
		});

		const statusMessage = isApproved
			? `Заклад "${updatedVenue.name}" успішно схвалено та опубліковано!`
			: `Заклад "${updatedVenue.name}" приховано/заблоковано.`;

		return NextResponse.json(
			{
				message: statusMessage,
				venue: updatedVenue,
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

export async function DELETE(
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
		const { id } = await params;
		await prisma.venue.delete({ where: { id } });
		return NextResponse.json(
			{ message: "Заклад успішно видалено адміністратором" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Помилка при видаленні" },
			{ status: 500 },
		);
	}
}
