import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { GenderCriteria, PaymentCriteria } from "@prisma/client";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const venueId = searchParams.get("venueId");
		const companySize = searchParams.get("companySize");
		const maxBudget = searchParams.get("maxBudget");
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "9", 10);
		const skip = (page - 1) * limit;

		const whereCondition: any = {
			dateTime: {
				gte: new Date(new Date().setHours(0, 0, 0, 0)),
			},
		};

		if (venueId) {
			whereCondition.venueId = venueId;
		}

		if (companySize) {
			whereCondition.companySize = parseInt(companySize, 10);
		}

		if (maxBudget) {
			whereCondition.budget = {
				lte: parseFloat(maxBudget),
			};
		}

		const totalItems = await prisma.meetup.count({
			where: whereCondition,
		});

		const meetupsList = await prisma.meetup.findMany({
			where: whereCondition,
			include: {
				venue: {
					select: { name: true, address: true, mainImage: true },
				},
				user: {
					select: { id: true, name: true, avatarUrl: true },
				},
			},
			orderBy: {
				dateTime: "asc",
			},
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

		return NextResponse.json(
			{
				meetups: meetupsList,
				pagination,
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
export async function POST(request: Request) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ або ваш аккаунт заблокирован" },
			{ status: 401 },
		);
	}

	try {
		const body = await request.json();
		const {
			venueId,
			date,
			time,
			description,
			contactInfo,
			gender,
			companySize,
			whoPays,
			budget,
		} = body;

		if (!venueId || !date || !time || !contactInfo || !companySize || !budget) {
			return NextResponse.json(
				{ message: "Заповніть усі обов’язкові критерії" },
				{ status: 400 },
			);
		}

		const venueExists = await prisma.venue.findUnique({
			where: { id: venueId },
		});
		if (!venueExists) {
			return NextResponse.json(
				{ message: "Обраний заклад не знайдено" },
				{ status: 404 },
			);
		}

		const genderCriteria = Object.values(GenderCriteria).includes(gender)
			? gender
			: GenderCriteria.ANY;
		const paymentCriteria = Object.values(PaymentCriteria).includes(whoPays)
			? whoPays
			: PaymentCriteria.EACH_OWN;
		const combinedDateTime = new Date(`${date}T${time}:00`);

		const newMeetup = await prisma.meetup.create({
			data: {
				venueId,
				userId: user.userId,
				dateTime: combinedDateTime,
				description,
				contactInfo,
				gender: genderCriteria,
				companySize: parseInt(companySize),
				whoPays: paymentCriteria,
				budget: parseInt(budget),
			},
			include: {
				venue: { select: { name: true } },
			},
		});

		return NextResponse.json(
			{ message: "Зустріч «Пиячок» успішно створено!", meetup: newMeetup },
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
