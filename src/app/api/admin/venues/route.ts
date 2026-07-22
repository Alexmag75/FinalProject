import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { RoleFilter } from "@/src/types/constants";

export async function GET(request: Request) {
	const user = await verifyAuth(request);

	if (!user || user.role !== RoleFilter.SUPERADMIN) {
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
		const managerFilter = searchParams.get("managerFilter") || "ALL";
		const statusFilter = searchParams.get("statusFilter") || "ALL";
		const whereCondition: any = {};

		if (search) {
			whereCondition.OR = [
				{ name: { contains: search } },
				{ address: { contains: search } },
				{
					manager: {
						email: { contains: search },
					},
				},
			];
		}

		if (managerFilter === "WITH_MANAGER") {
			whereCondition.userId = { not: "" };
		} else if (managerFilter === "NO_MANAGER") {
			whereCondition.userId = "";
		}

		if (statusFilter === "APPROVED") {
			whereCondition.isApproved = true;
		} else if (statusFilter === "PENDING") {
			whereCondition.isApproved = false;
		}

		const totalItems = await prisma.venue.count({
			where: whereCondition,
		});

		const venues = await prisma.venue.findMany({
			where: whereCondition,
			include: {
				manager: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip: skip,
			take: limit,
		});

		const totalPages = Math.ceil(totalItems / limit);

		const pagination = {
			currentPage: page,
			totalPages: totalPages || 1,
			totalItems: totalItems,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		};

		return NextResponse.json({ venues, pagination }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
