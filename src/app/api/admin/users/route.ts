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
		const limit = parseInt(searchParams.get("limit") || "15", 10);
		const skip = (page - 1) * limit;
		const search = searchParams.get("search") || "";
		const role = searchParams.get("role") || "";
		const status = searchParams.get("status") || "";
		const whereCondition: any = {};

		if (role) {
			whereCondition.role = role;
		}

		if (status === "BANNED") {
			whereCondition.isBanned = true;
		} else if (status === "ACTIVE") {
			whereCondition.isBanned = false;
		}

		if (search) {
			whereCondition.OR = [
				{ email: { contains: search, mode: "insensitive" } },
				{ name: { contains: search, mode: "insensitive" } },
			];
		}

		const totalItems = await prisma.user.count({
			where: whereCondition,
		});

		const users = await prisma.user.findMany({
			where: whereCondition,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isBanned: true,
				createdAt: true,
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

		return NextResponse.json({ users, pagination }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
