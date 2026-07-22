"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	MapPin,
	Star,
	Layers,
	Loader2,
	Search,
	SlidersHorizontal,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryData } from "@/src/interfaces/category";

export default function CategoryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [category, setCategory] = useState<CategoryData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<"rating" | "name">("rating");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 12;

	useEffect(() => {
		const fetchCategoryData = async () => {
			if (!params?.id) return;
			try {
				const response = await fetch(`/api/categories/${params.id}`);
				if (!response.ok) {
					if (response.status === 404) new Error("Підбірку не знайдено");
					new Error("Помилка при завантаженні даних");
				}
				const data = await response.json();
				setCategory(data.category);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchCategoryData();
	}, [params?.id]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, sortBy]);

	const filteredAndSortedVenues = useMemo(() => {
		if (!category?.venues) return [];
		let result = category.venues.filter((item) => item.venue?.isApproved);
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.venue?.name?.toLowerCase().includes(query) ||
					item.venue?.address?.toLowerCase().includes(query),
			);
		}
		if (sortBy === "rating") {
			result.sort((a, b) => (b.venue?.rating || 0) - (a.venue?.rating || 0));
		} else if (sortBy === "name") {
			result.sort((a, b) =>
				(a.venue?.name || "").localeCompare(b.venue?.name || ""),
			);
		}
		return result;
	}, [category, searchQuery, sortBy]);

	const totalItems = filteredAndSortedVenues.length;
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

	const paginatedVenues = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredAndSortedVenues.slice(
			startIndex,
			startIndex + ITEMS_PER_PAGE,
		);
	}, [filteredAndSortedVenues, currentPage]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-slate-50/50">
				<Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
				<p className="text-sm text-slate-500 font-medium">
					Завантаження підбірки...
				</p>
			</div>
		);
	}

	if (error || !category) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50/50 text-center">
				<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full space-y-4">
					<p className="text-sm font-semibold text-red-600">
						{error || "Категорія відсутня"}
					</p>
					<Button
						onClick={() => router.back()}
						className="w-full bg-slate-950 text-white"
					>
						<ArrowLeft size={16} className="mr-2" /> Повернутися назад
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50/30 pb-12">
			<div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
					<button
						onClick={() =>
							router.push("/admin/dashboard?tab=venues-categories")
						}
						className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
					>
						<ArrowLeft size={20} />
					</button>
					<div className="flex items-center gap-2 text-slate-400">
						<Layers size={16} className="text-amber-500" />
						<span className="text-xs font-bold uppercase tracking-wider text-slate-400">
							Підбірка
						</span>
					</div>
				</div>
			</div>
			<main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
						{category.name}
					</h1>
					{category.description ? (
						<p className="text-sm sm:text-base text-slate-500 max-w-3xl leading-relaxed">
							{category.description}
						</p>
					) : (
						<p className="text-sm text-slate-400 italic">
							Опис для цієї підбірки не додано.
						</p>
					)}
				</div>
				<div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
					<div className="relative flex-1">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<input
							type="text"
							placeholder="Пошук закладу за назвою або адресою..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white transition"
						/>
					</div>
					<div className="flex items-center gap-2 border-l-0 sm:border-l border-slate-100 sm:pl-3">
						<SlidersHorizontal className="h-4 w-4 text-slate-400 hidden sm:block" />
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as "rating" | "name")}
							className="bg-slate-50 text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer w-full sm:w-auto"
						>
							<option value="rating">Спочатку з найвищим рейтингом</option>
							<option value="name">За алфавітом (А-Я)</option>
						</select>
					</div>
				</div>
				<div className="text-xs font-semibold text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">
					Знайдено закладів:{" "}
					<span className="text-slate-900 font-bold">{totalItems}</span>
				</div>
				{paginatedVenues.length === 0 ? (
					<div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
						<p className="text-sm text-slate-400 italic">
							Нічого не знайдено за вашим запитом або в підбірці немає активних
							закладів.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{paginatedVenues.map((item) => {
								const venue = item.venue;
								if (!venue) return null;
								return (
									<div
										key={venue.id}
										onClick={() => router.push(`/venues/${venue.id}`)}
										className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
									>
										<div className="space-y-2">
											<h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
												{venue.name}
											</h3>
											<div className="flex items-start gap-1 text-xs text-slate-500">
												<MapPin
													size={14}
													className="text-slate-400 mt-0.5 shrink-0"
												/>
												<span className="truncate">
													{venue.address || "Адресу не вказано"}
												</span>
											</div>
										</div>

										<div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
											<div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-lg">
												<Star
													size={12}
													className="fill-amber-500 text-amber-500"
												/>
												{venue.rating ? venue.rating.toFixed(1) : "0.0"}
											</div>
											<span className="text-[10px] text-slate-400 font-medium">
												Переглянути ➔
											</span>
										</div>
									</div>
								);
							})}
						</div>
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 pt-6">
								<button
									onClick={() =>
										setCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={currentPage === 1}
									className="p-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl transition shadow-sm"
								>
									<ChevronLeft size={18} />
								</button>
								<span className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
									Сторінка {currentPage} з {totalPages}
								</span>
								<button
									onClick={() =>
										setCurrentPage((prev) => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="p-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl transition shadow-sm"
								>
									<ChevronRight size={18} />
								</button>
							</div>
						)}
					</>
				)}
			</main>
		</div>
	);
}
