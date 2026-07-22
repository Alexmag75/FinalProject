"use client";

import React, {useState, useEffect, Suspense} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Star,
	MapPin,
	SlidersHorizontal,
	Wifi,
	ParkingCircle,
	Music,
	ArrowUpDown,
	Navigation,
	Tag,
	X,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { VenueCardItem } from "@/src/interfaces/venue";
import Pagination from "@/components/ui/pagination-custom";
import {VENUE_TYPES} from "@/src/types/constants";

function VenuesContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const currentPage = parseInt(searchParams?.get("page") || "1", 10) || 1;
	const activeTag = searchParams?.get("tag") || "";

	const [search, setSearch] = useState(searchParams?.get("search") || "");
	const [type, setType] = useState(searchParams?.get("type") || "");
	const [sortBy, setSortBy] = useState(searchParams?.get("sortBy") || "rating");
	const [order, setOrder] = useState(searchParams?.get("order") || "desc");
	const [hasWifi, setHasWifi] = useState(searchParams?.get("hasWifi") === "true");
	const [hasParking, setHasParking] = useState(searchParams?.get("hasParking") === "true");
	const [hasMusic, setHasMusic] = useState(searchParams?.get("hasMusic") === "true");

	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
	const [locationLoading, setLocationLoading] = useState(false);
	const [debouncedSearch] = useDebounce(search, 500);

	useEffect(() => {
		setSearch(searchParams?.get("search") || "");
		setType(searchParams?.get("type") || "");
		setSortBy(searchParams?.get("sortBy") || "rating");
		setOrder(searchParams?.get("order") || "desc");
		setHasWifi(searchParams?.get("hasWifi") === "true");
		setHasParking(searchParams?.get("hasParking") === "true");
		setHasMusic(searchParams?.get("hasMusic") === "true");
	}, [searchParams]);

	useEffect(() => {
		const currentParam = searchParams?.get("search") || "";
		if (debouncedSearch !== currentParam) {
			const params = new URLSearchParams(searchParams?.toString() || "");
			params.set("page", "1");
			if (debouncedSearch) params.set("search", debouncedSearch);
			else params.delete("search");
			router.push(`/venues?${params.toString()}`, { scroll: false });
		}
	}, [debouncedSearch]);

	const requestLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Геолокація не підтримується вашим браузером");
			return;
		}

		setLocationLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCoords({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
				setSortBy("distance");
				setOrder("asc");
				setLocationLoading(false);

				const params = new URLSearchParams(searchParams?.toString() || "");
				params.set("sortBy", "distance");
				params.set("order", "asc");
				params.set("page", "1");
				params.set("lat", position.coords.latitude.toString());
				params.set("lng", position.coords.longitude.toString());
				router.push(`/venues?${params.toString()}`, { scroll: false });

				toast.success("Локацію успішно оновлено! Заклади відсортовано за відстанню.");
			},
			(error) => {
				console.error("Помилка отримання геолокації:", error);
				toast.error("Не вдалося отримати доступ до геолокації.");
				setLocationLoading(false);
			},
			{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
		);
	};

	const toggleFilter = (key: string, value: boolean) => {
		const params = new URLSearchParams(searchParams?.toString() || "");
		params.set("page", "1");
		if (value) params.set(key, "true");
		else params.delete(key);
		router.push(`/venues?${params.toString()}`, { scroll: false });
	};

	const handlePageChange = (newPage: number) => {
		const params = new URLSearchParams(searchParams?.toString() || "");
		params.set("page", newPage.toString());
		router.push(`/venues?${params.toString()}`, { scroll: false });
		document.getElementById("catalog-top-anchor")?.scrollIntoView({ behavior: "smooth" });
	};

	const { data, isLoading, isError } = useQuery<{
		venues: VenueCardItem[];
		allTags: { id: string; name: string }[];
		pagination: PaginationMeta;
	}>({
		queryKey: ["venues", searchParams?.toString() || ""],
		queryFn: () => apiFetch(`/venues?${searchParams?.toString() || ""}`),
	});

	const resetFilters = () => {
		setSearch("");
		setType("");
		setSortBy("rating");
		setOrder("desc");
		setHasWifi(false);
		setHasParking(false);
		setHasMusic(false);
		setCoords(null);
		router.push("/venues?page=1&limit=12");
		toast.info("Усі фільтри скинуто");
	};

	const handleClearTag = () => {
		const params = new URLSearchParams(searchParams?.toString() || "");
		params.delete("tag");
		params.set("page", "1");
		router.push(`/venues?${params.toString()}`, { scroll: false });
	};

	const formatDistance = (distInKm: number | undefined) => {
		if (distInKm === undefined) return null;
		if (distInKm < 1) {
			return `${Math.round(distInKm * 1000)} м`;
		}
		return `${distInKm.toFixed(1)} км`;
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 relative text-xs font-medium text-slate-900">
			<div id="catalog-top-anchor" className="absolute -top-6 left-0" />

			<aside className="w-full lg:w-60 shrink-0 bg-white p-5 rounded-2xl border border-slate-200 h-fit space-y-5 lg:sticky lg:top-20 shadow-sm">
				<div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
					<SlidersHorizontal className="h-4 w-4 text-blue-600" />
					<h2 className="font-black uppercase tracking-wider text-slate-800 text-sm">
						Фільтри
					</h2>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Пошук поблизу
					</label>
					<Button
						type="button"
						variant="outline"
						onClick={requestLocation}
						disabled={locationLoading}
						className={`w-full h-9 flex items-center justify-center gap-1.5 text-xs rounded-xl border-slate-200 ${
							coords
								? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 font-bold"
								: ""
						}`}
					>
						<Navigation
							className={`h-3.5 w-3.5 ${
								locationLoading ? "animate-spin" : ""
							} ${coords ? "fill-green-600 text-green-600" : ""}`}
						/>
						{locationLoading
							? "Визначення..."
							: coords
								? "Локацію отримано"
								: "Знайти заклади поруч"}
					</Button>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Пошук закладу
					</label>
					<Input
						type="text"
						placeholder="Назва, кухня..."
						value={search}
						className="h-9 rounded-xl text-xs border-slate-200 placeholder:text-slate-400"
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Тип закладу
					</label>
					<select
						value={type}
						onChange={(e) => {
							const val = e.target.value;
							setType(val);
							const params = new URLSearchParams(searchParams?.toString() || "");
							params.set("page", "1");
							if (val) params.set("type", val);
							else params.delete("type");
							router.push(`/venues?${params.toString()}`, { scroll: false });
						}}
						className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
					>
						<option value="">Усі типи закладів</option>
						{VENUE_TYPES.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-2.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Зручності
					</label>
					<div className="space-y-2 pl-0.5">
						<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={hasWifi}
								onChange={(e) => {
									setHasWifi(e.target.checked);
									toggleFilter("hasWifi", e.target.checked);
								}}
								className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
							/>
							<Wifi className="h-3.5 w-3.5 text-slate-400" /> <span>Є Wi-Fi</span>
						</label>
						<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={hasParking}
								onChange={(e) => {
									setHasParking(e.target.checked);
									toggleFilter("hasParking", e.target.checked);
								}}
								className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
							/>
							<ParkingCircle className="h-3.5 w-3.5 text-slate-400" /> <span>Парковка</span>
						</label>
						<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={hasMusic}
								onChange={(e) => {
									setHasMusic(e.target.checked);
									toggleFilter("hasMusic", e.target.checked);
								}}
								className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
							/>
							<Music className="h-3.5 w-3.5 text-slate-400" /> <span>Жива музика</span>
						</label>
					</div>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Фільтр за тегом
					</label>
					<div className="relative flex items-center">
						<select
							value={searchParams?.get("tag") || ""}
							onChange={(e) => {
								const val = e.target.value;
								const params = new URLSearchParams(searchParams?.toString() || "");
								params.set("page", "1");
								if (val) params.set("tag", val);
								else params.delete("tag");
								router.push(`/venues?${params.toString()}`, { scroll: false });
							}}
							className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer shadow-sm"
						>
							<option value="">Усі теги закладу</option>
							{data?.allTags?.map((t) => (
								<option key={t.id} value={t.name}>
									#{t.name}
								</option>
							))}
						</select>
						<Tag className="absolute right-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
					</div>
				</div>

				<div className="pt-3 border-t border-slate-100">
					<Button
						onClick={resetFilters}
						variant="outline"
						className="w-full h-8 text-xs font-bold rounded-xl border-slate-200"
					>
						Скинути все
					</Button>
				</div>
			</aside>

			<main className="flex-grow space-y-6 flex flex-col justify-between min-h-[50vh]">
				<div className="space-y-5">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="space-y-0.5">
							<h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
								Каталог закладів
							</h1>

							{activeTag && (
								<div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 px-2.5 py-0.5 rounded-xl w-fit font-bold text-[10px] mt-1">
									<Tag size={10} className="text-amber-600" />
									<span>Тег: #{activeTag}</span>
									<button
										onClick={handleClearTag}
										className="ml-0.5 p-0.5 rounded hover:bg-amber-500/20 text-amber-600 transition"
									>
										<X size={10} />
									</button>
								</div>
							)}
						</div>

						<div className="flex items-center space-x-1.5 bg-slate-100 p-1 px-2 rounded-xl text-xs shrink-0 border border-slate-200/60 shadow-sm">
                     <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3" /> СОРТУВАТИ:
                     </span>
							<select
								value={
									sortBy === "distance"
										? "distance-asc"
										: `${sortBy}-${order}`
								}
								onChange={(e) => {
									const [newSort, newOrder] = e.target.value.split("-");
									if (newSort === "distance" && !coords) {
										requestLocation();
									} else {
										setSortBy(newSort);
										setOrder(newOrder);
										const params = new URLSearchParams(searchParams?.toString() || "");
										params.set("page", "1");
										params.set("sortBy", newSort);
										params.set("order", newOrder);
										router.push(`/venues?${params.toString()}`, { scroll: false });
									}
								}}
								className="bg-transparent font-bold text-slate-700 h-7 px-1 focus:outline-none cursor-pointer"
							>
								<option value="rating-desc">Найвищий рейтинг</option>
								<option value="distance-asc">Найближчі до мене</option>
								<option value="averageCheck-asc">Спочатку дешевші</option>
								<option value="averageCheck-desc">Спочатку дорожчі</option>
								<option value="createdAt-desc">Нові заклади</option>
							</select>
						</div>
					</div>

					{isLoading && (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-72 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center"
								>
									<Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
								</div>
							))}
						</div>
					)}

					{isError && (
						<div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
							<p className="font-bold text-amber-900 text-sm">
								Закладів за обраними критеріями не знайдено або сталася помилка.
							</p>
							<p className="text-xs text-amber-700">
								Спробуйте змінити чи скинути фільтри.
							</p>
							<Button
								onClick={resetFilters}
								variant="outline"
								size="sm"
								className="bg-white border-amber-300 hover:bg-amber-100 font-bold text-xs rounded-xl"
							>
								Скинути всі фільтри
							</Button>
						</div>
					)}

					{!isLoading && !isError && data?.venues.length === 0 && (
						<div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm font-semibold">
							Закладів за такими критеріями не знайдено.
						</div>
					)}

					{!isLoading && !isError && data && (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
							{data.venues.map((venue) => (
								<Link href={`/venues/${venue.id}`} key={venue.id} className="group">
									<Card className="h-full overflow-hidden hover:shadow-md transition duration-200 rounded-2xl border-slate-200 bg-white flex flex-col justify-between shadow-sm">
										<div>
											<div className="relative h-40 w-full overflow-hidden bg-slate-50 border-b">
												<img
													src={
														venue.mainImage ||
														"https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600"
													}
													alt={venue.name}
													className="h-full w-full object-cover group-hover:scale-[1.03] transition duration-300"
												/>
												<div className="absolute top-2.5 right-2.5 flex items-center space-x-0.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
													<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
													<span>
                                          {venue.rating > 0 ? venue.rating.toFixed(1) : "0.0"}
                                       </span>
												</div>

												{venue.distance !== undefined && (
													<div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 bg-blue-600/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-sm">
														<Navigation className="h-3 w-3 fill-white text-white rotate-45" />
														<span>{formatDistance(venue.distance)}</span>
													</div>
												)}
											</div>

											<CardContent className="p-4 space-y-2">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                       {venue.type}
                                    </span>
												<h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
													{venue.name}
												</h3>
												<div className="flex items-center text-xs text-slate-400 font-semibold space-x-1">
													<MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
													<span className="truncate">{venue.address}</span>
												</div>

												<div className="flex items-center space-x-2 pt-1.5 text-slate-400">
													{venue.hasWifi && (
														<Wifi className="h-4 w-4 text-green-600" />
													)}
													{venue.hasParking && (
														<ParkingCircle className="h-4 w-4 text-blue-600" />
													)}
													{venue.hasMusic && (
														<Music className="h-4 w-4 text-purple-600" />
													)}
												</div>

												{venue.tags && venue.tags.length > 0 && (
													<div className="flex flex-wrap gap-1 pt-1.5">
														{venue.tags.slice(0, 2).map((t: any) => (
															<span
																key={t.id}
																className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md"
															>
                                                #{t.name}
                                             </span>
														))}
														{venue.tags.length > 2 && (
															<span className="text-[9px] text-slate-400 font-bold self-center pl-0.5">
                                                +{venue.tags.length - 2}
                                             </span>
														)}
													</div>
												)}
											</CardContent>
										</div>

										<CardFooter className="p-4 pt-0 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500 h-11">
											<span>Середній чек:</span>
											<span className="text-slate-900 font-black text-sm">
                                    {venue.averageCheck} ₴
                                 </span>
										</CardFooter>
									</Card>
								</Link>
							))}
						</div>
					)}
				</div>

				{data && data.pagination && data.pagination.totalPages > 1 && (
					<div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200 mt-6">
						<p className="text-xs text-slate-400 font-bold">
							Показано <span className="text-slate-700">{data.venues.length}</span> з{" "}
							<span className="text-slate-700">{data.pagination.totalItems}</span> закладів
						</p>
						<Pagination
							currentPage={currentPage}
							totalPages={data.pagination.totalPages}
							onPageChange={(newPage) => handlePageChange(newPage)}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
export default function VenuesPage() {
	return (
		<Suspense fallback={<div className="flex justify-center p-12">Завантаження закладів...</div>}>
			<VenuesContent />
		</Suspense>
	);
}