"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Star, Utensils } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FavoriteItem } from "@/src/interfaces/favorites";
import { PaginationMeta } from "@/src/interfaces/pagination";
import Pagination from "@/components/ui/pagination-custom";

export default function FavoriteVenues() {
	const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	const loadFavorites = async (pageNumber: number) => {
		setIsLoading(true);
		const token =
			typeof window !== "undefined" ? localStorage.getItem("token") : null;
		if (!token) {
			setIsLoading(false);
			return;
		}

		try {
			const data = await apiFetch(`/user/favorites?page=${pageNumber}&limit=9`);
			setFavorites(data.venues || []);
			setPagination(data.pagination || null);
		} catch (error) {
			toast.error("Не вдалося завантажити список улюблених закладів");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadFavorites(currentPage);
	}, [currentPage]);

	const handleRemoveFavorite = async (venueId: string, venueName: string) => {
		setRemovingId(venueId);
		try {
			await apiFetch(`/user/favorites`, {
				method: "DELETE",
				body: { venueId },
			});

			toast.success(`Заклад "${venueName}" видалено з улюблених`);

			if (favorites.length === 1 && currentPage > 1) {
				setCurrentPage((prev) => prev - 1);
			} else {
				void loadFavorites(currentPage);
			}
		} catch (error) {
			toast.error("Не вдалося видалити заклад з улюблених");
		} finally {
			setRemovingId(null);
		}
	};
	if (isLoading && favorites.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
			</div>
		);
	}

	if (favorites.length === 0) {
		return (
			<div className="text-center py-16 bg-slate-50 border border-dashed border-slate-100 rounded-2xl text-xs font-medium">
				<Heart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
				<h3 className="text-sm font-bold text-slate-700">Список порожній</h3>
				<p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
					Ви ще не додали жодного закладу до улюблених. Перейдіть до каталогу,
					щоб знайти щось цікаве!
				</p>
				<Link
					href="/venues"
					className="inline-block mt-4 text-[11px] font-bold text-blue-600 hover:underline"
				>
					Перейти до каталогу →
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6 relative text-xs font-medium">
			<div id="favorites-tab-top" className="absolute -top-6 left-0" />

			<div>
				<h2 className="text-lg font-bold text-slate-900">Улюблені заклади</h2>
				<p className="text-[11px] text-slate-500">
					Заклади, які ви зберегли для швидкого доступу
				</p>
			</div>

			{isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{favorites.map((venue: any) => {
							return (
								<div
									key={venue.id}
									className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
								>
									<div className="relative h-40 bg-slate-100 overflow-hidden">
										{venue.mainImage ? (
											<img
												src={venue.mainImage}
												alt={venue.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-slate-300">
												<Utensils className="h-12 w-12" />
											</div>
										)}

										<span className="absolute top-3 left-3 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
											{venue.type}
										</span>

										<button
											onClick={() => handleRemoveFavorite(venue.id, venue.name)}
											disabled={removingId === venue.id}
											className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-red-500 hover:bg-white transition active:scale-95 disabled:opacity-50 inline-flex items-center justify-center h-8 w-8"
											title="Видалити з обраного"
										>
											{removingId === venue.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Heart className="h-4 w-4" fill="#ef4444" />
											)}
										</button>
									</div>
									<div className="p-4 flex-1 flex flex-col justify-between space-y-3">
										<div>
											<Link href={`/venues/${venue.id}`} className="block">
												<h3 className="font-bold text-slate-800 hover:text-blue-600 transition truncate text-sm">
													{venue.name}
												</h3>
											</Link>

											<div className="flex items-center space-x-1 mt-1">
												<Star
													className="h-3.5 w-3.5 text-amber-400"
													fill="#fbbf24"
												/>
												<span className="text-xs font-bold text-slate-700">
													{venue.rating ? venue.rating.toFixed(1) : "0.0"}
												</span>
											</div>
										</div>

										<Link href={`/venues/${venue.id}`}>
											<Button
												variant="outline"
												size="sm"
												className="w-full rounded-xl text-xs font-bold py-1.5 h-auto border-slate-200 text-slate-500 hover:bg-slate-50"
											>
												Детальніше
											</Button>
										</Link>
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
				</div>
			)}
		</div>
	);
}
