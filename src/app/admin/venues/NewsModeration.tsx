"use client";

import React, { useState, useEffect, SyntheticEvent } from "react";
import {
	Check,
	X,
	Tag,
	Ticket,
	Info,
	Calendar,
	Edit2,
	Trash2,
	Loader2,
	Image as ImageIcon,
	ChevronLeft,
	ChevronRight,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminNewsItem } from "@/src/interfaces/news";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { apiFetch } from "@/src/lib/api";
import { getAuthToken } from "@/src/helpers/auth";
import {NewsCategory} from "@/src/types/constants";

export default function NewsModeration() {
	const [news, setNews] = useState<AdminNewsItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedStatus, setSelectedStatus] = useState("");
	const [editingItem, setEditingItem] = useState<AdminNewsItem | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
	const [editCategory, setEditCategory] = useState<
		"GENERAL" | "PROMOTION" | "EVENT"
	>("GENERAL");
	const [editImage, setEditImage] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const fetchAdminNews = async (page: number = 1) => {
		setIsLoading(true);
		setError("");
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "15",
				search: searchQuery,
				category: selectedCategory,
				status: selectedStatus,
			});

			const data = await apiFetch(`/admin/news?${params.toString()}`);

			setNews(data.news || []);
			setTotalPages(data.pagination?.totalPages || 1);
			setCurrentPage(data.pagination?.page || 1);
		} catch (err: any) {
			setError(err.message || "Не вдалося завантажити дані новин.");
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		void fetchAdminNews(currentPage);
	}, [currentPage]);

	const handleApplyFilters = (e: SyntheticEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		void fetchAdminNews(1);
	};

	const handleClearFilters = () => {
		setSearchQuery("");
		setSelectedCategory("");
		setSelectedStatus("");
		setCurrentPage(1);
	};

	useEffect(() => {
		setCurrentPage(1);
		void fetchAdminNews(1);
	}, [selectedCategory, selectedStatus]);

	const handleTogglePromote = async (
		newsId: string,
		currentStatus: boolean,
	) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/news/${newsId}/promote`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ isPromoted: !currentStatus }),
			});

			if (response.ok) {
				toast.success(
					currentStatus
						? "Публікацію деактивовано"
						: "Публікацію успішно активовано",
				);
				await fetchAdminNews(currentPage);
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Помилка оновлення статусу");
			}
		} catch (err) {
			toast.error("Не вдалося виконати операцію");
		}
	};
	const executeDeleteNews = async (newsId: string) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/news/${newsId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				toast.success("Публікацію успішно видалено адміністратором");
				const targetPage =
					news.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
				await fetchAdminNews(targetPage);
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Помилка при видаленні публікації");
			}
		} catch (err) {
			toast.error("Не вдалося виконати операцію видалення");
		}
	};
	const handleDeleteNews = (newsId: string, title: string) => {
		toast(`Остаточно видалити публікацію "${title}"?`, {
			action: {
				label: "Видалити",
				onClick: () => executeDeleteNews(newsId),
			},
			duration: 5000,
		});
	};

	const startEdit = (item: AdminNewsItem) => {
		setEditingItem(item);
		setEditTitle(item.title);
		setEditContent(item.content);
		setEditCategory(item.category);
		setEditImage(item.image || "");
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file, "news");
			if (!uploadedUrl) new Error("Не вдалося отримати посилання від S3");
			setEditImage(uploadedUrl);
			toast.success("Обкладинку завантажено");
		} catch (error: any) {

			toast.error(error.message || "Не вдалося завантажити фото");
			setEditImage("");
		} finally {
			setIsUploading(false);
		}
	};
	const handleSaveEdit = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!editingItem) return;
		if (!editTitle.trim() || !editContent.trim()) {
			toast.warning("Будь ласка, заповніть обов’язкові поля");
			return;
		}

		setIsSaving(true);
		try {
			const token = getAuthToken();
			const venueId = editingItem.venue?.id;

			const url = venueId
				? `/api/venues/${venueId}/news/${editingItem.id}`
				: `/api/admin/news/${editingItem.id}`;

			const response = await fetch(url, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title: editTitle,
					content: editContent,
					category: editCategory,
					image: editImage || null,
				}),
			});

			if (!response.ok) new Error("Помилка при оновленні");
			toast.success("Публікацію успішно оновлено адміністратором!");
			setEditingItem(null);
			await fetchAdminNews(currentPage);
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти зміни");
		} finally {
			setIsSaving(false);
		}
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("uk-UA", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (error)
		return (
			<div className="text-center py-8 text-xs text-rose-500 font-bold">
				{error}
			</div>
		);

	return (
		<div className="space-y-4 text-xs font-medium">
			<div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
				<p className="text-slate-400 font-bold text-[11px]">
					Тут відображаються всі новини, акції та події від закладів. Акції та
					Події з\'являються на сайті в загальному доступі тільки **після
					активації (оплати)**.
				</p>
			</div>
			<form
				onSubmit={handleApplyFilters}
				className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-end md:items-center justify-between gap-3"
			>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto flex-1">
					<div className="relative">
						<Search
							size={13}
							className="absolute left-2.5 top-2.5 text-slate-400"
						/>
						<input
							type="text"
							placeholder="Пошук за заголовком/текстом..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:outline-none focus:border-slate-400 placeholder:text-slate-400 font-semibold"
						/>
					</div>

					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:outline-none focus:border-slate-400 text-slate-600 font-bold"
					>
						<option value="">Усі категорії</option>
						<option value="GENERAL">📢 Новини</option>
						<option value="PROMOTION">🔥 Акції</option>
						<option value="EVENT">🎉 Події</option>
					</select>

					<select
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
						className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:outline-none focus:border-slate-400 text-slate-600 font-bold"
					>
						<option value="">Усі статуси</option>
						<option value="active">🟢 Активно / Оплачено</option>
						<option value="pending">🟡 Очікує оплати</option>
					</select>
				</div>

				<div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
					{(searchQuery || selectedCategory || selectedStatus) && (
						<Button
							type="button"
							variant="outline"
							onClick={handleClearFilters}
							className="h-8 text-[10px] font-bold border-slate-200 text-slate-500 rounded-lg"
						>
							Очистити
						</Button>
					)}
					<Button
						type="submit"
						className="h-8 bg-slate-950 text-white text-[10px] font-bold rounded-lg px-3 hover:bg-slate-800"
					>
						Знайти
					</Button>
				</div>
			</form>
			<div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
						<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
					</div>
				)}
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[900px]">
						<thead>
							<tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
								<th className="p-3">Заклад / Дата</th>
								<th className="p-3">Категорія</th>
								<th className="p-3">Заголовок та вміст</th>
								<th className="p-3">Статус активації</th>
								<th className="p-3 text-right">Дії</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-slate-700">
							{news.map((item) => (
								<tr
									key={item.id}
									className="hover:bg-slate-50/60 transition-colors"
								>
									<td className="p-3 w-[200px]">
										<div className="font-bold text-slate-800 truncate max-w-[180px]">
											{item.venue?.name || "Системна новина"}
										</div>
										<div className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5 mt-0.5">
											<Calendar size={10} /> {formatDate(item.createdAt)}
										</div>
									</td>
									<td className="p-3 w-[120px]">
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
												item.category === NewsCategory.GENERAL
													? "bg-slate-100 text-slate-600"
													: item.category === NewsCategory.PROMOTION
														? "bg-amber-50 text-amber-600 border border-amber-100"
														: "bg-indigo-50 text-indigo-600 border border-indigo-100"
											}`}
										>
											{item.category === NewsCategory.GENERAL ? (
												<Info size={10} />
											) : item.category === NewsCategory.PROMOTION ? (
												<Tag size={10} />
											) : (
												<Ticket size={10} />
											)}
											{item.category === NewsCategory.GENERAL
												? "Новина"
												: item.category === NewsCategory.PROMOTION
													? "Акція"
													: "Подія"}
										</span>
									</td>
									<td className="p-3 max-w-[300px]">
										<div className="font-bold text-slate-900 truncate">
											{item.title}
										</div>
										<div className="text-slate-400 font-normal text-[10px] truncate mt-0.5">
											{item.content}
										</div>
									</td>
									<td className="p-3 w-[150px]">
										{item.isPromoted ? (
											<span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 w-fit">
												<Check size={11} /> Активно
											</span>
										) : (
											<span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 w-fit">
												<X size={11} /> Очікує
											</span>
										)}
									</td>
									<td className="p-3 text-right w-[240px]">
										<div className="flex items-center justify-end gap-1.5">
											<Button
												onClick={() => startEdit(item)}
												variant="outline"
												className="h-7 px-2 rounded-lg text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
											>
												<Edit2 size={11} className="mr-1" /> Ред.
											</Button>
											<Button
												onClick={() => handleDeleteNews(item.id, item.title)}
												variant="outline"
												className="h-7 px-2 rounded-lg text-[10px] font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
											>
												<Trash2 size={11} className="mr-1" /> Видал.
											</Button>
											<Button
												onClick={() =>
													handleTogglePromote(item.id, item.isPromoted)
												}
												className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition shadow-sm ${
													item.isPromoted
														? "bg-rose-500 hover:bg-rose-600 text-white"
														: "bg-emerald-600 hover:bg-emerald-700 text-white"
												}`}
											>
												{item.isPromoted ? "Вимкнути" : "Активувати"}
											</Button>
										</div>
									</td>
								</tr>
							))}
							{news.length === 0 && !isLoading && (
								<tr>
									<td
										colSpan={5}
										className="p-8 text-center text-slate-400 italic"
									>
										Публікацій за вказаними фільтрами не знайдено.
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
			{editingItem && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
						<div>
							<h3 className="text-sm font-bold text-slate-900">
								Редагування публікації (Адмін-панель)
							</h3>
							<p className="text-[10px] text-slate-400">
								Заклад: {editingItem.venue?.name || "Система"}
							</p>
						</div>
						<form onSubmit={handleSaveEdit} className="space-y-3">
							<div className="space-y-1">
								<label className="text-[11px] font-bold text-slate-500 block">
									Категорія
								</label>
								<select
									value={editCategory}
									onChange={(e) => setEditCategory(e.target.value as any)}
									className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-400"
								>
									<option value="GENERAL">📢 Загальна новина</option>
									<option value="PROMOTION">🔥 Акція або Спецпропозиція</option>
									<option value="EVENT">🎉 Подія / Івент</option>
								</select>
							</div>
							<div className="space-y-1">
								<label className="text-[11px] font-bold text-slate-500 block">
									Заголовок *
								</label>
								<input
									type="text"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									maxLength={100}
									className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold focus:outline-none focus:border-slate-400"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-[11px] font-bold text-slate-500 block">
									Текст *
								</label>
								<textarea
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									rows={4}
									className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold resize-none focus:outline-none focus:border-slate-400"
								/>
							</div>
							<div className="space-y-1 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
								<label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
									<ImageIcon size={12} className="text-slate-400" /> Обкладинка
									новини
								</label>
								<input
									id="admin-news-image-input"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									disabled={isUploading || isSaving}
									className="w-full text-[11px] text-slate-400 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-600"
								/>
								{editImage && (
									<div className="relative h-16 w-full rounded-md overflow-hidden border border-slate-200 mt-2 group">
										<img
											src={editImage}
											alt="Preview"
											className="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setEditImage("");
												const input = document.getElementById(
													"admin-news-image-input",
												) as HTMLInputElement;
												if (input) input.value = "";
											}}
											className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X size={14} className="text-white" />
										</button>
									</div>
								)}
							</div>

							<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
								<Button
									type="button"
									variant="outline"
									onClick={() => setEditingItem(null)}
									className="h-8 text-[11px] px-3 border-slate-200 text-slate-600 rounded-lg"
								>
									Скасувати
								</Button>
								<Button
									type="submit"
									disabled={isSaving || isUploading}
									className="h-8 text-[11px] px-3 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 rounded-lg"
								>
									{isSaving && <Loader2 size={12} className="animate-spin" />}
									Зберегти
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
