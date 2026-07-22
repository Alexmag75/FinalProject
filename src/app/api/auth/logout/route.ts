import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
	try {
		const cookies = request.headers.get("cookie") || "";
		const tokenMatch = cookies.match(/refreshToken=([^;]+)/);
		const refreshToken = tokenMatch ? tokenMatch[1] : null;

		if (refreshToken) {
			await prisma.session.delete({
				where: { token: refreshToken },
			});
		}
		const response = NextResponse.json(
			{ message: "Успішний вихід із системи" },
			{ status: 200 },
		);

		response.headers.set(
			"Set-Cookie",
			"refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure",
		);

		return response;
	} catch {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
