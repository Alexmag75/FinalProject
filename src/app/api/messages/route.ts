import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { MessageType } from "@prisma/client";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { venueId, name, email, content, type } = body;

		if (!venueId || !name || !email || !content) {
			return NextResponse.json(
				{ message: "Усі поля (ім’я, email, текст) є обов’язковими" },
				{ status: 400 },
			);
		}

		const venueExists = await prisma.venue.findUnique({
			where: { id: venueId },
		});
		if (!venueExists) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		const messageType = Object.values(MessageType).includes(type)
			? type
			: MessageType.QUESTION;

		const newMessage = await prisma.venueMessage.create({
			data: {
				venueId,
				name,
				email,
				content,
				type: messageType,
			},
		});

		return NextResponse.json(
			{
				message: "Повідомлення успішно відправлено! Менеджер зв’яжется з вами.",
				data: newMessage,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	if (user.role === "USER") {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const typeFilter = searchParams.get("type");
		const whereCondition: any = {};

		if (
			typeFilter &&
			Object.values(MessageType).includes(typeFilter as MessageType)
		) {
			whereCondition.type = typeFilter as MessageType;
		}

		if (user.role === "MANAGER") {
			whereCondition.venue = {
				userId: user.userId,
			};
		}

		const messages = await prisma.venueMessage.findMany({
			where: whereCondition,
			include: {
				venue: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ messages }, { status: 200 });
	} catch (error) {
		console.error("Ошибка получения сообщений:", error);
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
