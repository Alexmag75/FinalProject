"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
	Plus,
	Trash2,
	Edit,
	ArrowLeft,
	Image as ImageIcon,
	Calendar,
	X,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { NewsItem } from "@/src/interfaces/news";
import { deleteVenueNews, getVenueNews } from "@/src/services/newsService";
import { toast } from "sonner";

export default function VenueNewsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: venueId } = use(params);
	const router = useRouter();
	const [news, setNews] = useState<NewsItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

	useEffect(() => {
		async function loadNews() {
			try {
				setIsLoading(true);
				const data = await getVenueNews(venueId);
				setNews(data);
			} catch (error) {
				toast.error("Не вдалося завантажити стрічку новин закладу");
			} finally {
				setIsLoading(false);
			}
		}

		if (venueId) {
			void loadNews();
		}
	}, [venueId]);

	const executeDelete = async (newsId: string) => {
		try {
			await deleteVenueNews(venueId, newsId);
			setNews((prev) => prev.filter((item) => item.id !== newsId));
			toast.success("Новину успішно видалено зі стрічки!");
		} catch (error: any) {
			toast.error(error.message || "Не вдалося видалити новину");
		}
	};

	const handleDeleteClick = (newsId: string) => {
		toast("Ви впевнені, що хочете видалити цю новину?", {
			description:
				"Ця дія безповоротно вилучить публікацію з загальної стрічки.",
			action: {
				label: "Видалити",
				onClick: () => executeDelete(newsId),
			},
			duration: 5000,
		});
	};

	const getCategoryLabel = (cat: string) => {
		switch (cat) {
			case "PROMOTION":
				return "🔥 Акція";
			case "EVENT":
				return "🎉 Подія";
			default:
				return "📢 Загальне";
		}
	};

	return (
		<div className="container max-w-4xl mx-auto p-6 space-y-6 text-xs font-medium text-slate-900">
			<div className="flex items-center justify-between border-b border-slate-200 pb-4">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={() => router.push("/manager/dashboard")}
						className="h-8 w-8 rounded-xl border-slate-200"
					>
						<ArrowLeft size={14} />
					</Button>
					<div>
						<h1 className="text-base font-bold tracking-tight text-slate-900">
							Новини та акції закладу
						</h1>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Керування публікаціями на головній стрічці сайту
						</p>
					</div>
				</div>
				<Link href={`/manager/venues/${venueId}/news/create`}>
					<Button className="h-9 px-4 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-1.5">
						<Plus size={14} /> Створити новину
					</Button>
				</Link>
			</div>
			{isLoading ? (
				<div className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
					<Loader2 size={18} className="animate-spin text-slate-400" />
					<span className="uppercase tracking-wider text-[10px]">
						Завантаження новин...
					</span>
				</div>
			) : news.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center">
					<p className="text-slate-500 font-semibold">
						У цього закладу ще немає опублікованих новин.
					</p>
					<Link
						href={`/manager/venues/${venueId}/news/create`}
						className="mt-2"
					>
						<Button
							variant="link"
							className="text-blue-600 font-bold p-0 h-auto hover:underline"
						>
							Опублікувати першу новину
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{news.map((item) => (
						<Card
							key={item.id}
							className="flex flex-col justify-between overflow-hidden border-slate-200 rounded-2xl bg-white shadow-sm"
						>
							<div className="flex gap-4 p-4">
								{/* Превью картинки */}
								<div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
									{item.image ? (
										<img
											src={item.image}
											alt={item.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-slate-300">
											<ImageIcon size={20} />
										</div>
									)}
								</div>
								<div className="space-y-1 flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
											{getCategoryLabel(item.category)}
										</span>
										<span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
											<Calendar size={11} />
											{new Date(item.createdAt).toLocaleDateString("uk-UA")}
										</span>
									</div>
									<h3 className="font-bold text-sm text-slate-900 truncate">
										{item.title}
									</h3>
									<p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">
										{item.content}
									</p>

									<button
										type="button"
										onClick={() => setSelectedNews(item)}
										className="text-[11px] text-blue-600 hover:underline font-bold pt-0.5 block"
									>
										Читати повністю...
									</button>
								</div>
							</div>

							<div className="bg-slate-50/80 px-3 py-2 border-t border-slate-100 flex justify-end gap-1.5">
								<Link href={`/manager/venues/${venueId}/news/${item.id}/edit`}>
									<Button
										variant="ghost"
										className="h-7 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-200/60 flex items-center gap-1 px-2.5"
									>
										<Edit size={12} /> Редагувати
									</Button>
								</Link>
								<Button
									variant="ghost"
									onClick={() => handleDeleteClick(item.id)}
									className="h-7 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 px-2.5"
								>
									<Trash2 size={12} /> Видалити
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			{selectedNews && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
					<div
						className="absolute inset-0"
						onClick={() => setSelectedNews(null)}
					></div>

					<div className="bg-white border border-slate-200 rounded-2xl shadow-lg max-w-md w-full max-h-[80vh] flex flex-col relative z-10 overflow-hidden text-slate-900">
						<div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
							<div className="flex items-center gap-2">
								<span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-bold">
									{getCategoryLabel(selectedNews.category)}
								</span>
								<span className="text-[10px] text-slate-400 font-bold">
									{new Date(selectedNews.createdAt).toLocaleDateString("uk-UA")}
								</span>
							</div>
							<button
								onClick={() => setSelectedNews(null)}
								className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition"
							>
								<X size={16} />
							</button>
						</div>

						<div className="p-5 overflow-y-auto space-y-3.5">
							{selectedNews.image && (
								<div className="w-full h-40 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
									<img
										src={selectedNews.image}
										alt={selectedNews.title}
										className="w-full h-full object-cover"
									/>
								</div>
							)}

							<h2 className="text-sm font-black tracking-tight text-slate-900 leading-snug">
								{selectedNews.title}
							</h2>

							<p className="text-[11px] text-slate-600 font-semibold whitespace-pre-wrap leading-relaxed">
								{selectedNews.content}
							</p>
						</div>

						<div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
							<Button
								type="button"
								onClick={() => setSelectedNews(null)}
								className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-sm"
							>
								Закрити вікно
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
