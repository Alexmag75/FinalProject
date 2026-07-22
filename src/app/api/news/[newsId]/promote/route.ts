import { verifyAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ newsId: string }> },
) {
	const user = await verifyAuth(request);

	if (!user || user.role !== "SUPERADMIN") {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { newsId } = await params;
		const { isPromoted } = await request.json();

		const updatedNews = await prisma.news.update({
			where: { id: newsId },
			data: { isPromoted },
		});

		return NextResponse.json({
			message: "Статус просування оновлено",
			isPromoted: updatedNews.isPromoted,
		});
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
