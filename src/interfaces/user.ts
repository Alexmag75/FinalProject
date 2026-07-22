import { UserRole } from "@/src/enums/userRole.";

export interface User {
	id: string;
	name?: string;
	email: string;
	role: UserRole;
	avatarUrl?: string | null;
	phoneNumber?: string | null;
	createdAt?: string;
}

export interface AdminUserItem extends User {
	role: UserRole;
	isBanned: boolean;
}
