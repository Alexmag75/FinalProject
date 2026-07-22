export type TabType = "edit-profile" | "favorites" | "comments" | "ratings";

export type NewsCategory = "GENERAL" | "PROMOTION" | "EVENT";

export const NewsCategory = {
	GENERAL: "GENERAL",
	PROMOTION: "PROMOTION",
	EVENT: "EVENT",
} as const;

export type BanFilter = "ALL" | "ACTIVE" | "BANNED";

export const BanFilter = {
	ALL: "ALL",
	ACTIVE: "ACTIVE",
	BANNED: "BANNED",
} as const;

export type RoleFilter = "ALL" | "USER" | "MANAGER" | "SUPERADMIN";

export const RoleFilter = {
	ALL: "ALL",
	USER: "USER",
	MANAGER: "MANAGER",
	SUPERADMIN: "SUPERADMIN",
} as const;

export type TypeVenues = "BAR" | "RESTAURANT" | "PUB" | "CAFE" | "CLUB" | "PIZZERIA" | "COFFEE_SHOP" | "SUSHI_BAR";

export const VENUE_TYPES = [
	{ value: "RESTAURANT", label: "Ресторан" },
	{ value: "CAFE", label: "Кафе" },
	{ value: "BAR", label: "Бар" },
	{ value: "PUB", label: "Паб" },
	{ value: "CLUB", label: "Клуб" },
	{ value: "PIZZERIA", label: "Піцерія" },
	{ value: "COFFEE_SHOP", label: "Кав'ярня" },
	{ value: "SUSHI_BAR", label: "Суші-бар" },
];

export type StatusVenues = "PENDING" | "APPROVED" | "REJECTED";

export const VENUE_STATUSES = {
	PENDING: "PENDING",
	APPROVED: "APPROVED",
	REJECTED: "REJECTED",
} as const;

