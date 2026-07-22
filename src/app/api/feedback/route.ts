import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendFeedbackEmail } from "@/lib/mail";

export async function POST(request: Request) {
	try {
		const user = await verifyAuth(request);

		if (!user) {
			return NextResponse.json(
				{ message: "Неавторизований доступ. Будь ласка, увійдіть у систему." },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { name, email, category, message, venueId } = body;

		if (!name || !email || !category || !message) {
			return NextResponse.json(
				{ message: "Будь ласка, заповніть усі обов’язкові поля" },
				{ status: 400 },
			);
		}

		const userIdText = `Авторизований користувач (ID: ${user.userId}, Роль: ${user.role})`;

		let venueName = "Не вказано";
		if (venueId) {
			const venue = await prisma.venue.findUnique({
				where: { id: venueId },
				select: { name: true },
			});

			if (!venue) {
				return NextResponse.json(
					{ message: "Вказаний заклад не знайдено" },
					{ status: 404 },
				);
			}

			venueName = venue.name;
		}

		await sendFeedbackEmail({
			name,
			email,
			category,
			message,
			venueName,
			userIdText,
		});

		return NextResponse.json(
			{ message: "Ваше звернення успішно надіслано!" },
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера при відправці листа" },
			{ status: 500 },
		);
	}
}