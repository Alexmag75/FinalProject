import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const body = await request.json();
		const { name, email, avatarUrl, phoneNumber } = body;
		const updateData: any = {};

		if (name !== undefined) updateData.name = name;
		if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
		if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

		if (email !== undefined) {
			const emailTaken = await prisma.user.findUnique({
				where: { email },
			});

			if (emailTaken && emailTaken.id !== user.userId) {
				return NextResponse.json(
					{ message: "Цей email вже використовується іншим користувачем" },
					{ status: 400 },
				);
			}
			updateData.email = email;
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ message: "Немає даних для оновлення" },
				{ status: 400 },
			);
		}

		const updatedUser = await prisma.user.update({
			where: { id: user.userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				avatarUrl: true,
				phoneNumber: true,
			},
		});

		return NextResponse.json(
			{
				message: "Профіль успішно оновлено!",
				user: updatedUser,
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

