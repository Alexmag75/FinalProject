"use client";

import { useState, useEffect } from "react";
import {
	Trash2,
	Ban,
	UserCheck,
	Search,
	Mail,
	Users,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { AdminUserItem } from "@/src/interfaces/user";
import { BanFilter, RoleFilter } from "@/src/types/constants";
import Pagination from "@/components/ui/pagination-custom";
import { getAuthToken } from "@/src/helpers/auth";

export default function UsersManagement() {
	const [users, setUsers] = useState<AdminUserItem[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [actionId, setActionId] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<BanFilter>("ALL");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const fetchUsers = async (
		page: number,
		search: string,
		role: string,
		status: string,
	) => {
		setIsLoading(true);
		try {
			const token = getAuthToken();
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "15",
				search: search,
				role: role !== RoleFilter.ALL ? role : "",
				status: status !== RoleFilter.ALL ? status : "",
			});

			const response = await fetch(`/api/admin/users?${params.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				const data = await response.json();
				setUsers(data.users || []);
				setPagination(data.pagination || null);
			}
		} catch (error) {
			toast.error("Не вдалося завантажити список користувачів");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
		void fetchUsers(1, searchQuery, roleFilter, statusFilter);
	}, [searchQuery, roleFilter, statusFilter]);

	useEffect(() => {
		void fetchUsers(currentPage, searchQuery, roleFilter, statusFilter);
	}, [currentPage]);

	const handleUpdateUser = async (
		id: string,
		payload: { role?: string; isBanned?: boolean },
	) => {
		setActionId(id);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/users/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			if (!response.ok) new Error(data.message || "Помилка оновлення");

			setUsers((prev) =>
				prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)),
			);

			if (payload.role) {
				toast.success(`Роль користувача змінено на ${payload.role}`);
			} else if (payload.isBanned !== undefined) {
				toast.success(
					payload.isBanned
						? "Користувача успішно заблоковано"
						: "Користувача успішно розблоковано",
				);
			}
		} catch (error: any) {
			toast.error(error.message || "Не вдалося оновити дані користувача");
		} finally {
			setActionId(null);
		}
	};

	const executeDeleteUser = async (id: string) => {
		setActionId(id);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/users/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				const data = await response.json();
				new Error(data.message || "Помилка видалення");
			}

			setUsers((prev) => prev.filter((u) => u.id !== id));
			toast.success("Акаунт та всі пов’язані дані остаточно видалено");
			void fetchUsers(currentPage, searchQuery, roleFilter, statusFilter);
		} catch (error: any) {
			toast.error(error.message || "Помилка при видаленні користувача");
		} finally {
			setActionId(null);
		}
	};

	const handleDeleteUser = (id: string, email: string) => {
		toast(`Видалити акаунт ${email} та ВСІ його дані?`, {
			action: {
				label: "Видалити",
				onClick: () => executeDeleteUser(id),
			},
			duration: 6000,
		});
	};

	return (
		<div className="space-y-4 text-xs font-medium">
			<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
				<div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
					<Search size={14} className="text-slate-400 shrink-0" />
					<input
						type="text"
						placeholder="Швидкий пошук за email або ім'ям..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 font-semibold"
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 border-t border-slate-100">
					<div className="flex items-center gap-2">
						<span className="font-bold text-slate-400">Роль:</span>
						<div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
							{(["ALL", "USER", "MANAGER", "SUPERADMIN"] as RoleFilter[]).map(
								(role) => (
									<button
										key={role}
										onClick={() => setRoleFilter(role)}
										className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
											roleFilter === role
												? "bg-white text-slate-900 shadow-sm"
												: "text-slate-500 hover:text-slate-900"
										}`}
									>
										{role === RoleFilter.ALL ? "Всі" : role}
									</button>
								),
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<span className="font-bold text-slate-400">Статус:</span>
						<div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
							{[
								{ key: "ALL", label: "Всі" },
								{ key: "ACTIVE", label: "Активні" },
								{ key: "BANNED", label: "Забанені" },
							].map((status) => (
								<button
									key={status.key}
									onClick={() => setStatusFilter(status.key as BanFilter)}
									className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
										statusFilter === status.key
											? status.key === "BANNED"
												? "bg-rose-600 text-white shadow-sm"
												: "bg-white text-slate-900 shadow-sm"
											: "text-slate-500 hover:text-slate-900"
									}`}
								>
									{status.label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
						<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
					</div>
				)}

				<div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-4">
					<span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
						<Users size={14} className="text-slate-400" />
						Всього користувачів: {pagination?.totalItems || users.length}
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-slate-200 bg-slate-100/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								<th className="py-2.5 px-4">Користувач</th>
								<th className="py-2.5 px-4">Поточна Роль</th>
								<th className="py-2.5 px-4 text-center">Статус</th>
								<th className="py-2.5 px-4 text-right">Дії модерації</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{users.length === 0 ? (
								<tr>
									<td
										colSpan={4}
										className="text-center py-8 text-slate-400 italic text-xs"
									>
										Користувачів із заданими фільтрами не знайдено
									</td>
								</tr>
							) : (
								users.map((u) => (
									<tr
										key={u.id}
										className={`hover:bg-slate-50/30 transition-colors ${u.isBanned ? "bg-rose-50/20" : ""}`}
									>
										<td className="py-2.5 px-4">
											<div className="font-bold text-slate-900">
												{u.name || "Без імені"}
											</div>
											<div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-normal">
												<Mail size={12} className="text-slate-400 shrink-0" />{" "}
												{u.email}
											</div>
										</td>
										<td className="py-2.5 px-4">
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
													u.role === "SUPERADMIN"
														? "bg-purple-100 text-purple-800"
														: u.role === "MANAGER"
															? "bg-blue-100 text-blue-800"
															: "bg-slate-100 text-slate-800"
												}`}
											>
												{u.role}
											</span>
										</td>
										<td className="py-2.5 px-4 text-center">
											{u.isBanned ? (
												<span className="text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
													Забанений
												</span>
											) : (
												<span className="text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
													Активний
												</span>
											)}
										</td>
										<td className="py-2.5 px-4 text-right whitespace-nowrap">
											<select
												disabled={actionId === u.id}
												value={u.role}
												onChange={(e) =>
													handleUpdateUser(u.id, { role: e.target.value })
												}
												className="bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-bold rounded p-1 inline-block h-7 mr-2 outline-none focus:border-amber-500 cursor-pointer"
											>
												<option value="USER">USER</option>
												<option value="MANAGER">MANAGER</option>
												<option value="SUPERADMIN">SUPERADMIN</option>
											</select>

											<Button
												size="sm"
												variant={u.isBanned ? "outline" : "ghost"}
												disabled={actionId === u.id}
												onClick={() =>
													handleUpdateUser(u.id, { isBanned: !u.isBanned })
												}
												className={`h-7 w-7 p-0 inline-flex items-center justify-center mr-1 rounded-lg transition-colors ${u.isBanned ? "text-emerald-600 hover:bg-emerald-50 border-emerald-200" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
												title={u.isBanned ? "Розблокувати" : "Заблокувати"}
											>
												{actionId === u.id ? (
													<Loader2 size={12} className="animate-spin" />
												) : u.isBanned ? (
													<UserCheck size={14} />
												) : (
													<Ban size={14} />
												)}
											</Button>

											<Button
												size="sm"
												variant="ghost"
												disabled={actionId === u.id}
												onClick={() => handleDeleteUser(u.id, u.email)}
												className="h-7 w-7 p-0 text-slate-400 hover:text-rose-700 hover:bg-rose-50 inline-flex items-center justify-center rounded-lg"
												title="Видалити назавжди"
											>
												<Trash2 size={14} />
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{pagination && pagination.totalPages > 1 && (
					<div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center">
						<Pagination
							currentPage={currentPage}
							totalPages={pagination.totalPages}
							onPageChange={(newPage) => setCurrentPage(newPage)}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
