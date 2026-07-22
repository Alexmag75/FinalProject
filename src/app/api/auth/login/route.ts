import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password } = body;
		if (!email || !password) {
			return NextResponse.json(
				{ message: "Email та пароль є обовʼязковими" },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || !user.password) {
			return NextResponse.json(
				{ message: "Неправильний Email або пароль" },
				{ status: 401 },
			);
		}

		if (!user.isVerified) {
			return NextResponse.json(
				{ message: "Будь ласка, підтвердіть свій Email" },
				{ status: 403 },
			);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ message: "Неправильний Email або пароль" },
				{ status: 401 },
			);
		}

		const accessToken = jwt.sign(
			{ userId: user.id, email: user.email, role: user.role },
			process.env.JWT_ACCESS_SECRET!,
			{ expiresIn: "15m" },
		);

		const refreshToken = jwt.sign(
			{ userId: user.id },
			process.env.JWT_REFRESH_SECRET!,
			{ expiresIn: "7d" },
		);
		const response = NextResponse.json(
			{
				message: "Вхід успішний",
				accessToken,
				refreshToken,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
			},
			{ status: 200 },
		);

		response.cookies.set("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60,
			path: "/",
		});

		return response;
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
