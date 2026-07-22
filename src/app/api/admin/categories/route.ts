import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			include: {
				venues: {
					take: 4,
					include: {
						venue: {
							select: {
								id: true,
								name: true,
								address: true,
								rating: true,
							},
						},
					},
				},
			},
			orderBy: { name: "asc" },
		});

		return NextResponse.json({ categories }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}


export async function POST(request: Request) {
	const user = await verifyAuth(request);

	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { name, description } = await request.json();

		const category = await prisma.category.create({
			data: { name, description },
		});

		return NextResponse.json({ category }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}

export async function PATCH(request: Request) {
	const user = await verifyAuth(request);

	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { categoryId, venueId } = await request.json();

		await prisma.categoryOnVenues.create({
			data: { categoryId, venueId },
		});

		return NextResponse.json({ message: "Заклад додано до підбірки" });
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}
