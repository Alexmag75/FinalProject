import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(request: Request) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено: потрібні права супер-адміна" },
			{ status: 403 },
		);
	}

	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const skip = (page - 1) * limit;
		const search = searchParams.get("search") || "";
		const venueName = searchParams.get("venueName") || "";
		const rating = searchParams.get("rating") || "";
		const whereCondition: any = {};
		if (rating && rating !== "all") {
			whereCondition.rating = parseInt(rating, 10);
		}

		if (venueName && venueName !== "all") {
			whereCondition.venue = {
				name: venueName,
			};
		}
		if (search) {
			whereCondition.OR = [
				{ text: { contains: search, mode: "insensitive" } },
				{
					user: {
						name: { contains: search, mode: "insensitive" },
					},
				},
				{
					user: {
						email: { contains: search, mode: "insensitive" },
					},
				},
			];
		}
		const totalItems = await prisma.review.count({
			where: whereCondition,
		});

		const reviews = await prisma.review.findMany({
			where: whereCondition,
			select: {
				id: true,
				text: true,
				rating: true,
				createdAt: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},
				venue: {
					select: {
						name: true,
					},
				},
			},
			skip: skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		});

		const totalPages = Math.ceil(totalItems / limit);
		const pagination = {
			currentPage: page,
			totalPages: totalPages || 1,
			totalItems: totalItems,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		};

		return NextResponse.json({ reviews, pagination }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
