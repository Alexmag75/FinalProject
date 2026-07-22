import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password, name, role } = body;
		if (!email || !password) {
			return NextResponse.json(
				{ message: "Email та пароль є обовʼязковими" },
				{ status: 400 },
			);
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return NextResponse.json(
				{ message: "Користувач з таким Email вже існує" },
				{ status: 400 },
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				role: role || "USER",
				isVerified: false,
			},
		});

		const emailToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа жизни

		await prisma.verificationToken.create({
			data: {
				email,
				token: emailToken,
				expiresAt,
			},
		});

		try {
			await sendVerificationEmail(email, emailToken);
		} catch (mailError) {
			return NextResponse.json(
				{
					message:
						"Користувача створено, але не вдалося надіслати лист підтвердження.",
				},
				{ status: 201 },
			);
		}

		return NextResponse.json(
			{ message: "Реєстрація успішна. Будь ласка, перевірте вашу пошту." },
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
