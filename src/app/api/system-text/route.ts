import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const slug = searchParams.get("slug");

		if (!slug) {
			return NextResponse.json(
				{ message: "Не вказано ідентифікатор сторінки (slug)" },
				{ status: 400 },
			);
		}

		const systemText = await prisma.systemText.findUnique({
			where: { slug: slug.toLowerCase() },
		});

		if (!systemText) {
			return NextResponse.json(
				{ message: "Текст для цієї сторінки ще не створено" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ systemText }, { status: 200 });
	} catch (error) {
		console.error("Ошибка получения системного текста:", error);
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	if (user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено. Тільки для Супер-Адміністратора" },
			{ status: 403 },
		);
	}

	try {
		const body = await request.json();
		const { slug, title, content } = body;

		if (!slug || !title || !content) {
			return NextResponse.json(
				{ message: "Усі поля (slug, title, content) є обов’язковими" },
				{ status: 400 },
			);
		}

		const updatedText = await prisma.systemText.upsert({
			where: { slug: slug.toLowerCase() },
			update: { title, content },
			create: { slug: slug.toLowerCase(), title, content },
		});

		return NextResponse.json(
			{
				message: "Системний текст успішно оновлено!",
				systemText: updatedText,
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
