"use client";

import { useState, useEffect } from "react";
import {
	MessageSquare,
	Star,
	Trash2,
	ExternalLink,
	AlertCircle,
	Calendar,
	Building,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { ReviewItem } from "@/src/interfaces/review";
import Pagination from "@/components/ui/pagination-custom";
import { getAuthToken } from "@/src/helpers/auth";

export default function MyComments() {
	const [reviews, setReviews] = useState<ReviewItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const fetchMyReviews = async (page: number) => {
		setIsLoading(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/user/reviews?page=${page}&limit=10`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setReviews(data.reviews || []);
				setPagination(data.pagination || null);
			} else {
				console.error("Не вдалося завантажити відгуки з /api/user/reviews");
			}
		} catch (error) {
			console.error("Помилка завантаження відгуків:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchMyReviews(currentPage);
	}, [currentPage]);
	const handleDeleteReview = async (reviewId: string) => {
		if (!confirm("Ви впевнені, що хочете видалити свій відгук?")) {
			return;
		}
		setIsDeletingId(reviewId);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/user/reviews?id=${reviewId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				new Error(errorData.message || "Не вдалося видалити відгук");
			}
			setReviews((prev) => prev.filter((item) => item.id !== reviewId));
			if (reviews.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void fetchMyReviews(currentPage);
			}
		} catch (error: any) {
			alert(error.message || "Помилка при видаленні відгуку");
		} finally {
			setIsDeletingId(null);
		}
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("uk-UA", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	if (isLoading && reviews.length === 0) {
		return (
			<div className="text-center py-12 text-slate-500 animate-pulse text-xs">
				Завантаження ваших відгуків...
			</div>
		);
	}

	return (
		<div className="space-y-4 text-xs">
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
							Мої коментарі та відгуки
						</h3>
					</div>
					<span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold">
						Всього відгуків: {pagination?.totalItems || reviews.length}
					</span>
				</div>
				{reviews.length === 0 ? (
					<div className="text-center py-12 text-slate-400 italic text-xs flex flex-col items-center gap-2">
						<AlertCircle size={22} className="text-slate-300" />
						<span>Ви ще не залишали коментарів до закладів</span>
					</div>
				) : (
					<>
						<div className="divide-y divide-slate-100 font-medium">
							{reviews.map((item) => {
								const venueName = item.venue?.name || "Заклад";
								const venueId = item.venueId || item.venue?.id;
								return (
									<div
										key={item.id}
										className="p-4 hover:bg-slate-50/30 transition flex flex-col sm:flex-row justify-between items-start gap-3"
									>
										<div className="space-y-1.5 max-w-3xl flex-1">
											<div className="flex flex-wrap items-center gap-2.5 text-[11px]">
												<span className="font-bold text-slate-700 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
													<Building size={11} className="text-slate-500" />
													{venueName}
												</span>
												<span className="text-slate-400 flex items-center gap-0.5">
													<Calendar size={11} /> {formatDate(item.createdAt)}
												</span>
												<div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
													<Star
														size={11}
														className="fill-amber-500 text-amber-500"
													/>
													<span>{item.rating}</span>
												</div>
											</div>
											<p className="text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-xs font-normal">
												{item.text}
											</p>
										</div>
										<div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
											{venueId && (
												<Link
													href={`/venues/${venueId}`}
													className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition"
													target="_blank"
													title="Перейти до закладу"
												>
													<ExternalLink size={14} />
												</Link>
											)}

											<Button
												variant="ghost"
												size="sm"
												disabled={isDeletingId === item.id}
												onClick={() => handleDeleteReview(item.id)}
												className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
												title="Видалити відгук"
											>
												<Trash2
													size={14}
													className={
														isDeletingId === item.id ? "animate-spin" : ""
													}
												/>
											</Button>
										</div>
									</div>
								);
							})}
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
