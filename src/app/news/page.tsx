"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	Calendar,
	Megaphone,
	Sparkles,
	Tag,
	Ticket,
	Info,
	MapPin,
	X,
	ArrowRight,
	ExternalLink,
} from "lucide-react";
import { PaginationMeta } from "@/src/interfaces/pagination";
import { FullNewsItem } from "@/src/interfaces/news";
import Pagination from "@/components/ui/pagination-custom";

export default function NewsPage() {
	const [activeTab, setActiveTab] = useState<"GENERAL" | "PROMOTION" | "EVENT">(
		"GENERAL",
	);
	const [news, setNews] = useState<FullNewsItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationMeta | null>(null);
	const [selectedNews, setSelectedNews] = useState<FullNewsItem | null>(null);

	const fetchNews = async (category: string, pageNumber: number) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/news?category=${category}&page=${pageNumber}&limit=9`,
			);
			if (response.ok) {
				const data = await response.json();
				setNews(data.news || []);
				setPagination(data.pagination || null);
			}
		} catch (error) {
			console.error("Помилка завантаження новин:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchNews(activeTab, currentPage);
	}, [activeTab, currentPage]);
	const handleTabChange = (tab: "GENERAL" | "PROMOTION" | "EVENT") => {
		setActiveTab(tab);
		setCurrentPage(1);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("uk-UA", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-xs relative">
			<div id="news-feed-top" className="absolute -top-6 left-0" />
			<div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between gap-1 shadow-md">
				<h1 className="text-xl font-black tracking-tight flex items-center gap-2">
					<Megaphone className="text-amber-400" size={20} /> Стрічка новин та
					подій 📰
				</h1>
				<p className="text-slate-300 text-[11px] font-medium">
					Актуальні новини, гарячі акції та найцікавіші івенти у закладах твого
					міста в одному місці.
				</p>
			</div>
			<div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
				<button
					onClick={() => handleTabChange("GENERAL")}
					className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "GENERAL"
							? "bg-white text-slate-900 shadow-sm"
							: "text-slate-500 hover:text-slate-800"
					}`}
				>
					<Info size={14} /> {activeTab === "GENERAL" && <span>•</span>}{" "}
					Загальні
				</button>
				<button
					onClick={() => handleTabChange("PROMOTION")}
					className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "PROMOTION"
							? "bg-white text-slate-900 shadow-sm"
							: "text-slate-500 hover:text-slate-800"
					}`}
				>
					<Tag
						size={14}
						className={activeTab === "PROMOTION" ? "text-amber-500" : ""}
					/>{" "}
					{activeTab === "PROMOTION" && <span>•</span>} Акції
				</button>
				<button
					onClick={() => handleTabChange("EVENT")}
					className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "EVENT"
							? "bg-white text-slate-900 shadow-sm"
							: "text-slate-500 hover:text-slate-800"
					}`}
				>
					<Ticket
						size={14}
						className={activeTab === "EVENT" ? "text-indigo-500" : ""}
					/>{" "}
					{activeTab === "EVENT" && <span>•</span>} Події
				</button>
			</div>
			{isLoading ? (
				<div className="text-center py-12 text-slate-400 animate-pulse">
					Завантаження стрічки новин...
				</div>
			) : news.length === 0 ? (
				<div className="bg-slate-50 border border-slate-100 rounded-2xl py-12 text-center text-slate-400 italic flex flex-col items-center gap-1.5">
					<Megaphone size={24} className="text-slate-300" />
					<span>У цій категорії поки немає опублікованих пропозицій</span>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
					{news
						.filter((item) => item.isPromoted)
						.map((item) => (
							<div
								key={item.id}
								className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-sm relative group ${
									item.isPromoted
										? "border-amber-400 ring-1 ring-amber-400/30 bg-amber-50/5"
										: "border-slate-200 hover:border-slate-300"
								}`}
							>
								{item.isPromoted && (
									<div className="absolute top-3 right-3 bg-amber-500 text-white font-black px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1 z-10 animate-pulse">
										<Sparkles size={10} className="fill-white" /> Топ
									</div>
								)}

								<div
									onClick={() => setSelectedNews(item)}
									className="h-44 w-full bg-slate-100 relative overflow-hidden cursor-pointer"
								>
									<img
										src={item.image || "/images/news-placeholder.jpg"}
										alt={item.title}
										className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
									/>
								</div>

								<div className="p-4 flex-1 flex flex-col justify-between space-y-3">
									<div className="space-y-2">
										<div className="flex items-center gap-1.5 text-slate-500 font-semibold">
											<div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
												<img
													src={item.venue.mainImage}
													alt={item.venue.name}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex flex-col truncate">
												<Link
													href={`/venues/${item.venue.id}`}
													className="text-slate-800 text-[11px] font-bold truncate max-w-[140px] hover:text-amber-500 hover:underline transition-colors"
												>
													{item.venue.name}
												</Link>
											</div>
											<span className="text-slate-300">•</span>
											<span className="text-[10px] font-medium shrink-0 flex items-center gap-0.5">
                     <Calendar size={11} /> {formatDate(item.createdAt)}
                  </span>
										</div>
										<div className="text-[10px] text-slate-400 flex items-center gap-0.5 font-medium truncate">
											<MapPin size={11} className="text-slate-300 shrink-0" />
											<span className="truncate">{item.venue.address}</span>
										</div>
										<h3
											onClick={() => setSelectedNews(item)}
											className="text-sm font-extrabold text-slate-800 group-hover:text-amber-500 transition-colors leading-tight line-clamp-2 cursor-pointer"
										>
											{item.title}
										</h3>
										<p className="text-slate-600 font-medium break-words whitespace-pre-line leading-relaxed line-clamp-4">
											{item.content}
										</p>
									</div>
									<div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold">
               <span
				   className={`px-2 py-0.5 rounded-md ${
					   item.category === "GENERAL"
						   ? "bg-slate-100 text-slate-600"
						   : item.category === "PROMOTION"
							   ? "bg-amber-50 text-amber-600"
							   : "bg-indigo-50 text-indigo-600"
				   }`}
			   >
                  {item.category === "GENERAL"
					  ? "ℹ️ Новина"
					  : item.category === "PROMOTION"
						  ? "🔥 Акція"
						  : "🎉 Подія"}
               </span>

										<button
											onClick={() => setSelectedNews(item)}
											className="text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors group/btn font-extrabold text-[11px]"
										>
											Читати далі
											<ArrowRight
												size={12}
												className="group-hover/btn:translate-x-0.5 transition-transform"
											/>
										</button>
									</div>
								</div>
							</div>
						))}
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

			{selectedNews && (
				<div
					className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
					onClick={() => setSelectedNews(null)}
				>
					<div
						className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
						onClick={(e) => e.stopPropagation()}
					>
						{selectedNews.image && (
							<div className="h-56 w-full bg-slate-100 relative shrink-0">
								<img
									src={selectedNews.image}
									alt={selectedNews.title}
									className="w-full h-full object-cover"
								/>
								<button
									onClick={() => setSelectedNews(null)}
									className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-1.5 rounded-full transition shadow"
								>
									<X size={16} />
								</button>
							</div>
						)}

						<div className="p-5 flex-1 overflow-y-auto space-y-4">
							{!selectedNews.image && (
								<div className="flex justify-end -mb-4">
									<button
										onClick={() => setSelectedNews(null)}
										className="text-slate-400 hover:text-slate-600 p-1"
									>
										<X size={18} />
									</button>
								</div>
							)}

							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<div className="flex items-center gap-2">
									<img
										src={selectedNews.venue.mainImage}
										alt={selectedNews.venue.name}
										className="w-6 h-6 rounded-full object-cover border border-slate-200"
									/>
									<div>
										<Link
											href={`/venues/${selectedNews.venue.id}`}
											className="font-bold text-slate-900 text-[12px] hover:text-amber-500 hover:underline transition-colors block"
										>
											{selectedNews.venue.name}
										</Link>
										<div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
											<MapPin size={10} className="text-slate-300" />
											<span>{selectedNews.venue.address}</span>
										</div>
									</div>
								</div>
								<div className="text-right text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
									<Calendar size={11} /> {formatDate(selectedNews.createdAt)}
								</div>
							</div>
							<div>
								<span
									className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
										selectedNews.category === "GENERAL"
											? "bg-slate-100 text-slate-600"
											: selectedNews.category === "PROMOTION"
												? "bg-amber-50 text-amber-600 border border-amber-100"
												: "bg-indigo-50 text-indigo-600 border border-indigo-100"
									}`}
								>
									{selectedNews.category === "GENERAL"
										? "ℹ️ Новина"
										: selectedNews.category === "PROMOTION"
											? "🔥 Безкоштовна акція"
											: "🎉 Подія / Івент"}
								</span>
							</div>
							<h2 className="text-base font-black text-slate-900 leading-snug">
								{selectedNews.title}
							</h2>
							<p className="text-slate-700 font-medium text-[11px] break-words whitespace-pre-line leading-relaxed">
								{selectedNews.content}
							</p>
						</div>
						<div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center shrink-0">
							<Link
								href={`/venues/${selectedNews.venue.id}`}
								className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-lg text-[11px] font-bold transition shadow-sm flex items-center gap-1"
							>
								<ExternalLink size={12} className="text-slate-400" />
								Перейти до закладу
							</Link>

							<button
								onClick={() => setSelectedNews(null)}
								className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition shadow-sm"
							>
								Закрити
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
