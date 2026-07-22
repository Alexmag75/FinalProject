import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@/src/enums/userRole.";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ reviewId: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	}

	try {
		const { reviewId } = await params;
		const { text } = await request.json();
		const updatedReview = await prisma.review.update({
			where: { id: reviewId },
			data: { text },
		});

		return NextResponse.json({
			message: "Відгук відредаговано адміністратором",
			review: updatedReview,
		});
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ reviewId: string }> },
) {
	const user = await verifyAuth(request);
	if (!user || user.role !== "SUPERADMIN")
		return NextResponse.json({ message: "Доступ заборонено" }, { status: 403 });
	try {
		const { reviewId } = await params;
		await prisma.review.delete({ where: { id: reviewId } });
		return NextResponse.json({ message: "Відгук видалено адміністратором" });
	} catch (error) {
		return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
	}
}
