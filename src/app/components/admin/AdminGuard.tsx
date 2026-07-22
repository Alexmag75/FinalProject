"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@/src/enums/userRole.";
import { getAuthToken } from "@/src/helpers/auth";

export default function AdminGuard({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAdminAuth = async () => {
			try {
				const token = getAuthToken();
				if (!token) {
					router.push("/login");
					return;
				}
				const res = await fetch("/api/user/me", {
					headers: { Authorization: `Bearer ${token}` },
					credentials: "include",
				});

				if (!res.ok) {
					router.push("/login");
					return;
				}

				const data = await res.json();
				if (data.user?.role !== UserRole.SUPERADMIN) {
					toast.error("Доступ заборонено! У вас немає прав адміністратора.");
					setTimeout(() => {
						router.push("/");
					}, 1200);
					return;
				}
				setIsAuthorized(true);
			} catch (error) {
				console.error("Admin Auth Error:", error);
				router.push("/login");
			} finally {
				setIsLoading(false);
			}
		};

		void checkAdminAuth();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 gap-2">
				<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				<p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
					Перевірка прав доступу...
				</p>
			</div>
		);
	}
	return isAuthorized ? <>{children}</> : null;
}
