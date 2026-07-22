"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Trash2, Loader2, Calendar, Utensils } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { RatingItem } from "@/src/interfaces/rating";
import Pagination from "@/components/ui/pagination-custom";

export default function UserRatings() {
	const [ratings, setRatings] = useState<RatingItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const loadRatings = async (pageNumber: number) => {
		setIsLoading(true);
		const token =
			typeof window !== "undefined" ? localStorage.getItem("token") : null;
		if (!token) {
			setIsLoading(false);
			return;
		}
		try {
			const data = await apiFetch(
				`/user/reviews?page=${pageNumber}&limit=6&onlyRatings=true`,
			);
			setRatings(data.reviews || []);
			setPagination(data.pagination || null);
		} catch (error) {
			toast.error("Не вдалося завантажити ваші оцінки");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadRatings(currentPage);
	}, [currentPage]);

	const executeDeleteRating = async (ratingId: string) => {
		setDeletingId(ratingId);
		try {
			await apiFetch(`/user/reviews?id=${ratingId}`, { method: "DELETE" });
			toast.success("Оцінку успішно видалено");

			if (ratings.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void loadRatings(currentPage);
			}
		} catch (error) {
			toast.error("Не вдалося видалити оцінку");
		} finally {
			setDeletingId(null);
		}
	};

	const handleDeleteClick = (ratingId: string) => {
		toast("Ви впевнені, що хочете видалити цю оцінку?", {
			description: "Цю дію неможливо буде скасувати.",
			action: {
				label: "Видалити",
				onClick: () => executeDeleteRating(ratingId),
			},
			duration: 5000,
		});
	};

	if (isLoading && ratings.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
			</div>
		);
	}

	if (ratings.length === 0) {
		return (
			<div className="text-center py-16 bg-slate-50 border border-dashed border-slate-100 rounded-2xl text-xs font-medium">
				<Star className="h-10 w-10 text-slate-300 mx-auto mb-3" />
				<h3 className="text-sm font-bold text-slate-700">
					Ви ще не ставили оцінок
				</h3>
				<p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
					Оцінюйте заклади, які ви відвідали, щоб допомогти іншим користувачам
					знайти найкращі місця!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-slate-900 relative text-xs font-medium">
			<div id="ratings-tab-top" className="absolute -top-6 left-0" />

			<div>
				<h2 className="text-lg font-bold text-slate-900">Мої оцінки</h2>
				<p className="text-[11px] text-slate-500">
					Всі виставлені вами зіркові рейтинги для закладів
				</p>
			</div>

			{isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{ratings.map((item) => (
							<div
								key={item.id}
								className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition flex items-center justify-between"
							>
								<div className="space-y-1.5 min-w-0 flex-1">
									<Link
										href={`/venues/${item.venue.id}`}
										className="font-bold text-slate-800 hover:text-blue-600 transition text-sm flex items-center gap-1.5 truncate"
									>
										<Utensils className="h-3.5 w-3.5 text-slate-400 shrink-0" />
										<span className="truncate">{item.venue.name}</span>
									</Link>

									<div className="flex items-center space-x-3">
										<div className="flex items-center space-x-0.5">
											{[...Array(5)].map((_, i) => (
												<Star
													key={i}
													className={`h-4 w-4 ${i < item.rating ? "text-amber-400 fill-amber-400" : "text-slate-100"}`}
												/>
											))}
										</div>
										<span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
											<Calendar className="h-3 w-3" />
											{new Date(item.createdAt).toLocaleDateString("uk-UA")}
										</span>
									</div>
								</div>

								<button
									onClick={() => handleDeleteClick(item.id)}
									disabled={deletingId === item.id}
									className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition duration-200 ml-2 shrink-0 inline-flex items-center justify-center h-8 w-8"
									title="Видалити оцінку"
								>
									{deletingId === item.id ? (
										<Loader2 className="h-4 w-4 animate-spin text-red-500" />
									) : (
										<Trash2 className="h-4 w-4" />
									)}
								</button>
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
				</div>
			)}
		</div>
	);
}
