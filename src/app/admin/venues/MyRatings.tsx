"use client";

import { useState, useEffect } from "react";
import {
	Star,
	Building,
	Calendar,
	AlertCircle,
	ExternalLink,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { RatingItem } from "@/src/interfaces/rating";
import { PaginationMeta } from "@/src/interfaces/pagination";
import Pagination from "@/components/ui/pagination-custom";
import { getAuthToken } from "@/src/helpers/auth";

export default function MyRatings() {
	const [ratings, setRatings] = useState<RatingItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const fetchMyRatings = async (page: number) => {
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
				setRatings(data.reviews || []);
				setPagination(data.pagination || null);
			}
		} catch (error) {
			console.error("Помилка завантаження оцінок:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchMyRatings(currentPage);
	}, [currentPage]);

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("uk-UA", {
			day: "numeric",
			month: "numeric",
			year: "numeric",
		});
	};

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						size={12}
						className={
							star <= rating
								? "fill-amber-500 text-amber-500"
								: "text-slate-200"
						}
					/>
				))}
			</div>
		);
	};

	if (isLoading && ratings.length === 0) {
		return (
			<div className="text-center py-12 text-slate-500 animate-pulse text-xs">
				Завантаження ваших оцінок...
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
						<Star size={15} className="text-amber-500 fill-amber-500" />
						<h3 className="text-xs font-bold text-slate-800">
							Поставлені мною оцінки
						</h3>
					</div>
					<span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold">
						Всього оцінок: {pagination?.totalItems || ratings.length}
					</span>
				</div>
				{ratings.length === 0 ? (
					<div className="text-center py-12 text-slate-400 italic text-xs flex flex-col items-center gap-2">
						<AlertCircle size={22} className="text-slate-300" />
						<span>Ви ще не виставляли оцінок закладам</span>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse font-medium">
								<thead>
									<tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
										<th className="p-3 pl-5">Заклад</th>
										<th className="p-3">Оцінка</th>
										<th className="p-3">Дата</th>
										<th className="p-3 pr-5 text-right">Дія</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-600">
									{ratings.map((item) => {
										const venueName = item.venue?.name || "Заклад";
										const venueId = item.venueId || item.venue?.id;

										return (
											<tr
												key={item.id}
												className="hover:bg-slate-50/30 transition"
											>
												<td className="p-3 pl-5 font-bold text-slate-800">
													<div className="flex items-center gap-2">
														<Building
															size={13}
															className="text-slate-400 shrink-0"
														/>
														<span className="line-clamp-1">{venueName}</span>
													</div>
												</td>
												<td className="p-3">
													<div className="flex items-center gap-2">
														{renderStars(item.rating)}
														<span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
															{item.rating}.0
														</span>
													</div>
												</td>
												<td className="p-3 text-[11px] text-slate-400">
													<div className="flex items-center gap-1">
														<Calendar size={12} />
														{formatDate(item.createdAt)}
													</div>
												</td>
												<td className="p-3 pr-5 text-right">
													{venueId && (
														<Link
															href={`/venues/${venueId}`}
															className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-600 transition font-semibold"
															target="_blank"
														>
															<span>Перейти</span>
															<ExternalLink size={11} />
														</Link>
													)}
												</td>
											</tr>
										);
									})}
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
					</>
				)}
			</div>
		</div>
	);
}
