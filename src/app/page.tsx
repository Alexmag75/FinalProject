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
	Search,
	Flame,
	Tag,
	X,
	ChevronLeft,
	ChevronRight,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { VenueCardItem } from "@/src/interfaces/venue";
import { VENUE_TYPES } from "../types/constants";

function HomeVenuesPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const activeTag = searchParams.get("tag") || "";
	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const [search, setSearch] = useState(searchParams.get("search") || "");
	const [type, setType] = useState(searchParams.get("type") || "");
	const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "rating");
	const [order, setOrder] = useState(searchParams.get("order") || "desc");
	const [hasWifi, setHasWifi] = useState(
		searchParams.get("hasWifi") === "true",
	);
	const [hasParking, setHasParking] = useState(
		searchParams.get("hasParking") === "true",
	);
	const [hasMusic, setHasMusic] = useState(
		searchParams.get("hasMusic") === "true",
	);
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [locationLoading, setLocationLoading] = useState(false);
	const [debouncedSearch] = useDebounce(search, 500);

	useEffect(() => {
		setType(searchParams.get("type") || "");
	}, [searchParams]);

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

				const params = new URLSearchParams(searchParams.toString());
				params.set("sortBy", "distance");
				params.set("order", "asc");
				params.set("page", "1");
				params.set("lat", position.coords.latitude.toString());
				params.set("lng", position.coords.longitude.toString());
				router.push(`/?${params.toString()}`, { scroll: false });

				toast.success("Локацію отримано! Заклади відсортовано за відстанню.");
			},
			(error) => {
				console.error(error);
				toast.error(
					"Не вдалося отримати доступ до геолокації. Перевірте дозволи браузера.",
				);
				setLocationLoading(false);
			},
			{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
		);
	};
	const updateURL = (
		currentSearch: string,
		currentType: string,
		currentSort: string,
		currentOrder: string,
		wifi: boolean,
		parking: boolean,
		music: boolean,
		userCoords: { lat: number; lng: number } | null,
		tag: string,
		pageNumber: number,
	) => {
		const params = new URLSearchParams();

		if (currentSearch) params.append("search", currentSearch);
		if (currentType) params.append("type", currentType);
		if (currentSort) params.append("sortBy", currentSort);
		if (currentOrder) params.append("order", currentOrder);
		if (wifi) params.append("hasWifi", "true");
		if (parking) params.append("hasParking", "true");
		if (music) params.append("hasMusic", "true");
		if (tag) params.append("tag", tag);

		params.append("page", pageNumber.toString());
		params.append("limit", "9");

		if (currentSort === "distance" && userCoords) {
			params.append("lat", userCoords.lat.toString());
			params.append("lng", userCoords.lng.toString());
		}
		router.push(`/?${params.toString()}`, { scroll: false });
	};

	useEffect(() => {
		updateURL(
			debouncedSearch,
			type,
			sortBy,
			order,
			hasWifi,
			hasParking,
			hasMusic,
			coords,
			activeTag,
			currentPage,
		);
	}, [
		debouncedSearch,
		type,
		sortBy,
		order,
		hasWifi,
		hasParking,
		hasMusic,
		coords,
		activeTag,
	]);

	const handlePageChange = (newPage: number) => {
		updateURL(
			search,
			type,
			sortBy,
			order,
			hasWifi,
			hasParking,
			hasMusic,
			coords,
			activeTag,
			newPage,
		);
		document
			.getElementById("catalog-results-top")
			?.scrollIntoView({ behavior: "smooth" });
	};

	const { data: popularData, isLoading: isPopularLoading } = useQuery<{
		venues: VenueCardItem[];
	}>({
		queryKey: ["popularVenues"],
		queryFn: () => apiFetch("/venues?sortBy=rating&order=desc&limit=3"),
	});
	const popularVenues = popularData?.venues?.slice(0, 3) || [];

	const {
		data: venuesData,
		isLoading: isVenuesLoading,
		isError: isVenuesError,
	} = useQuery<{
		venues: VenueCardItem[];
		allTags: { id: string; name: string }[];
		pagination: PaginationMeta;
	}>({
		queryKey: ["venues", searchParams.toString()],
		queryFn: () => apiFetch(`/venues?${searchParams.toString()}`),
	});

	const handleHeroSearch = (e: React.FormEvent) => {
		e.preventDefault();

		const queryText = search.trim();
		if (!queryText) return;

		const params = new URLSearchParams(searchParams.toString());
		params.set("page", "1"); // Скидаємо сторінку

		const textLower = queryText.toLowerCase();

		if (textLower === "бар" || textLower === "bar") {
			setType("BAR");
			params.set("type", "BAR");
			params.delete("search");
			setSearch("");
		} else if (textLower === "паб" || textLower === "pub") {
			setType("PUB");
			params.set("type", "PUB");
			params.delete("search");
			setSearch("");
		} else if (textLower === "клуб" || textLower === "club") {
			setType("CLUB");
			params.set("type", "CLUB");
			params.delete("search");
			setSearch("");
		} else if (textLower === "крафт" || textLower === "#крафт") {
			const cleanTag = queryText.replace("#", "");
			params.set("tag", cleanTag);
			params.delete("search");
			setSearch("");
		} else {
			params.set("search", queryText);
		}
		router.push(`/?${params.toString()}`, { scroll: false });

		setTimeout(() => {
			document
				.getElementById("catalog-section")
				?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	};

	const resetFilters = () => {
		setSearch("");
		setType("");
		setSortBy("rating");
		setOrder("desc");
		setHasWifi(false);
		setHasParking(false);
		setHasMusic(false);
		setCoords(null);
		router.push("/?page=1&limit=9");
		toast.info("Усі фільтри каталогу скинуто");
	};

	const handleClearTag = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("tag");
		params.set("page", "1");
		router.push(`/?${params.toString()}`, { scroll: false });
	};

	const formatDistance = (distInKm: number | undefined) => {
		if (distInKm === undefined) return null;
		return distInKm < 1
			? `${Math.round(distInKm * 1000)} м`
			: `${distInKm.toFixed(1)} км`;
	};

	return (
		<div className="min-h-screen bg-slate-50 space-y-10 pb-12 text-xs font-medium text-slate-900">
			<section className="relative rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 py-16 px-6 text-center text-white shadow-xl overflow-hidden mx-4 my-4">
				<div className="absolute inset-0 bg-black/10 pointer-events-none" />
				<div className="relative z-10 max-w-3xl mx-auto space-y-5">
					<h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
						Знайди найкраще місце для твого вечора
					</h1>
					<p className="text-sm md:text-base text-blue-100 font-medium max-w-xl mx-auto">
						Каталог барів, пабів та клубів з чесними відгуками, зручними
						фільтрами та точною геолокацією.
					</p>

					<form
						onSubmit={handleHeroSearch}
						className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto pt-2"
					>
						<div className="relative flex-grow text-slate-900">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
							<Input
								type="text"
								placeholder="Назва закладу, кухня, крафт..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-10 h-11 bg-white text-xs rounded-xl border-none focus-visible:ring-1 focus-visible:ring-amber-400 shadow-sm"
							/>
						</div>
						<Button
							type="submit"
							size="lg"
							className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-11 rounded-xl transition shadow-sm px-6"
						>
							Шукати
						</Button>
					</form>
				</div>
			</section>
			<div className="container mx-auto px-4">
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
							<h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">
								Популярні заклади
							</h2>
						</div>
						<Button
							variant="ghost"
							onClick={() => {
								updateURL(
									"",
									"",
									"rating",
									"desc",
									false,
									false,
									false,
									null,
									"",
									1,
								);
								document
									.getElementById("catalog-section")
									?.scrollIntoView({ behavior: "smooth" });
							}}
							className="text-blue-600 font-bold hover:bg-blue-50 text-xs rounded-xl"
						>
							Весь каталог →
						</Button>
					</div>

					{isPopularLoading && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-72 bg-slate-100 animate-pulse rounded-2xl"
								/>
							))}
						</div>
					)}

					{!isPopularLoading && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							{popularVenues.map((venue) => (
								<Link
									href={`/venues/${venue.id}`}
									key={venue.id}
									className="group"
								>
									<Card className="h-full overflow-hidden hover:shadow-md transition duration-200 rounded-2xl border-slate-200 bg-white flex flex-col justify-between shadow-sm">
										<div className="relative h-44 w-full overflow-hidden bg-slate-50 border-b">
											<img
												src={
													venue.mainImage ||
													"https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600"
												}
												alt={venue.name}
												className="h-full w-full object-cover group-hover:scale-[1.02] transition duration-300"
											/>
											<div className="absolute top-2.5 right-2.5 flex items-center space-x-0.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
												<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
												<span>
													{venue.rating > 0 ? venue.rating.toFixed(1) : "0.0"}
												</span>
											</div>
										</div>
										<CardContent className="p-4 space-y-1.5">
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
										</CardContent>
										<CardFooter className="p-4 pt-0 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500 h-11">
											<span>Сер. чек:</span>
											<span className="text-slate-900 font-black text-sm">
												{venue.averageCheck} ₴
											</span>
										</CardFooter>
									</Card>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>

			<hr className="border-slate-200 max-w-7xl mx-auto px-4" />
			<div id="catalog-section" className="container mx-auto px-4">
				<div id="catalog-results-top" />
				<div className="flex flex-col lg:flex-row gap-6">
					<aside className="w-full lg:w-60 shrink-0 bg-white p-5 rounded-2xl border border-slate-200 h-fit space-y-5 lg:sticky lg:top-20 shadow-sm">
						<div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
							<SlidersHorizontal className="h-4 w-4 text-blue-600" />
							<h2 className="font-black uppercase tracking-wider text-slate-800 text-sm">
								Фільтри каталогу
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
								className={`w-full h-9 flex items-center justify-center gap-1.5 text-xs rounded-xl border-slate-200 transition-colors ${coords ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 font-bold" : ""}`}
							>
								<Navigation
									className={`h-3.5 w-3.5 ${locationLoading ? "animate-spin" : ""} ${coords ? "fill-green-600 text-green-600" : ""}`}
								/>
								{locationLoading
									? "Визначення..."
									: coords
										? "Геолокацію отримано"
										: "Знайти заклади поруч"}
							</Button>
						</div>

						<div className="space-y-1.5">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								Фільтр за назвою
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									type="text"
									placeholder="Назва або адреса..."
									className="pl-9 h-9 text-xs rounded-xl border-slate-200"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										const params = new URLSearchParams(searchParams.toString());
										params.set("page", "1");
										router.push(`/?${params.toString()}`, { scroll: false });
									}}
								/>
							</div>
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
									const params = new URLSearchParams(searchParams.toString());
									params.set("page", "1");
									if (val) {
										params.set("type", val);
									} else {
										params.delete("type");
									}
									router.push(`/?${params.toString()}`, { scroll: false });
								}}
								className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer text-slate-900"
							>
								<option value="">Усі типи</option>
								{VENUE_TYPES.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1.5">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								Швидкий пошук за тегом
							</label>
							<div className="relative flex items-center">
								<select
									value={activeTag}
									onChange={(e) => {
										const val = e.target.value;
										const params = new URLSearchParams(searchParams.toString());
										params.set("page", "1");
										if (val) params.set("tag", val);
										else params.delete("tag");
										router.push(`/?${params.toString()}`, { scroll: false });
									}}
									className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer shadow-sm"
								>
									<option value="">Усі теги</option>
									{venuesData?.allTags?.map((t) => (
										<option key={t.id} value={t.name}>
											#{t.name}
										</option>
									))}
								</select>
								<Tag className="absolute right-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
							</div>
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
										onChange={(e) => setHasWifi(e.target.checked)}
										className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
									/>
									<Wifi className="h-3.5 w-3.5 text-slate-400" />{" "}
									<span>Є Wi-Fi</span>
								</label>
								<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={hasParking}
										onChange={(e) => setHasParking(e.target.checked)}
										className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
									/>
									<ParkingCircle className="h-3.5 w-3.5 text-slate-400" />{" "}
									<span>Парковка</span>
								</label>
								<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={hasMusic}
										onChange={(e) => setHasMusic(e.target.checked)}
										className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
									/>
									<Music className="h-3.5 w-3.5 text-slate-400" />{" "}
									<span>Жива музика</span>
								</label>
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
					<main className="flex-grow space-y-6 flex flex-col justify-between">
						<div className="space-y-5">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div className="space-y-0.5">
									<h2 className="text-xl font-black tracking-tight text-slate-900">
										Усі заклади
									</h2>
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
											if (newSort === "distance" && !coords) requestLocation();
											else {
												setSortBy(newSort);
												setOrder(newOrder);
											}
										}}
										className="bg-transparent font-bold text-slate-700 h-7 px-1 focus:outline-none cursor-pointer"
									>
										<option value="rating-desc">Найвищий рейтинг</option>
										<option value="distance-asc">Найближчі до мене</option>
										<option value="averageCheck-asc">Спочатку дешевші</option>
										<option value="averageCheck-desc">Спочатку дорожчі</option>
									</select>
								</div>
							</div>

							{isVenuesLoading && (
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
							{isVenuesError && (
								<div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
									<p className="font-bold text-amber-900 text-sm">
										Закладів за обраним типом поки що немає.
									</p>
									<p className="text-xs text-amber-700">
										Спробуйте обрати інший тип закладу або скинути фільтри.
									</p>
									<Button
										onClick={resetFilters}
										variant="outline"
										size="sm"
										className="bg-white border-amber-300 hover:bg-amber-100 font-bold text-xs rounded-xl"
									>
										Показати всі заклади
									</Button>
								</div>
							)}
							{venuesData?.venues.length === 0 && (
								<div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm font-semibold">
									Нічого не знайдено за заданими критеріями.
								</div>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
								{venuesData?.venues.map((venue) => (
									<Link
										href={`/venues/${venue.id}`}
										key={venue.id}
										className="group"
									>
										<Card className="h-full overflow-hidden hover:shadow-md transition duration-200 rounded-2xl border-slate-200 bg-white flex flex-col justify-between shadow-sm">
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
														{venue.tags.slice(0, 2).map((t) => (
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
						</div>
						{venuesData &&
							venuesData.pagination &&
							venuesData.pagination.totalPages > 1 && (
								<div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200 mt-6">
									<p className="text-xs text-slate-400 font-bold">
										Показано{" "}
										<span className="text-slate-700">
											{venuesData.venues.length}
										</span>{" "}
										з{" "}
										<span className="text-slate-700">
											{venuesData.pagination.totalItems}
										</span>{" "}
										закладів
									</p>

									<div className="flex items-center space-x-1">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-xl border-slate-200"
											disabled={!venuesData.pagination.hasPrevPage}
											onClick={() => handlePageChange(currentPage - 1)}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>

										{Array.from(
											{ length: venuesData.pagination.totalPages },
											(_, index) => {
												const pageNum = index + 1;
												return (
													<Button
														key={pageNum}
														variant={
															currentPage === pageNum ? "default" : "outline"
														}
														size="sm"
														className={`h-8 w-8 rounded-xl font-bold transition-all text-xs ${
															currentPage === pageNum
																? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
																: "hover:bg-slate-100 text-slate-600 border-slate-200"
														}`}
														onClick={() => handlePageChange(pageNum)}
													>
														{pageNum}
													</Button>
												);
											},
										)}

										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-xl border-slate-200"
											disabled={!venuesData.pagination.hasNextPage}
											onClick={() => handlePageChange(currentPage + 1)}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
					</main>
				</div>
			</div>
		</div>
	);
}
export default function HomePage() {
	return (
		<Suspense fallback={<div className="flex justify-center p-12">Завантаження...</div>}>
			<HomeVenuesPage />
		</Suspense>
	);
}