import { verifyAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { UserRole } from "@/src/enums/userRole.";

const prisma = new PrismaClient();

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ newsId: string }> }, // Указываем, что это Promise
) {
	try {
		const { newsId } = await params;
		const body = await request.json();
		const { title, content, category, image } = body;

		if (!title?.trim() || !content?.trim()) {
			return NextResponse.json(
				{ message: "Заголовок та вміст є обов'язковими" },
				{ status: 400 },
			);
		}

		const updatedNews = await prisma.news.update({
			where: { id: newsId },
			data: {
				title,
				content,
				category,
				image: image || null,
			},
		});

		return NextResponse.json(
			{
				message: "Успішно оновлено адміністратором",
				news: updatedNews,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера", error: error.message },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ newsId: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено: тільки для супер-адмінів" },
			{ status: 403 },
		);
	}

	try {
		const { newsId } = await params;
		await prisma.news.delete({
			where: { id: newsId },
		});

		return NextResponse.json(
			{ message: "Новину успішно видалено адміністратором" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Помилка при видаленні" },
			{ status: 500 },
		);
	}
}
