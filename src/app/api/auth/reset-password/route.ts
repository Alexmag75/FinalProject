import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { token, newPassword } = body;

		if (!token || !newPassword) {
			return NextResponse.json(
				{ message: "Токен та новий пароль є обовʼязковими" },
				{ status: 400 },
			);
		}

		const passwordResetRecord = await prisma.passwordResetToken.findUnique({
			where: { token },
		});

		if (!passwordResetRecord) {
			return NextResponse.json(
				{ message: "Недійсний або прострочений токен" },
				{ status: 400 },
			);
		}

		const hasExpired = new Date() > passwordResetRecord.expiresAt;
		if (hasExpired) {
			await prisma.passwordResetToken.delete({ where: { token } }); // Очистка мусора
			return NextResponse.json(
				{ message: "Час дії токену вичерпано" },
				{ status: 400 },
			);
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { email: passwordResetRecord.email },
			data: { password: hashedPassword },
		});

		await prisma.passwordResetToken.delete({ where: { token } });
		return NextResponse.json(
			{
				message:
					"Пароль успішно змінено. Тепер ви можете увійти з новим паролем.",
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
