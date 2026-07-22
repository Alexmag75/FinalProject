import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			include: {
				venues: {
					include: {
						venue: true,
					},
				},
			},
		});

		return NextResponse.json({ categories }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}
