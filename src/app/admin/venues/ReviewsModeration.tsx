"use client";

import { useState, useEffect } from "react";
import {
	MessageSquare,
	Trash2,
	Edit2,
	Check,
	X,
	Calendar,
	User,
	Star,
	Search,
	Filter,
	SlidersHorizontal,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { ReviewItem } from "@/src/interfaces/review";
import Pagination from "@/components/ui/pagination-custom";
import { getAuthToken } from "@/src/helpers/auth";

export default function ReviewsModeration() {
	const [reviews, setReviews] = useState<ReviewItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editText, setEditText] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedVenue, setSelectedVenue] = useState("all");
	const [selectedRating, setSelectedRating] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const fetchReviews = async (
		page: number,
		search: string,
		venue: string,
		rating: string,
	) => {
		setIsLoading(true);
		try {
			const token = getAuthToken();
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "10",
				search: search,
				venueName: venue,
				rating: rating,
			});

			const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				const data = await response.json();
				setReviews(data.reviews || []);
				setPagination(data.pagination || null);
			}
		} catch (error) {
			toast.error("Не вдалося завантажити список відгуків");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
		void fetchReviews(1, searchQuery, selectedVenue, selectedRating);
	}, [searchQuery, selectedVenue, selectedRating]);

	useEffect(() => {
		void fetchReviews(currentPage, searchQuery, selectedVenue, selectedRating);
	}, [currentPage]);

	const handleUpdateReview = async (reviewId: string) => {
		if (!editText.trim()) {
			toast.warning("Текст відгуку не може бути порожнім");
			return;
		}
		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/reviews/${reviewId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ text: editText }),
			});

			if (!response.ok) new Error("Не вдалося зберегти зміни");

			setReviews((prev) =>
				prev.map((r) => (r.id === reviewId ? { ...r, text: editText } : r)),
			);
			setEditingId(null);
			toast.success("Відгук успішно відредаговано");
		} catch (error) {
			toast.error("Помилка при редагуванні відгуку");
		} finally {
			setIsSaving(false);
		}
	};

	const executeDeleteReview = async (reviewId: string) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/reviews/${reviewId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) new Error("Не вдалося видалити відгук");

			setReviews((prev) => prev.filter((r) => r.id !== reviewId));
			toast.success("Відгук остаточно видалено");

			if (reviews.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void fetchReviews(
					currentPage,
					searchQuery,
					selectedVenue,
					selectedRating,
				);
			}
		} catch (error) {
			toast.error("Помилка при видаленні відгуку");
		}
	};

	const handleDeleteReview = (reviewId: string, authorName: string) => {
		toast(`Остаточно видалити відгук від "${authorName || "Анонім"}"?`, {
			action: {
				label: "Видалити",
				onClick: () => executeDeleteReview(reviewId),
			},
			duration: 5000,
		});
	};

	const startEditing = (id: string, text: string) => {
		setEditingId(id);
		setEditText(text);
	};

	const handleResetFilters = () => {
		setSearchQuery("");
		setSelectedVenue("all");
		setSelectedRating("all");
	};

	if (isLoading && reviews.length === 0) {
		return (
			<div className="p-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-medium">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				<span>Завантаження списку коментарів...</span>
			</div>
		);
	}

	return (
		<div className="space-y-4 text-xs font-medium">
			<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
				<div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider">
					<SlidersHorizontal size={14} className="text-amber-500" />
					<span>Панель фільтрації відгуків</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="relative">
						<Search
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<Input
							type="text"
							placeholder="Пошук за текстом чи автором..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 font-semibold"
						/>
					</div>

					<div className="relative">
						<Search
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<Input
							type="text"
							placeholder="Назва закладу (всі або точна назва)..."
							value={selectedVenue === "all" ? "" : selectedVenue}
							onChange={(e) => setSelectedVenue(e.target.value || "all")}
							className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 font-semibold"
						/>
					</div>

					<div>
						<select
							value={selectedRating}
							onChange={(e) => setSelectedRating(e.target.value)}
							className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 h-9 font-bold focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
						>
							<option value="all">⭐ Всі оцінки</option>
							{[5, 4, 3, 2, 1].map((num) => (
								<option key={num} value={num} className="font-semibold">
									{num} {num === 5 ? "зірок" : num > 1 ? "зірки" : "зірка"}
								</option>
							))}
						</select>
					</div>
				</div>

				{(searchQuery ||
					selectedVenue !== "all" ||
					selectedRating !== "all") && (
					<div className="flex justify-end pt-1">
						<button
							onClick={handleResetFilters}
							className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition"
						>
							Очистити всі фільтри
						</button>
					</div>
				)}
			</div>

			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
						<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
					</div>
				)}

				<div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MessageSquare size={15} className="text-amber-500" />
						<h3 className="text-xs font-bold text-slate-800">
							Центр модерації коментарів та оцінок
						</h3>
					</div>
					<span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full">
						Знайдено: {pagination?.totalItems || reviews.length}
					</span>
				</div>

				{reviews.length === 0 ? (
					<div className="text-center py-12 text-slate-400 italic text-xs flex flex-col items-center gap-1">
						<Filter size={20} className="text-slate-300" />
						<span>Нічого не знайдено за вказаними фільтрами</span>
					</div>
				) : (
					<>
						<div className="divide-y divide-slate-100">
							{reviews.map((review) => (
								<div
									key={review.id}
									className="p-4 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row justify-between items-start gap-3"
								>
									<div className="space-y-1.5 flex-1 w-full">
										<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
											<span className="font-bold text-slate-700 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
												<User size={12} className="text-slate-400" />{" "}
												{review.user?.name || "Анонім"}
											</span>
											{review.venue?.name && (
												<span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
													🏢 {review.venue.name}
												</span>
											)}
											<span className="text-amber-500 font-bold flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
												<Star size={11} fill="currentColor" /> {review.rating}
											</span>
											<span className="text-slate-400 flex items-center gap-1 ml-auto md:ml-0 font-semibold">
												<Calendar size={11} />{" "}
												{new Date(review.createdAt).toLocaleDateString("uk-UA")}
											</span>
										</div>

										{editingId === review.id ? (
											<div className="flex gap-2 items-center w-full mt-1">
												<Input
													value={editText}
													onChange={(e) => setEditText(e.target.value)}
													className="text-xs h-8 font-semibold"
													disabled={isSaving}
												/>
												<Button
													size="sm"
													onClick={() => handleUpdateReview(review.id)}
													disabled={isSaving}
													className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 h-8 w-8 shrink-0 rounded-lg"
												>
													{isSaving ? (
														<Loader2 size={14} className="animate-spin" />
													) : (
														<Check size={14} />
													)}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setEditingId(null)}
													disabled={isSaving}
													className="text-slate-400 hover:text-slate-600 p-1.5 h-8 w-8 shrink-0 rounded-lg"
												>
													<X size={14} />
												</Button>
											</div>
										) : (
											<p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 break-words leading-relaxed font-normal">
												{review.text}
											</p>
										)}
									</div>

									<div className="flex md:flex-col gap-1 w-full md:w-auto justify-end pt-1 md:pt-0">
										{editingId !== review.id && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => startEditing(review.id, review.text)}
												className="text-slate-600 hover:bg-slate-100 gap-1 text-[11px] h-7 flex-1 md:flex-initial justify-center rounded-lg font-bold border-slate-200"
											>
												<Edit2 size={12} /> Редагувати
											</Button>
										)}
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDeleteReview(review.id, review.user?.name || "")
											}
											className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg gap-1 text-[11px] h-7 flex-1 md:flex-initial justify-center font-bold"
										>
											<Trash2 size={12} /> Видалити
										</Button>
									</div>
								</div>
							))}
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
					</>
				)}
			</div>
		</div>
	);
}
