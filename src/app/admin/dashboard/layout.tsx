import AdminGuard from "@/src/app/components/admin/AdminGuard";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
	title: "Панель Суперадміна | Piyachok",
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AdminGuard>
			<div className="min-h-screen bg-slate-50 text-slate-950 flex">
				{children}
			</div>
		</AdminGuard>
	);
}
