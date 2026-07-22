import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(request: Request) {
	try {
		const tokenUser = (await verifyAuth(request)) as any;

		if (!tokenUser) {
			return NextResponse.json(
				{ message: "Неавторизований доступ" },
				{ status: 401 },
			);
		}

		const currentUserId = tokenUser.id || tokenUser.userId;

		if (!currentUserId) {
			return NextResponse.json(
				{ message: "Не вдалося визначити ID користувача" },
				{ status: 400 },
			);
		}

		await prisma.user.delete({
			where: { id: currentUserId },
		});

		const response = NextResponse.json(
			{ message: "Акаунт та всі повʼязані дані успішно видалено" },
			{ status: 200 },
		);

		response.headers.set(
			"Set-Cookie",
			"refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure",
		);

		return response;
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
