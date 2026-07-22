
import { getDistance } from "@/lib/geo";
import { verifyAuth } from "@/lib/auth";
import { moveFileToPermanent } from "@/src/helpers/moveFile";
import { UserRole } from "@/src/enums/userRole.";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {VenueType} from "@prisma/client";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "9", 10);

		let user = null;
		try {
			user = await verifyAuth(request);
		} catch (e) {
			user = null;
		}

		const andConditions: any[] = [];
		const myOwn = searchParams.get("myOwn") === "true";

		if (user && user.role === "MANAGER") {
			if (myOwn) {
				andConditions.push({ userId: user.userId });
			} else {
				andConditions.push({
					OR: [{ isApproved: true }, { userId: user.userId }],
				});
			}
		} else if (user && user.role === "SUPERADMIN") {
			if (myOwn) {
				andConditions.push({ userId: user.userId });
			}
		} else {
			andConditions.push({ isApproved: true });
		}

		const search = searchParams.get("search") || "";
		const type = searchParams.get("type") || "";
		const minCheck = searchParams.get("minCheck");
		const maxCheck = searchParams.get("maxCheck");
		const tag = searchParams.get("tag");
		const tags = searchParams.get("tags");

		const hasWifi = searchParams.get("hasWifi") === "true";
		const hasParking = searchParams.get("hasParking") === "true";
		const hasLiveMusic =
			searchParams.get("hasLiveMusic") === "true" ||
			searchParams.get("hasMusic") === "true";

		const sortBy = searchParams.get("sortBy") || "createdAt";
		const order = searchParams.get("order") === "asc" ? "asc" : "desc";
		const lat = searchParams.get("lat")
			? parseFloat(searchParams.get("lat")!)
			: null;
		const lng = searchParams.get("lng")
			? parseFloat(searchParams.get("lng")!)
			: null;

		if (type) {
			const upperType = type.toUpperCase();
			const validTypes = Object.values(VenueType) as string[];

			if (validTypes.includes(upperType)) {
				andConditions.push({ type: upperType as VenueType });
			} else {
				const allTags = await prisma.tag.findMany({
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				});
				return NextResponse.json(
					{
						venues: [],
						allTags,
						pagination: {
							currentPage: 1,
							totalPages: 0,
							totalItems: 0,
							hasNextPage: false,
							hasPrevPage: false,
						},
					},
					{ status: 200 }
				);
			}
		}

		if (minCheck || maxCheck) {
			const checkFilter: any = {};
			if (minCheck) checkFilter.gte = parseInt(minCheck, 10);
			if (maxCheck) checkFilter.lte = parseInt(maxCheck, 10);
			andConditions.push({ averageCheck: checkFilter });
		}

		if (hasWifi) andConditions.push({ hasWifi: true });
		if (hasParking) andConditions.push({ hasParking: true });
		if (hasLiveMusic) andConditions.push({ hasMusic: true });

		let tagsArray: string[] = [];
		if (tag) tagsArray.push(tag.trim());
		if (tags) {
			const parsedTags = tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);
			tagsArray = [...tagsArray, ...parsedTags];
		}

		if (tagsArray.length > 0) {
			andConditions.push({
				tags: {
					some: {
						name: { in: tagsArray },
					},
				},
			});
		}

		if (search) {
			andConditions.push({
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{
						tags: {
							some: {
								name: { contains: search, mode: "insensitive" },
							},
						},
					},
				],
			});
		}

		const whereCondition =
			andConditions.length > 0 ? { AND: andConditions } : {};

		let orderByCondition: any = {};
		if (sortBy === "rating") orderByCondition = { rating: order };
		else if (sortBy === "averageCheck")
			orderByCondition = { averageCheck: order };
		else if (sortBy === "name") orderByCondition = { name: order };
		else if (sortBy === "createdAt") orderByCondition = { createdAt: order };

		let allVenues = await prisma.venue.findMany({
			where: whereCondition,
			orderBy: sortBy !== "distance" ? orderByCondition : undefined,
			include: {
				tags: true,
				_count: { select: { reviews: true } },
			},
		});

		if (sortBy === "distance" && lat !== null && lng !== null) {
			allVenues = allVenues.map((venue: any) => {
				if (venue.latitude && venue.longitude) {
					venue.distance = getDistance(
						lat,
						lng,
						venue.latitude,
						venue.longitude
					);
				} else {
					venue.distance = Infinity;
				}
				return venue;
			});

			allVenues.sort((a: any, b: any) => {
				return order === "asc"
					? a.distance - b.distance
					: b.distance - a.distance;
			});
		}

		const totalItems = allVenues.length;
		const totalPages = Math.ceil(totalItems / limit);
		const validPage = Math.max(1, Math.min(page, totalPages || 1));

		const startIndex = (validPage - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedVenues = allVenues.slice(startIndex, endIndex);

		const allTags = await prisma.tag.findMany({
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});

		return NextResponse.json(
			{
				venues: paginatedVenues,
				allTags,
				pagination: {
					currentPage: validPage,
					totalPages,
					totalItems,
					hasNextPage: validPage < totalPages,
					hasPrevPage: validPage > 1,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Внутрішня помилка сервера" },
			{ status: 500 }
		);
	}
}
export async function POST(request: Request) {
	const user = await verifyAuth(request);

	if (!user) {
		return NextResponse.json(
			{ message: "Неавторизований доступ" },
			{ status: 401 },
		);
	}

	if (user.role !== UserRole.MANAGER && user.role !== UserRole.SUPERADMIN) {
		return NextResponse.json(
			{
				message:
					"У вас немає прав для створення закладу. Потрібна роль MANAGER.",
			},
			{ status: 403 },
		);
	}

	try {
		let {
			name,
			type,
			mainImage,
			images,
			address,
			workingHours,
			averageCheck,
			description,
			phone,
			tags,
			latitude,
			longitude,
			hasWifi,
			hasParking,
			hasLiveMusic,
		} = await request.json();

		if (
			!name ||
			!type ||
			!mainImage ||
			!address ||
			!workingHours ||
			!averageCheck
		) {
			return NextResponse.json(
				{
					message:
						"Заповніть усі обовʼязкові поля (назва, тип, фото, адреса, часи роботи, середній чек)",
				},
				{ status: 400 },
			);
		}

		if (mainImage) {
			mainImage = await moveFileToPermanent(mainImage);
		}

		if (images && images.length > 0) {
			images = await Promise.all(
				images.map((img: string) => moveFileToPermanent(img)),
			);
		}

		const tagsArray: string[] = Array.isArray(tags)
			? tags
			: tags
				? (tags as string)
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean)
				: [];

		const newVenue = await prisma.venue.create({
			data: {
				name,
				type,
				mainImage,
				images: Array.isArray(images) ? images : [],
				address,
				workingHours,
				averageCheck: parseInt(averageCheck.toString()),
				description,
				phone: phone || null,
				hasWifi: hasWifi === true,
				hasParking: hasParking === true,
				hasMusic: hasLiveMusic === true,

				tags: {
					connectOrCreate: tagsArray.map((tagName) => ({
						where: { name: tagName },
						create: { name: tagName },
					})),
				},

				latitude: latitude ? parseFloat(latitude.toString()) : null,
				longitude: longitude ? parseFloat(longitude.toString()) : null,
				userId: user.userId,
				isApproved: user.role === "SUPERADMIN",
			},
		});

		const successMessage = newVenue.isApproved
			? "Заклад успішно створено та опубліковано!"
			: "Заклад успішно створено та відправлено на модерацію до Адміністратора.";

		return NextResponse.json(
			{
				message: successMessage,
				venue: newVenue,
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
