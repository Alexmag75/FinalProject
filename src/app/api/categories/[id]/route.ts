import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ message: "ID категорії не вказано" },
				{ status: 400 },
			);
		}
		const category = await prisma.category.findUnique({
			where: { id },
			include: {
				venues: {
					include: {
						venue: {
							select: {
								id: true,
								name: true,
								address: true,
								rating: true,
								isApproved: true,
							},
						},
					},
				},
			},
		});

		if (!category) {
			return NextResponse.json(
				{ message: "Категорію не знайдено" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ category }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
