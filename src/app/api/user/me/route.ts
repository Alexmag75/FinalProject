import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
	const tokenUser = await verifyAuth(request);

	if (!tokenUser) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const currentUser = await prisma.user.findUnique({
			where: { id: tokenUser.userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				avatarUrl: true,
				phoneNumber: true,
				createdAt: true,
			},
		});

		if (!currentUser) {
			return NextResponse.json(
				{ message: "Користувача не знайдено" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ user: currentUser }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
