import jwt from "jsonwebtoken";
import prisma from "@/lib/db";
import {RoleFilter} from "@/src/types/constants";
export interface AuthenticatedUser {
	userId: string;
	email: string;
	role: RoleFilter;
}
export async function verifyAuth(
	request: Request,
): Promise<AuthenticatedUser | null> {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return null;
		}
		const token = authHeader.split(" ")[1];
		if (!token) {
			return null;
		}
		const decoded = jwt.verify(
			token,
			process.env.JWT_ACCESS_SECRET!,
		) as AuthenticatedUser;
		const dbUser = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { isBanned: true, role: true, email: true },
		});
		if (!dbUser || dbUser.isBanned) {
			return null;
		}
		return {
			userId: decoded.userId,
			email: dbUser.email || decoded.email || "",
			role: (dbUser.role || decoded.role || "USER") as RoleFilter,
		};
	} catch {
		return null;
	}
}
