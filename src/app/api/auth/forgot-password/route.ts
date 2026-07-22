import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json(
				{ message: "Email є обовʼязковим" },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user) {
			return NextResponse.json(
				{
					message:
						"Якщо цей Email зареєстрований, ви отримаєте лист для скидання пароля.",
				},
				{ status: 200 },
			);
		}

		await prisma.passwordResetToken.deleteMany({ where: { email } });
		const resetToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Срок жизни 1 час

		await prisma.passwordResetToken.create({
			data: {
				email,
				token: resetToken,
				expiresAt,
			},
		});

		await sendPasswordResetEmail(email, resetToken);

		return NextResponse.json(
			{ message: "Лист для скидання пароля успішно надіслано." },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
