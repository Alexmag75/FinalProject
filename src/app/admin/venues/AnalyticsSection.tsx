"use client";

import { useEffect, useState, useRef } from "react";
import {
	BarChart3,
	Calendar,
	Eye,
	Building2,
	AlertCircle,
	Search,
	ChevronDown,
} from "lucide-react";
import { AnalyticsData } from "@/src/interfaces/analytics";
import { VenueOption } from "@/src/interfaces/venue";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/src/helpers/auth";

export default function AnalyticsSection() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [days, setDays] = useState<number>(7);
	const [venues, setVenues] = useState<VenueOption[]>([]);
	const [selectedVenueId, setSelectedVenueId] = useState<string>("all");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [venueSearch, setVenueSearch] = useState<string>("");
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		const fetchVenues = async () => {
			try {
				const response = await fetch("/api/venues");
				if (response.ok) {
					const resData = await response.json();
					const venuesList = resData.venues || resData || [];
					setVenues(venuesList);
				}
			} catch (error) {
				console.error("Помилка завантаження списку закладів:", error);
			}
		};
		void fetchVenues();
	}, []);

	useEffect(() => {
		const fetchAnalytics = async () => {
			setIsLoading(true);
			try {
				const token = getAuthToken();
				let url = `/api/admin/analytics?days=${days}`;
				if (selectedVenueId !== "all") {
					url += `&venueId=${selectedVenueId}`;
				}
				const response = await fetch(url, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
					credentials: "include",
				});
				if (!response.ok) new Error("Не вдалося завантажити аналітику");
				const resData = await response.json();
				setData(resData);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchAnalytics();
	}, [days, selectedVenueId]);

	const filteredVenues = venues.filter((venue) =>
		venue.name.toLowerCase().includes(venueSearch.toLowerCase()),
	);

	const selectedVenueName =
		selectedVenueId === "all"
			? "📊 Всі заклади (Загалом)"
			: venues.find((v) => v.id === selectedVenueId)?.name ||
				"Заклад не знайдено";

	const maxCount =
		data?.chartData && data.chartData.length > 0
			? Math.max(...data.chartData.map((item) => item.count), 0)
			: 0;

	const yAxisMax = maxCount === 0 ? 10 : Math.ceil(maxCount / 5) * 5;
	const yAxisLabels = [
		yAxisMax,
		Math.round(yAxisMax * 0.75),
		Math.round(yAxisMax * 0.5),
		Math.round(yAxisMax * 0.25),
		0,
	];

	const formatDateLabel = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
				<div className="relative w-full sm:w-72" ref={dropdownRef}>
					<div className="flex items-center gap-2 text-slate-800 text-sm">
						<Building2 size={16} className="text-slate-400 shrink-0" />
						<button
							type="button"
							onClick={() => setIsOpen(!isOpen)}
							className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-left flex justify-between items-center transition-all hover:bg-slate-100 font-semibold text-xs"
						>
							<span className="truncate">{selectedVenueName}</span>
							<ChevronDown
								size={14}
								className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
							/>
						</button>
					</div>

					{isOpen && (
						<div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2 space-y-2">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
								<Input
									type="text"
									placeholder="Пошук закладу..."
									value={venueSearch}
									onChange={(e) => setVenueSearch(e.target.value)}
									className="pl-8 h-8 text-xs rounded-lg border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-amber-500"
									autoFocus
								/>
							</div>
							<div className="space-y-0.5 pt-1">
								<button
									type="button"
									onClick={() => {
										setSelectedVenueId("all");
										setIsOpen(false);
										setVenueSearch("");
									}}
									className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
										selectedVenueId === "all"
											? "bg-amber-500/10 text-amber-700"
											: "text-slate-700 hover:bg-slate-50"
									}`}
								>
									📊 Всі заклади (Загалом)
								</button>

								{filteredVenues.length > 0 ? (
									filteredVenues.map((venue) => (
										<button
											key={venue.id}
											type="button"
											onClick={() => {
												setSelectedVenueId(venue.id);
												setIsOpen(false);
												setVenueSearch("");
											}}
											className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate block transition-colors ${
												selectedVenueId === venue.id
													? "bg-amber-500/10 text-amber-700 font-bold"
													: "text-slate-700 hover:bg-slate-50"
											}`}
										>
											{venue.name}
										</button>
									))
								) : (
									<div className="text-center py-3 text-[11px] text-slate-400 italic">
										Нічого не знайдено
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
					<div className="flex items-center gap-2 text-sm text-slate-600">
						<Calendar size={16} className="text-slate-400" />
						<span>Період:</span>
					</div>
					<div className="flex gap-2 ml-2">
						{[7, 14, 30].map((d) => (
							<button
								key={d}
								onClick={() => setDays(d)}
								className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
									days === d
										? "bg-slate-900 text-white shadow-sm"
										: "bg-slate-100 text-slate-600 hover:bg-slate-200"
								}`}
							>
								{d} днів
							</button>
						))}
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="text-center py-12 text-slate-500 animate-pulse">
					Оновлення даних аналітики...
				</div>
			) : (
				<>
					{data && (
						<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
							<div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
								<Eye size={24} />
							</div>
							<div>
								<p className="text-sm font-medium text-slate-500">
									{selectedVenueId === "all"
										? "Перегляди всіх закладів"
										: "Перегляди обраного закладу"}
								</p>
								<h3 className="text-2xl font-bold text-slate-900">
									{data.totalViews}
								</h3>
							</div>
						</div>
					)}

					<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
						<h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
							<BarChart3 size={16} className="text-slate-400" /> Графік
							активності в розрізі часу
						</h3>
						{data && data.chartData && data.chartData.length > 0 ? (
							<div className="w-full overflow-x-auto pb-2">
								<div className="min-w-[650px] sm:min-w-full flex">
									<div className="flex flex-col justify-between h-48 text-[11px] font-semibold text-slate-400 pr-3 pb-1 text-right select-none w-10 shrink-0">
										{yAxisLabels.map((label, idx) => (
											<span key={idx}>{label}</span>
										))}
									</div>
									<div className="flex-1 relative">
										<div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
											{[1, 2, 3, 4, 5].map((_, idx) => (
												<div
													key={idx}
													className={`w-full border-b ${idx === 4 ? "border-slate-300" : "border-slate-100"}`}
												/>
											))}
										</div>
										<div className="flex items-end justify-between h-48 px-2 pb-1 gap-2 relative z-10">
											{data.chartData.map((item, index) => {
												const heightPercent =
													yAxisMax > 0 ? (item.count / yAxisMax) * 100 : 0;
												return (
													<div
														key={index}
														className="flex flex-col items-center flex-1 group relative h-full justify-end"
													>
														<div className="absolute mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bottom-[100%] z-20 shadow-md whitespace-nowrap">
															<span className="font-bold">{item.count}</span>{" "}
															перегл.
														</div>
														<div
															style={{
																height: `${Math.max(heightPercent, item.count > 0 ? 4 : 0)}%`,
															}}
															className={`w-full rounded-t transition-all duration-500 ease-out ${
																item.count > 0
																	? "bg-amber-500 group-hover:bg-amber-600 shadow-sm"
																	: "h-0"
															}`}
														/>
													</div>
												);
											})}
										</div>
										<div className="flex justify-between px-2 text-[10px] font-semibold text-slate-400 pt-2 gap-2">
											{data.chartData.map((item, index) => {
												const shouldShowDate =
													days === 7 ||
													(days === 14 && index % 2 === 0) ||
													(days === 30 && index % 4 === 0) ||
													index === data.chartData.length - 1;
												return (
													<div
														key={index}
														className="flex-1 text-center truncate"
													>
														{shouldShowDate ? formatDateLabel(item.date) : "•"}
													</div>
												);
											})}
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="text-center py-12 text-sm text-slate-400 italic flex flex-col items-center gap-2">
								<AlertCircle size={20} className="text-slate-300" />
								<span>Немає даних за цей період</span>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
