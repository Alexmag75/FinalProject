"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Search,
	Building2,
	User,
	Phone,
	MapPin,
	CheckCircle2,
	Pencil,
	Trash2,
	Loader2,
	ChevronLeft,
	ChevronRight,
	ShieldAlert,
	X,
} from "lucide-react";
import { AdminVenueItem } from "@/src/interfaces/venue";

export default function VenuesManagement() {
	const [venues, setVenues] = useState<AdminVenueItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [search, setSearch] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [managerFilter, setManagerFilter] = useState<string>("ALL");

	const fetchVenues = async (pageToFetch: number = 1) => {
		setIsLoading(true);
		try {
			const queryParams = new URLSearchParams({
				page: pageToFetch.toString(),
				limit: "10",
				search: search.trim(), // Убираем случайные пробелы по краям
				statusFilter: statusFilter,
				managerFilter: managerFilter,
			});

			const data = await apiFetch(`/admin/venues?${queryParams.toString()}`);

			if (data) {
				setVenues(data.venues || []);
				setTotalPages(data.pagination?.totalPages || 1);
				setCurrentPage(data.pagination?.page || 1);
			}
		} catch (error) {
			toast.error("Не вдалося завантажити список закладів");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchVenues(currentPage);
	}, [currentPage]);

	useEffect(() => {
		if (currentPage !== 1) {
			setCurrentPage(1);
		} else {
			void fetchVenues(1);
		}
	}, [statusFilter, managerFilter]);

	const handleSearchSubmit = (e: SyntheticEvent) => {
		e.preventDefault();
		if (currentPage !== 1) {
			setCurrentPage(1);
		} else {
			void fetchVenues(1);
		}
	};

	const handleToggleApprove = async (id: string, currentStatus: boolean) => {
		const newApprovedState = !currentStatus;
		const newStatus = newApprovedState ? "APPROVED" : "PENDING";

		try {
			await apiFetch(`/admin/venues/${id}`, {
				method: "PATCH",
				body: {
					isApproved: newApprovedState,
					status: newStatus
				},
			});
			toast.success(newApprovedState ? "Заклад схвалено!" : "Заклад відправлено на модерацію");
			setVenues((prev) =>
				prev.map((v) =>
					v.id === id
						? { ...v, isApproved: newApprovedState, status: newStatus }
						: v,
				),
			);
		} catch (error) {
			try {
				await apiFetch(`/venues/${id}`, {
					method: "PATCH",
					body: {
						isApproved: newApprovedState,
						status: newStatus
					},
				});

				toast.success(newApprovedState ? "Заклад схвалено!" : "Заклад відправлено на модерацію");

				setVenues((prev) =>
					prev.map((v) =>
						v.id === id
							? { ...v, isApproved: newApprovedState, status: newStatus }
							: v,
					),
				);
			} catch (err) {
				toast.error("Не вдалося змінити статус закладу в БД");
			}
		}
	};

	const handleClearSearch = () => {
		setSearch("");
		setCurrentPage(1);
		setIsLoading(true);
		const queryParams = new URLSearchParams({
			page: "1",
			limit: "10",
			search: "",
			statusFilter: statusFilter,
			managerFilter: managerFilter,
		});

		apiFetch(`/admin/venues?${queryParams.toString()}`)
			.then((data) => {
				if (data) {
					setVenues(data.venues || []);
					setTotalPages(data.pagination?.totalPages || 1);
					setCurrentPage(data.pagination?.page || 1);
				}
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	const executeDeleteVenue = async (id: string) => {
		try {
			await apiFetch(`/venues/${id}`, {
				method: "DELETE",
			});
			toast.success("Заклад успішно видалено");
			const targetPage =
				venues.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
			setCurrentPage(targetPage);
			void fetchVenues(targetPage);
		} catch (error) {
			toast.error("Не вдалося видалити заклад");
		}
	};

	const handleDeleteVenue = (id: string, name: string) => {
		toast(`Остаточно видалити заклад "${name}"?`, {
			action: {
				label: "Видалити",
				onClick: () => executeDeleteVenue(id),
			},
			cancel: {
				label: "Скасувати",
				onClick: () => toast.dismiss(),
			},
			duration: 7000,
		});
	};
	return (
		<div className="p-6 bg-slate-50/50 min-h-screen text-slate-900 text-xs font-medium antialiased space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
						<Building2 size={18} className="text-slate-500" />
						Управління закладами
					</h1>
					<p className="text-[11px] text-slate-400 mt-0.5">
						Повний список, модерація, пагінація та керування правами доступу.
					</p>
				</div>
				<div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200/60 text-amber-800 text-[11px] font-bold">
					<ShieldAlert size={13} />
					Режим: Супер-адмін
				</div>
			</div>
			<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
				<form
					onSubmit={handleSearchSubmit}
					className="flex flex-col gap-1.5 flex-1 min-w-[260px]"
				>
					<label className="font-bold text-slate-500 flex items-center gap-1">
						<Search size={12} /> Пошук закладу
					</label>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Назва, адреса або email..."
								className="w-full h-9 pl-3 pr-8 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors placeholder:text-slate-400 font-semibold"
							/>
							{search && (
								<button
									type="button"
									onClick={handleClearSearch}
									className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
									title="Очистити пошук"
								>
									<X size={14} />
								</button>
							)}
						</div>

						<button
							type="submit"
							className="h-9 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-sm transition-colors shrink-0"
						>
							Знайти
						</button>
					</div>
				</form>

				<div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
					<label className="font-bold text-slate-500 flex items-center gap-1">
						<CheckCircle2 size={12} /> Статус модерації
					</label>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer text-slate-600 font-bold"
					>
						<option value="ALL">Всі заклади</option>
						<option value="APPROVED">Схвалені (Активні)</option>
						<option value="PENDING">Очікують перевірки</option>
					</select>
				</div>

				<div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
					<label className="font-bold text-slate-500 flex items-center gap-1">
						<User size={12} /> Наявність менеджера
					</label>
					<select
						value={managerFilter}
						onChange={(e) => setManagerFilter(e.target.value)}
						className="w-full h-9 px-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors cursor-pointer text-slate-600 font-bold"
					>
						<option value="ALL">Всі</option>
						<option value="WITH_MANAGER">З менеджером</option>
						<option value="NO_MANAGER">Без менеджера</option>
					</select>
				</div>
			</div>
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
						<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
					</div>
				)}

				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
								<th className="p-4 w-[25%]">Назва / Опис</th>
								<th className="p-4 w-[12%]">Тип</th>
								<th className="p-4 w-[25%]">Контакти</th>
								<th className="p-4 w-[20%]">Менеджер</th>
								<th className="p-4 w-[10%] text-center">Модерація</th>
								<th className="p-4 w-[8%] text-center">Дії</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{venues.map((venue) => (
								<tr
									key={venue.id}
									className="hover:bg-slate-50/70 transition-colors"
								>
									<td className="p-4">
										<div className="font-bold text-slate-900 text-xs truncate max-w-[240px]">
											{venue.name}
										</div>
										{venue.description && (
											<div className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5 font-normal">
												{venue.description}
											</div>
										)}
									</td>

									<td className="p-4">
										<span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200/40">
											{venue.type}
										</span>
									</td>

									<td className="p-4 text-[11px] space-y-0.5 font-normal">
										<div className="text-slate-600 flex items-center gap-1">
											<MapPin size={11} className="text-slate-400 shrink-0" />
											<span className="truncate max-w-[200px]">
												{venue.address}
											</span>
										</div>
										<div className="text-slate-400 flex items-center gap-1 font-medium">
											<Phone size={11} className="text-slate-400 shrink-0" />
											{venue.phone}
										</div>
									</td>

									<td className="p-4 text-[11px]">
										{venue.manager ? (
											<div className="space-y-0.5">
												<div className="font-bold text-slate-800 flex items-center gap-1">
													<User size={11} className="text-slate-400" />
													{venue.manager.name}
												</div>
												<div className="text-slate-400 font-normal truncate max-w-[160px]">
													{venue.manager.email}
												</div>
											</div>
										) : (
											<span className="text-rose-500 bg-rose-50 border border-rose-100/70 px-2 py-0.5 rounded-md font-semibold text-[10px] italic">
												Не призначено
											</span>
										)}
									</td>

									<td className="p-4 text-center">
										<button
											onClick={() =>
												handleToggleApprove(venue.id, venue.isApproved)
											}
											className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all border ${
												venue.isApproved
													? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
													: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
											}`}
										>
											{venue.isApproved ? "Схвалено" : "Очікує"}
										</button>
									</td>

									<td className="p-4 text-center">
										<div className="flex items-center justify-center gap-1.5">
											<Link
												href={`/admin/venues/edit/${venue.id}`}
												className="h-7 px-2.5 border border-slate-200 bg-white hover:border-slate-300 text-slate-700 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm font-bold text-[11px]"
											>
												<Pencil size={11} className="text-slate-500" />
												Ред.
											</Link>
											<button
												onClick={() => handleDeleteVenue(venue.id, venue.name)}
												className="h-7 px-2.5 border border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-600 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm font-bold text-[11px]"
											>
												<Trash2 size={11} className="text-rose-500" />
												Видал.
											</button>
										</div>
									</td>
								</tr>
							))}
							{venues.length === 0 && !isLoading && (
								<tr>
									<td
										colSpan={6}
										className="p-8 text-center text-slate-400 italic"
									>
										Закладів за вказаними фільтрами не знайдено.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				{totalPages > 1 && (
					<div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
						<span className="text-slate-400 font-bold text-[10px]">
							Сторінка {currentPage} з {totalPages}
						</span>
						<div className="flex items-center gap-1">
							<Button
								size="sm"
								variant="outline"
								disabled={currentPage === 1 || isLoading}
								onClick={() => setCurrentPage((prev) => prev - 1)}
								className="h-6 w-6 p-0 rounded-md bg-white border-slate-200"
							>
								<ChevronLeft size={12} />
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={currentPage === totalPages || isLoading}
								onClick={() => setCurrentPage((prev) => prev + 1)}
								className="h-6 w-6 p-0 rounded-md bg-white border-slate-200"
							>
								<ChevronRight size={12} />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
