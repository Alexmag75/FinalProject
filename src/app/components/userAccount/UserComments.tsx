"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
	MessageSquare,
	Trash2,
	Loader2,
	Star,
	Calendar,
	Utensils,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { CommentItem } from "@/src/interfaces/comment";
import Pagination from "@/components/ui/pagination-custom";

export default function UserComments() {
	const [reviews, setReviews] = useState<CommentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const loadComments = async (pageNumber: number) => {
		setIsLoading(true);
		const token =
			typeof window !== "undefined" ? localStorage.getItem("token") : null;
		if (!token) {
			setIsLoading(false);
			return;
		}
		try {
			const data = await apiFetch(`/user/reviews?page=${pageNumber}&limit=6`);
			setReviews(data.reviews || []);
			setPagination(data.pagination || null);
		} catch (error) {
			toast.error("Не вдалося завантажити ваші коментарі");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadComments(currentPage);
	}, [currentPage]);

	const executeDeleteComment = async (commentId: string) => {
		setDeletingId(commentId);
		try {
			await apiFetch(`/user/reviews?id=${commentId}`, { method: "DELETE" });
			toast.success("Коментар успішно видалено");

			if (reviews.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void loadComments(currentPage);
			}
		} catch (error) {
			toast.error("Не вдалося видалити коментар");
		} finally {
			setDeletingId(null);
		}
	};

	const handleDeleteClick = (commentId: string) => {
		toast("Ви впевнені, що хочете видалити цей коментар?", {
			description: "Цю дію неможливо буде скасувати.",
			action: {
				label: "Видалити",
				onClick: () => executeDeleteComment(commentId),
			},
			duration: 5000,
		});
	};

	if (isLoading && reviews.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
			</div>
		);
	}

	if (reviews.length === 0) {
		return (
			<div className="text-center py-16 bg-slate-50 border border-dashed border-slate-100 rounded-2xl text-xs font-medium">
				<MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
				<h3 className="text-sm font-bold text-slate-700">
					Історія коментарів порожня
				</h3>
				<p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
					Ви ще не залишали відгуків до закладів. Ваша думка допомагає іншим
					робити правильний вибір!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-slate-900 relative text-xs font-medium">
			<div id="comments-tab-top" className="absolute -top-6 left-0" />

			<div>
				<h2 className="text-lg font-bold text-slate-900">Мої коментарі</h2>
				<p className="text-[11px] text-slate-500">
					Історія ваших відгуків та оцінок, залишених на платформі
				</p>
			</div>

			{isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			) : (
				<div className="space-y-6">
					<div className="space-y-4">
						{reviews.map((item) => (
							<div
								key={item.id}
								className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition flex flex-col md:flex-row justify-between gap-4"
							>
								<div className="space-y-2 flex-1">
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
										<Link
											href={`/venues/${item.venue.id}`}
											className="font-bold text-slate-800 hover:text-blue-600 transition text-sm flex items-center gap-1.5"
										>
											<Utensils className="h-3.5 w-3.5 text-slate-400" />
											{item.venue.name}
										</Link>

										<span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											{new Date(item.createdAt).toLocaleDateString("uk-UA", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}
										</span>
									</div>

									{item.rating !== undefined && item.rating > 0 && (
										<div className="flex items-center space-x-0.5">
											{[...Array(5)].map((_, i) => (
												<Star
													key={i}
													className={`h-3.5 w-3.5 ${i < (item.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
												/>
											))}
										</div>
									)}

									<p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 italic font-semibold">
										"{item.text}"
									</p>
								</div>

								<div className="flex items-start justify-end md:self-center">
									<button
										onClick={() => handleDeleteClick(item.id)}
										disabled={deletingId === item.id}
										className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition duration-200 inline-flex items-center justify-center h-8 w-8"
										title="Видалити коментар"
									>
										{deletingId === item.id ? (
											<Loader2 className="h-4 w-4 animate-spin text-red-500" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</button>
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
				</div>
			)}
		</div>
	);
}
