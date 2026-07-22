import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";


export async function GET(request: Request) {
	const currentUser = await verifyAuth(request);
	if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{ message: "Доступ заборонено. Тільки для Супер-Адміністратора" },
			{ status: 403 },
		);
	}

	try {
		const pendingVenues = await prisma.venue.findMany({
			where: { isApproved: false },
			include: {
				manager: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		return NextResponse.json({ venues: pendingVenues }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
