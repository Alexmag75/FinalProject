import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";

export async function POST(request: Request) {
	try {
		let refreshToken = null;
		const body = await request.json();
		refreshToken = body.refreshToken;

		if (!refreshToken) {
			const cookieToken = request.headers
				.get("cookie")
				?.split(";")
				.find((c) => c.trim().startsWith("refreshToken="))
				?.split("=")[1];

			refreshToken = cookieToken || null;
		}

		if (!refreshToken || refreshToken === "undefined") {
			return NextResponse.json(
				{ message: "Refresh токен відсутній" },
				{ status: 401 },
			);
		}

		let decoded: any;
		try {
			decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
		} catch (jwtError) {
			return NextResponse.json(
				{ message: "Refresh токен недійсний або прострочений" },
				{ status: 401 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user || user.isBanned) {
			return NextResponse.json(
				{ message: "Користувача не знайдено або забанено" },
				{ status: 401 },
			);
		}

		const newAccessToken = jwt.sign(
			{ userId: user.id, email: user.email, role: user.role },
			process.env.JWT_ACCESS_SECRET!,
			{ expiresIn: "15m" },
		);

		const newRefreshToken = jwt.sign(
			{ userId: user.id },
			process.env.JWT_REFRESH_SECRET!,
			{ expiresIn: "7d" },
		);

		const response = NextResponse.json(
			{
				accessToken: newAccessToken,
				backendRefreshSecretString: newRefreshToken, // 🎯 Тот самый ключ, который ждет фронтенд
			},
			{ status: 200 },
		);

		response.cookies.set("refreshToken", newRefreshToken, {
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
