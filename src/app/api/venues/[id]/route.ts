import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createVenueSchema } from "@/src/lib/validations";
import { moveFileToPermanent } from "@/src/helpers/moveFile";
import { UserRole } from "@/src/enums/userRole.";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await verifyAuth(request).catch(() => null);
		const venue = await prisma.venue.findUnique({
			where: { id },

			include: {
				tags: true,
				news: {
					orderBy: { createdAt: "desc" },
				},
				reviews: {
					include: {
						user: { select: { name: true } },
					},
					orderBy: { createdAt: "desc" },
				},
			},
		});

		if (!venue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		const totalViews = await prisma.venueView.count({
			where: { venueId: id },
		});

		let isFavorite = false;
		if (user) {
			const fav = await prisma.favorite.findUnique({
				where: {
					userId_venueId: {
						userId: user.userId,
						venueId: id,
					},
				},
			});
			isFavorite = !!fav;
		}
		const venueWithLiveViews = {
			...venue,
			views: totalViews,
			isFavorite: isFavorite,
		};
		return NextResponse.json({ venue: venueWithLiveViews }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const { id } = await params;

		const existingVenue = await prisma.venue.findUnique({
			where: { id },
		});

		if (!existingVenue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		if (
			user.role !== UserRole.SUPERADMIN &&
			existingVenue.userId !== user.userId
		) {
			return NextResponse.json(
				{ message: "У вас немає прав для редагування цього закладу" },
				{ status: 403 },
			);
		}

		const body = await request.json();

		const {
			name,
			type,
			mainImage,
			images,
			address,
			workingHours,
			averageCheck,
			phone,
			hasWifi,
			hasParking,
			hasLiveMusic,
			tags,
			latitude,
			longitude,
		} = body;

		const validation = createVenueSchema.partial().safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{ message: validation.error.issues[0].message },
				{ status: 400 },
			);
		}

		const updateData: any = {};

		if (mainImage !== undefined && mainImage !== null) {
			updateData.mainImage = await moveFileToPermanent(mainImage);
		}

		if (images !== undefined && Array.isArray(images)) {
			updateData.images = await Promise.all(
				images.map((img: string) => moveFileToPermanent(img)),
			);
		}

		if (name !== undefined) updateData.name = name;
		if (type !== undefined) updateData.type = type;
		if (address !== undefined) updateData.address = address;
		if (workingHours !== undefined) updateData.workingHours = workingHours;
		if (phone !== undefined) updateData.phone = phone || null;

		if (averageCheck !== undefined) {
			updateData.averageCheck = parseInt(averageCheck.toString());
		}

		if (hasWifi !== undefined) updateData.hasWifi = hasWifi === true;
		if (hasParking !== undefined) updateData.hasParking = hasParking === true;
		if (hasLiveMusic !== undefined) updateData.hasMusic = hasLiveMusic === true;

		if (latitude !== undefined) {
			updateData.latitude = latitude ? parseFloat(latitude.toString()) : null;
		}
		if (longitude !== undefined) {
			updateData.longitude = longitude
				? parseFloat(longitude.toString())
				: null;
		}

		if (tags !== undefined) {
			const tagsArray: string[] = Array.isArray(tags)
				? tags
				: tags
					? (tags as string)
							.split(",")
							.map((t) => t.trim())
							.filter(Boolean)
					: [];

			updateData.tags = {
				set: [],
				connectOrCreate: tagsArray.map((tagName) => ({
					where: { name: tagName },
					create: { name: tagName },
				})),
			};
		}

		const updatedVenue = await prisma.venue.update({
			where: { id },
			data: updateData,
			include: { tags: true },
		});

		return NextResponse.json(
			{
				message: "Заклад успішно відредаговано!",
				venue: updatedVenue,
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

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await verifyAuth(request);
	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	try {
		const { id } = await params;

		const existingVenue = await prisma.venue.findUnique({
			where: { id },
		});

		if (!existingVenue) {
			return NextResponse.json(
				{ message: "Заклад не знайдено" },
				{ status: 404 },
			);
		}

		if (user.role !== "SUPERADMIN" && existingVenue.userId !== user.userId) {
			return NextResponse.json(
				{ message: "У вас немає прав для видалення цього закладу" },
				{ status: 403 },
			);
		}

		await prisma.venue.delete({
			where: { id },
		});

		return NextResponse.json(
			{
				message: "Заклад та всі пов’язані з ним дані успішно видалено!",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Ошибка удаления заведения:", error);
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 },
		);
	}
}
