import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
	try {
		const tags = await prisma.tag.findMany({
			orderBy: { name: "asc" },
		});
		return NextResponse.json({ tags });
	} catch (error) {
		return NextResponse.json({ error: "Не вдалося отримати теги" }, { status: 500 });
	}
}
export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { name } = body;

		if (!name || typeof name !== "string") {
			return NextResponse.json(
				{ error: "Назва тегу є обов'язковою" },
				{ status: 400 }
			);
		}

		const cleanName = name.trim().toLowerCase();

		const tag = await prisma.tag.upsert({
			where: { name: cleanName },
			update: {},
			create: { name: cleanName },
		});

		return NextResponse.json(tag, { status: 201 });
	} catch (error) {
		console.error("POST /api/tags error:", error);
		return NextResponse.json(
			{ error: "Помилка при збереженні тегу у БД" },
			{ status: 500 }
		);
	}
}