"use client";

import { useState, useEffect } from "react";
import {
	Sparkles,
	Plus,
	Calendar,
	MessageSquare,
	Info,
	SlidersHorizontal,
	MapPin,
	User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MeetupModal from "@/src/app/components/MeetupModal";
import { MeetupItem } from "@/src/interfaces/meetup";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { VenueOption } from "@/src/interfaces/venue";
import Pagination from "@/components/ui/pagination-custom";

export default function GeneralMeetupsPage() {
	const [meetups, setMeetups] = useState<MeetupItem[]>([]);
	const [venues, setVenues] = useState<VenueOption[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedVenue, setSelectedVenue] = useState("");
	const [filterDate, setFilterDate] = useState("");
	const [companySize, setCompanySize] = useState("");
	const [maxBudget, setMaxBudget] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);

	useEffect(() => {
		const fetchVenues = async () => {
			try {
				const response = await fetch("/api/venues?status=APPROVED");
				if (response.ok) {
					const data = await response.json();
					setVenues(Array.isArray(data) ? data : data.venues || []);
				}
			} catch (err) {
				console.error(err);
			}
		};
		void fetchVenues();
	}, []);

	const fetchMeetups = async (pageNumber: number) => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (selectedVenue) params.append("venueId", selectedVenue);
			if (companySize) params.append("companySize", companySize);
			if (maxBudget) params.append("maxBudget", maxBudget);

			params.append("page", pageNumber.toString());
			params.append("limit", "9");

			const response = await fetch(`/api/meetups?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				let result = data.meetups || [];

				if (filterDate) {
					result = result.filter(
						(m: MeetupItem) =>
							new Date(m.dateTime).toDateString() ===
							new Date(filterDate).toDateString(),
					);
				}

				setMeetups(result);
				setPagination(data.pagination || null);
			}
		} catch (error) {
			console.error("Помилка завантаження стрічки зустрічей:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchMeetups(currentPage);
	}, [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
		void fetchMeetups(1);
	}, [selectedVenue, filterDate, companySize, maxBudget]);

	const formatDateTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return `${date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })} о ${date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
	};

	const getContactLink = (contact: string) => {
		const clean = contact.trim();
		if (clean.startsWith("@")) return `https://t.me/${clean.replace("@", "")}`;
		if (clean.startsWith("http")) return clean;
		if (/^\+?[\d\s\-]{7,15}$/.test(clean))
			return `tel:${clean.replace(/[\s\-]/g, "")}`;
		return `https://t.me/${clean}`;
	};

	const handleResetFilters = () => {
		setSelectedVenue("");
		setFilterDate("");
		setCompanySize("");
		setMaxBudget("");
		setCurrentPage(1);
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-xs relative">
			<div id="meetups-feed-top" className="absolute -top-6 left-0" />
			<div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
				<div className="space-y-1">
					<h1 className="text-xl font-black tracking-tight flex items-center gap-2">
						<Sparkles className="text-amber-400 fill-amber-400" /> Загальна
						стрічка «Пиячок» 🍻
					</h1>
					<p className="text-slate-300 text-[11px] font-medium">
						Дивись, хто прямо зараз збирає компанію у закладах твого міста.
						Приєднуйся або створюй свій інвайт!
					</p>
				</div>
				<Button
					onClick={() => setIsModalOpen(true)}
					className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 rounded-xl px-5 transition shadow-lg shrink-0 self-stretch sm:self-auto"
				>
					<Plus size={16} className="mr-1" /> Створити пропозицію
				</Button>
			</div>
			<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
				<div className="flex items-center gap-2 pb-1 border-b border-slate-100 font-bold text-slate-700">
					<SlidersHorizontal size={14} className="text-amber-500" />
					<span>Панель пошуку компанії</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
					<div>
						<select
							value={selectedVenue}
							onChange={(e) => setSelectedVenue(e.target.value)}
							className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 h-9 outline-none"
						>
							<option value="">🏢 Всі заклади</option>
							{venues.map((v) => (
								<option key={v.id} value={v.id}>
									{v.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<Input
							type="date"
							value={filterDate}
							onChange={(e) => setFilterDate(e.target.value)}
							className="h-9 bg-slate-50 border-slate-200 text-xs"
						/>
					</div>
					<div>
						<Input
							type="number"
							placeholder="👥 Кількість людей (напр. 2)"
							value={companySize}
							onChange={(e) => setCompanySize(e.target.value)}
							className="h-9 bg-slate-50 border-slate-200 text-xs"
						/>
					</div>
					<div>
						<Input
							type="number"
							placeholder="💰 Бюджет до (грн)"
							value={maxBudget}
							onChange={(e) => setMaxBudget(e.target.value)}
							className="h-9 bg-slate-50 border-slate-200 text-xs"
						/>
					</div>
				</div>
				{(selectedVenue || filterDate || companySize || maxBudget) && (
					<div className="flex justify-end pt-1">
						<button
							onClick={handleResetFilters}
							className="text-[11px] font-bold text-rose-500 hover:underline"
						>
							Скинути всі фільтри
						</button>
					</div>
				)}
			</div>
			{isLoading ? (
				<div className="text-center py-12 text-slate-400 animate-pulse">
					Шукаємо активні зустрічі...
				</div>
			) : meetups.length === 0 ? (
				<div className="bg-slate-50 border border-slate-100 rounded-2xl py-12 text-center text-slate-400 italic flex flex-col items-center gap-2">
					<Info size={24} className="text-slate-300" />
					<span className="text-sm font-medium">
						Ніхто не підходить під вказані фільтри
					</span>
					<p className="text-[11px] not-italic text-slate-400">
						Спробуй змінити параметри або створи власну зустріч!
					</p>
				</div>
			) : (
				<div className="space-y-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{meetups.map((meetup) => (
							<div
								key={meetup.id}
								className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:border-amber-400/50 transition-all"
							>
								<div className="space-y-3">
									{/* Имя и пол */}
									<div className="flex justify-between items-start gap-2">
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 overflow-hidden">
												{meetup.user.avatarUrl ? (
													<img
														src={meetup.user.avatarUrl}
														alt={"зустрич"}
														className="w-full h-full object-cover"
													/>
												) : (
													<User size={15} />
												)}
											</div>
											<div>
												<p className="font-bold text-slate-800">
													{meetup.user.name || "Анонім"}
												</p>
												<span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
													<Calendar size={11} />{" "}
													{formatDateTime(meetup.dateTime)}
												</span>
											</div>
										</div>
										<span
											className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meetup.gender === "MALE" ? "bg-blue-50 text-blue-600 border border-blue-100" : meetup.gender === "FEMALE" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-100 text-slate-600"}`}
										>
											{meetup.gender === "MALE"
												? "🧔 Хлопці"
												: meetup.gender === "FEMALE"
													? "👩 Дівчата"
													: "🌍 Будь-хто"}
										</span>
									</div>
									<div className="p-2 bg-amber-50/50 border border-amber-500/10 rounded-lg flex items-center gap-2">
										<span className="text-base shrink-0">🏢</span>
										<div className="truncate">
											<p className="font-bold text-slate-800 truncate">
												{meetup.venue.name}
											</p>
											<p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-0.5">
												<MapPin size={10} /> {meetup.venue.address}
											</p>
										</div>
									</div>
									{meetup.description && (
										<p className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-slate-600 break-words leading-relaxed italic">
											« {meetup.description} »
										</p>
									)}
									<div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
										<span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
											👥 {meetup.companySize} чол.
										</span>
										<span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
											💰 {meetup.budget} грн
										</span>
										<span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
											💵{" "}
											{meetup.whoPays === "EACH_OWN"
												? "Кожен за себе"
												: meetup.whoPays === "I_PAY"
													? "Я пригощаю"
													: "Мене пригощають"}
										</span>
									</div>
								</div>
								<div className="pt-4 mt-auto">
									<a
										href={getContactLink(meetup.contactInfo)}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 rounded-xl transition flex items-center justify-center gap-1.5"
									>
										<MessageSquare size={14} /> Написати мені
									</a>
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

			<MeetupModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={() => fetchMeetups(currentPage)}
			/>
		</div>
	);
}
