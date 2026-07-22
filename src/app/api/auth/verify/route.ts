import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json({ message: "Токен відсутній" }, { status: 400 });
		}

		const tokenRecord = await prisma.verificationToken.findUnique({
			where: { token },
		});

		if (!tokenRecord) {
			return NextResponse.json(
				{ message: "Недійсний або прострочений токен" },
				{ status: 400 },
			);
		}

		if (new Date() > tokenRecord.expiresAt) {
			await prisma.verificationToken.delete({ where: { token } });
			return NextResponse.json(
				{ message: "Термін дії токена закінчився" },
				{ status: 400 },
			);
		}

		await prisma.user.update({
			where: { email: tokenRecord.email },
			data: { isVerified: true },
		});

		await prisma.verificationToken.delete({ where: { token } });

		return NextResponse.json(
			{
				message:
					"Email успішно підтверджено! Тепер ви можете увійти у свій аккаунт.",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Ошибка верификации:", error);
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
