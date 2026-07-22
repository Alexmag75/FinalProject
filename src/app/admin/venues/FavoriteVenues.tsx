"use client";

import { useState, useEffect } from "react";
import {
	Heart,
	MapPin,
	Star,
	Trash2,
	ExternalLink,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { VenueOption } from "@/src/interfaces/venue";
import { PaginationMeta } from "@/src/interfaces/pagination";
import Pagination from "@/components/ui/pagination-custom";
import { getAuthToken } from "@/src/helpers/auth";

export default function FavoriteVenues() {
	const [favorites, setFavorites] = useState<VenueOption[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
	const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const fetchFavorites = async (page: number) => {
		setIsLoading(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/user/favorites?page=${page}&limit=9`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setFavorites(data.venues || []);
				setPagination(data.pagination || null);
			} else {
				console.error("Сервер повернув помилку при завантаженні обраного");
			}
		} catch (error) {
			toast.error("Не вдалося завантажити список обраного");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchFavorites(currentPage);
	}, [currentPage]);

	const executeRemoval = async (venueId: string) => {
		setIsRemovingId(venueId);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/user/favorites", {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ venueId }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				new Error(errorData.message || "Не вдалося видалити з улюблених");
			}

			setFavorites((prev) => prev.filter((item) => item.id !== venueId));
			toast.success("Заклад видалено з обраного");

			if (favorites.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void fetchFavorites(currentPage);
			}
		} catch (error: any) {
			toast.error(error.message || "Помилка виконання операції");
		} finally {
			setIsRemovingId(null);
		}
	};

	const handleRemoveFavorite = (venueId: string, name: string) => {
		toast(`Видалити заклад "${name}" з улюблених?`, {
			action: {
				label: "Видалити",
				onClick: () => executeRemoval(venueId),
			},
			duration: 5000,
		});
	};

	const handleImageError = (venueId: string) => {
		setBrokenImages((prev) => ({ ...prev, [venueId]: true }));
	};

	if (isLoading && favorites.length === 0) {
		return (
			<div className="p-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				<span>Завантаження улюблених закладів...</span>
			</div>
		);
	}

	return (
		<div className="space-y-4 text-xs relative font-medium">
			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
				<div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Heart size={15} className="text-rose-500 fill-rose-500" />
						<h3 className="text-xs font-bold text-slate-800">
							My улюблені заклади
						</h3>
					</div>
					<span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold">
						Всього обрано: {pagination?.totalItems || favorites.length}
					</span>
				</div>
				<div className="relative min-h-[200px]">
					{isLoading && (
						<div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
							<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
						</div>
					)}

					{favorites.length === 0 ? (
						<div className="text-center py-12 text-slate-400 italic text-xs flex flex-col items-center gap-2">
							<AlertCircle size={20} className="text-slate-300" />
							<span>Ви ще не додали жодного закладу до улюблених</span>
							<Link
								href="/"
								className="text-[10px] text-amber-600 hover:underline mt-1 font-bold"
							>
								Перейти на головну та обрати щось цікаве ➔
							</Link>
						</div>
					) : (
						<>
							<div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{favorites.map((venue) => {
									const isImageBroken = brokenImages[venue.id];
									const hasPhoto = venue.mainImage && !isImageBroken;

									return (
										<div
											key={venue.id}
											className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
										>
											<div className="h-32 bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100 flex items-center justify-center">
												{hasPhoto ? (
													<img
														src={venue.mainImage}
														alt={venue.name}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
														loading="lazy"
														onError={() => handleImageError(venue.id)}
													/>
												) : (
													<div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-slate-300 gap-1 select-none">
														<MapPin
															size={20}
															className="text-slate-300 stroke-[1.5]"
														/>
														<span className="text-[9px] font-bold tracking-wider uppercase text-slate-400">
															Немає фото
														</span>
													</div>
												)}

												{venue.category && (
													<span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider backdrop-blur-[1px]">
														{venue.category}
													</span>
												)}
											</div>

											<div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
												<div className="space-y-1">
													<div className="flex justify-between items-start gap-2">
														<h4 className="font-bold text-slate-900 text-xs group-hover:text-amber-600 transition-colors line-clamp-1">
															{venue.name}
														</h4>
														{venue.rating !== undefined && venue.rating > 0 && (
															<div
																className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 shrink-0"
																title={`Всього відгуків: ${venue.reviewCount}`}
															>
																<Star
																	size={11}
																	className="fill-amber-500 text-amber-500"
																/>
																{venue.rating.toFixed(1)}
															</div>
														)}
													</div>
													{venue.address && (
														<p className="text-[11px] text-slate-400 flex items-center gap-1 line-clamp-1 font-normal">
															<MapPin
																size={11}
																className="text-slate-400 shrink-0"
															/>
															{venue.address}
														</p>
													)}
												</div>

												<div className="flex items-center justify-between pt-2 border-t border-slate-100">
													<Link
														href={`/venues/${venue.id}`}
														className="text-[11px] text-slate-500 hover:text-amber-600 flex items-center gap-1 font-bold transition"
														target="_blank"
													>
														<ExternalLink size={11} />
														До закладу
													</Link>

													<Button
														variant="ghost"
														size="sm"
														disabled={isRemovingId === venue.id}
														onClick={() =>
															handleRemoveFavorite(venue.id, venue.name)
														}
														className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
														title="Видалити з улюблених"
													>
														{isRemovingId === venue.id ? (
															<Loader2 size={12} className="animate-spin" />
														) : (
															<Trash2 size={12} />
														)}
													</Button>
												</div>
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
		</div>
	);
}
