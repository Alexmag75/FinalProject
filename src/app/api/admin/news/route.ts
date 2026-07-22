import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(request: Request) {
	const user = await verifyAuth(request);

	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "15", 10);
		const skip = (page - 1) * limit;
		const search = searchParams.get("search") || "";
		const category = searchParams.get("category") || "";
		const status = searchParams.get("status") || "";
		const whereClause: any = {};

		if (search) {
			whereClause.OR = [
				{ title: { contains: search } },
				{ content: { contains: search } },
			];
		}

		if (category && ["GENERAL", "PROMOTION", "EVENT"].includes(category)) {
			whereClause.category = category;
		}

		if (status === "active") {
			whereClause.isPromoted = true;
		} else if (status === "pending") {
			whereClause.isPromoted = false;
		}

		const totalCount = await prisma.news.count({ where: whereClause });
		const allNews = await prisma.news.findMany({
			where: whereClause,
			skip,
			take: limit,
			include: {
				venue: {
					select: { id: true, name: true, address: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(
			{
				news: allNews,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages: Math.ceil(totalCount / limit),
				},
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
