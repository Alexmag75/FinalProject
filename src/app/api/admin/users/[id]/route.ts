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
		const { role, isBanned } = body;

		if (id === currentUser.userId) {
			return NextResponse.json(
				{ message: "Ви не можете змінити статус власного акаунту" },
				{ status: 400 },
			);
		}

		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) {
			return NextResponse.json(
				{ message: "Користувача не знайдено" },
				{ status: 404 },
			);
		}

		const updateData: any = {};

		if (role !== undefined) {
			if (["USER", "MANAGER", "SUPERADMIN"].includes(role)) {
				updateData.role = role;
			} else {
				return NextResponse.json({ message: "Недійсна роль" }, { status: 400 });
			}
		}

		if (isBanned !== undefined) {
			updateData.isBanned = isBanned;
			if (isBanned === true) {
				updateData.tokenVersion = { increment: 1 };
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id },
			data: updateData,
			select: { id: true, email: true, role: true, isBanned: true },
		});

		return NextResponse.json(
			{ message: "Дані користувача успішно оновлено", user: updatedUser },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/users/[id]
 * Полное удаление аккаунта и всех связанных данных (отзывы, встречи, заведения).
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN)
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });

	try {
		const { id: targetUserId } = await params;

		if (targetUserId === user.userId) {
			return NextResponse.json(
				{ message: "Ви не можете видалити свій власний акаунт" },
				{ status: 400 },
			);
		}

		await prisma.user.delete({ where: { id: targetUserId } });
		return NextResponse.json(
			{ message: "Користувач та всі його дані успішно видалені" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
