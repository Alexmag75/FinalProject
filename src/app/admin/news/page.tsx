"use client";

import { useState, useEffect } from "react";
import {
	Check,
	X,
	ShieldAlert,
	Tag,
	Ticket,
	Info,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminNewsItem } from "@/src/interfaces/news";
import { getAuthToken } from "@/src/helpers/auth";

export default function AdminNewsPage() {
	const [news, setNews] = useState<AdminNewsItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

	const fetchAdminNews = async () => {
		setIsLoading(true);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/admin/news", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setNews(data.news || []);
			} else {
				toast.error(
					"Не вдалося завантажити дані. Можливо, у вас недостатньо прав.",
				);
			}
		} catch (err) {
			toast.error("Помилка сервера при отриманні списку новин");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchAdminNews();
	}, []);

	const handleTogglePromote = async (
		newsId: string,
		currentStatus: boolean,
	) => {
		setIsActionLoading(newsId);
		try {
			const token = localStorage.getItem("token");

			const response = await fetch(`/api/news/${newsId}/promote`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ isPromoted: !currentStatus }),
			});

			if (response.ok) {
				toast.success(
					!currentStatus
						? "Публікацію успішно активовано та піднято в топ!"
						: "Промо-статус публікації вимкнено",
				);
				await fetchAdminNews();
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Помилка оновлення статусу");
			}
		} catch (err) {
			toast.error("Помилка сервера при зміні статусу");
		} finally {
			setIsActionLoading(null);
		}
	};
	if (isLoading && news.length === 0) {
		return (
			<div className="text-center py-12 text-xs text-slate-400 animate-pulse">
				Завантаження панелі адміна...
			</div>
		);
	}
	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-xs">
			<div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md">
				<ShieldAlert className="text-amber-400" size={20} />
				<div>
					<h1 className="text-sm font-black tracking-tight">
						Панель модерації новин та акцій (SUPERADMIN)
					</h1>
					<p className="text-slate-400 text-[11px]">
						Керування активацією комерційних пропозицій після перевірки оплати
						закладу.
					</p>
				</div>
			</div>
			<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
						<Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
					</div>
				)}

				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
							<th className="p-3">Заклад</th>
							<th className="p-3">Категорія</th>
							<th className="p-3">Заголовок</th>
							<th className="p-3">Статус оплати</th>
							<th className="p-3 text-right">Дія</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 font-medium text-slate-700">
						{news.map((item) => (
							<tr
								key={item.id}
								className="hover:bg-slate-50/80 transition-colors"
							>
								<td className="p-3">
									<div className="font-bold text-slate-800">
										{item.venue?.name}
									</div>
									<div className="text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
										{item.venue?.address}
									</div>
								</td>
								<td className="p-3">
									<span
										className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
											item.category === "GENERAL"
												? "bg-slate-100 text-slate-600"
												: item.category === "PROMOTION"
													? "bg-amber-50 text-amber-600"
													: "bg-indigo-50 text-indigo-600"
										}`}
									>
										{item.category === "GENERAL" ? (
											<Info size={10} />
										) : item.category === "PROMOTION" ? (
											<Tag size={10} />
										) : (
											<Ticket size={10} />
										)}
										{item.category === "GENERAL"
											? "Новина"
											: item.category === "PROMOTION"
												? "Акція"
												: "Подія"}
									</span>
								</td>
								<td className="p-3 font-semibold text-slate-800 truncate max-w-[220px]">
									{item.title}
								</td>
								<td className="p-3">
									{item.isPromoted ? (
										<span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 w-fit">
											<Check size={11} /> Оплачено / Активно
										</span>
									) : (
										<span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 w-fit">
											<X size={11} /> Очікує оплати
										</span>
									)}
								</td>
								<td className="p-3 text-right">
									<Button
										disabled={isActionLoading === item.id}
										onClick={() =>
											handleTogglePromote(item.id, item.isPromoted)
										}
										className={`h-7 px-3 rounded-lg text-[11px] font-bold transition shadow-sm inline-flex items-center gap-1 ${
											item.isPromoted
												? "bg-rose-500 hover:bg-rose-600 text-white"
												: "bg-emerald-600 hover:bg-emerald-700 text-white"
										}`}
									>
										{isActionLoading === item.id && (
											<Loader2 size={10} className="animate-spin" />
										)}
										{item.isPromoted ? "Вимкнути" : "Активувати"}
									</Button>
								</td>
							</tr>
						))}
						{news.length === 0 && (
							<tr>
								<td
									colSpan={5}
									className="p-8 text-center text-slate-400 italic"
								>
									Немає жодної новини чи акції для модерації.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
