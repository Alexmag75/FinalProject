import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(request: Request) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено. Тільки для адміністраторів" },
			{ status: 403 },
		);
	}
	try {
		const { searchParams } = new URL(request.url);
		const venueId = searchParams.get("venueId");
		const days = parseInt(searchParams.get("days") || "7");

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		startDate.setHours(0, 0, 0, 0);

		const whereCondition: any = {
			createdAt: { gte: startDate },
		};
		if (venueId) {
			whereCondition.venueId = venueId;
		}

		const views = await prisma.venueView.findMany({
			where: whereCondition,
			select: { createdAt: true },
			orderBy: { createdAt: "asc" },
		});

		const groupedData: { [date: string]: number } = {};

		for (let i = 0; i < days; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateString = d.toISOString().split("T")[0];
			groupedData[dateString] = 0;
		}

		views.forEach((view) => {
			const dateString = view.createdAt.toISOString().split("T")[0];
			if (groupedData[dateString] !== undefined) {
				groupedData[dateString]++;
			}
		});

		const chartData = Object.keys(groupedData)
			.map((date) => ({ date, count: groupedData[date] }))
			.sort((a, b) => a.date.localeCompare(b.date));

		return NextResponse.json(
			{
				periodDays: days,
				totalViews: views.length,
				chartData,
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
