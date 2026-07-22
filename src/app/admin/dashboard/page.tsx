"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	BarChart3,
	Users,
	MapPin,
	Heart,
	MessageSquare,
	Star,
	Newspaper,
	PlusCircle,
	ChevronDown,
	ChevronRight,
	LogOut,
	ShieldCheck,
	FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VenuesManagement from "../venues/VenuesManagement";
import CreateVenue from "@/src/app/admin/venues/CreateVenue";
import CategoryManager from "@/src/app/admin/venues/CategoryManager";
import NewsModeration from "@/src/app/admin/venues/NewsModeration";
import UsersManagement from "@/src/app/admin/venues/UsersManagement";
import AnalyticsSection from "@/src/app/admin/venues/AnalyticsSection";
import ReviewsModeration from "@/src/app/admin/venues/ReviewsModeration";
import FavoriteVenues from "@/src/app/admin/venues/FavoriteVenues";
import MyComments from "@/src/app/admin/venues/MyComments";
import MyRatings from "@/src/app/admin/venues/MyRatings";

function AdminDashboardContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState(
		searchParams.get("tab") || "venues-all-list",
	);
	const [isVenuesOpen, setIsVenuesOpen] = useState(true);

	useEffect(() => {
		const tabFromUrl = searchParams.get("tab");
		if (tabFromUrl) {
			void setActiveTab(tabFromUrl);
		}
	}, [searchParams]);

	const handleExitPanel = () => {
		router.push("/");
	};

	const getTabTitle = (tab: string) => {
		const titles: Record<string, string> = {
			"venues-all-list": "Список всіх закладів",
			"venues-add": "Додати новий заклад",
			"venues-categories": "Категорії та підбірки об'єктів",
			"venues-news-edit": "Редагування новин закладу",
			favorites: "Улюблені заклади",
			"my-comments": "Мої коментарі",
			"my-ratings": "Мої оцінки",
			users: "Всі користувачі на платформі",
			analytics: "Аналітика платформи",
			"comments-mod": "Модерація коментарів",
			news: "Загальні новини",
		};
		return titles[tab] || "Панель керування";
	};

	return (
		<div className="flex w-full min-h-screen bg-slate-100 text-slate-900">
			<aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 shrink-0 shadow-xl border-r border-slate-800">
				<div className="space-y-4 overflow-y-auto max-h-[calc(100vh-80px)] pr-1">
					<div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800">
						<ShieldCheck className="text-amber-500 h-6 w-6" />
						<span className="font-bold text-lg tracking-wide text-white">
							Piyachok Admin
						</span>
					</div>
					<nav className="space-y-1">
						<div>
							<button
								type="button"
								onClick={() => setIsVenuesOpen(!isVenuesOpen)}
								className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
									activeTab.startsWith("venues-")
										? "bg-slate-800 text-white"
										: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
								}`}
							>
								<span className="flex items-center gap-3">
									<MapPin size={18} />
									Всі заклади
								</span>
								{isVenuesOpen ? (
									<ChevronDown size={14} />
								) : (
									<ChevronRight size={14} />
								)}
							</button>
							{isVenuesOpen && (
								<div className="ml-6 mt-1 space-y-1 border-l border-slate-800 pl-2">
									<button
										type="button"
										onClick={() => setActiveTab("venues-all-list")}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all ${
											activeTab === "venues-all-list"
												? "bg-amber-500 text-slate-950 font-semibold"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<MapPin size={14} /> Список всіх закладів
									</button>
									<button
										type="button"
										onClick={() => setActiveTab("venues-add")}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all ${
											activeTab === "venues-add"
												? "bg-amber-500 text-slate-950 font-semibold"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<PlusCircle size={14} /> Додати заклад
									</button>
									<button
										type="button"
										onClick={() => setActiveTab("venues-categories")}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all ${
											activeTab === "venues-categories"
												? "bg-amber-500 text-slate-950 font-semibold"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<FolderPlus size={14} /> Категорії та підбірки
									</button>
									<button
										type="button"
										onClick={() => setActiveTab("venues-news-edit")}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all ${
											activeTab === "venues-news-edit"
												? "bg-amber-500 text-slate-950 font-semibold"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<Newspaper size={14} /> Редагування новин
									</button>
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => setActiveTab("favorites")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "favorites"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<Heart size={18} /> Улюблені заклади
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("my-comments")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "my-comments"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<MessageSquare size={18} /> Мої коментарі
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("my-ratings")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "my-ratings"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<Star size={18} /> Мої оцінки
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("users")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "users"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<Users size={18} /> Всі користувачі
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("analytics")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "analytics"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<BarChart3 size={18} /> Аналітика
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("comments-mod")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "comments-mod"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<MessageSquare size={18} /> Коментарі
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("news")}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
								activeTab === "news"
									? "bg-amber-500 text-slate-950 font-semibold"
									: "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
							}`}
						>
							<Newspaper size={18} /> Новини
						</button>
					</nav>
				</div>
				<div className="border-t border-slate-800 pt-4">
					<Button
						variant="ghost"
						onClick={handleExitPanel}
						className="w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
					>
						<LogOut size={18} />
						Вийти з панелі
					</Button>
				</div>
			</aside>
			<main className="flex-1 bg-slate-50 overflow-y-auto flex flex-col">
				<header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
					<h1 className="text-xl font-bold text-slate-800">
						{getTabTitle(activeTab)}
					</h1>
					<div className="text-xs font-semibold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20">
						Режим: Суперадмін
					</div>
				</header>

				<div className="p-8 flex-1">
					{activeTab === "venues-all-list" && <VenuesManagement />}
					{activeTab === "venues-add" && <CreateVenue />}
					{activeTab === "venues-categories" && <CategoryManager />}
					{activeTab === "venues-news-edit" && <NewsModeration />}

					{activeTab === "favorites" && <FavoriteVenues />}
					{activeTab === "my-comments" && <MyComments />}
					{activeTab === "my-ratings" && <MyRatings />}
					{activeTab === "users" && <UsersManagement />}
					{activeTab === "analytics" && <AnalyticsSection />}
					{activeTab === "comments-mod" && <ReviewsModeration />}
					{activeTab === "news" && <NewsModeration />}
				</div>
			</main>
		</div>
	);
}

export default function AdminDashboard() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center animate-pulse">
					Завантаження панелі адміна...
				</div>
			}
		>
			<AdminDashboardContent />
		</Suspense>
	);
}
