"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import {
	PlusCircle,
	FolderPlus,
	Link as LinkIcon,
	CheckCircle2,
	ListFilter,
	Eye,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VenueOption } from "@/src/interfaces/venue";
import { CategoryOption } from "@/src/interfaces/category";
import { getAuthToken } from "@/src/helpers/auth";

export default function CategoryManager() {
	const router = useRouter();
	const [catName, setCatName] = useState("");
	const [catDesc, setCatDesc] = useState("");
	const [isCreatingCat, setIsCreatingCat] = useState(false);
	const [venues, setVenues] = useState<VenueOption[]>([]);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [selectedVenueId, setSelectedVenueId] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState("");
	const [isLinking, setIsLinking] = useState(false);

	const loadData = async () => {
		try {
			const resVenues = await fetch("/api/venues");
			if (resVenues.ok) {
				const data = await resVenues.json();
				const list = data.venues || data || [];
				setVenues(list);
				if (list.length > 0 && !selectedVenueId) setSelectedVenueId(list[0].id);
			}

			const resCategories = await fetch("/api/categories");
			if (resCategories.ok) {
				const data = await resCategories.json();
				const list = data.categories || data || [];
				setCategories(list);
				if (list.length > 0 && !selectedCategoryId)
					setSelectedCategoryId(list[0].id);
			}
		} catch (error) {
			console.error("Помилка при завантаженні даних:", error);
			toast.error("Помилка сервера при завантаженні списків");
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	const handleCreateCategory = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!catName.trim()) return;

		setIsCreatingCat(true);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/admin/categories", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name: catName, description: catDesc }),
			});

			const data = await response.json();
			if (!response.ok) new Error(data.message || "Помилка при створенні");
			toast.success(`Категорію "${data.category.name}" успішно створено!`);
			setCatName("");
			setCatDesc("");
			await loadData();
			setSelectedCategoryId(data.category.id);
		} catch (error: any) {
			toast.error(error.message || "Не вдалося створити категорію");
		} finally {
			setIsCreatingCat(false);
		}
	};
	const handleLinkVenue = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!selectedVenueId || !selectedCategoryId) {
			toast.warning("Будь ласка, виберіть заклад та категорію");
			return;
		}
		setIsLinking(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/admin/categories`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					categoryId: selectedCategoryId,
					venueId: selectedVenueId,
				}),
			});
			const data = await response.json();
			if (!response.ok) new Error(data.message || "Помилка при прив'язці");
			toast.success("Заклад успішно додано до підбірки!");
			await loadData();
		} catch (error: any) {
			toast.error(error.message || "Цей заклад вже є в цій категорії");
		} finally {
			setIsLinking(false);
		}
	};
	return (
		<div className="space-y-6 text-xs font-medium">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
					<h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
						<FolderPlus size={15} className="text-amber-500" /> Створити нову
						категорію (підбірку)
					</h3>
					<form onSubmit={handleCreateCategory} className="space-y-3">
						<div className="space-y-1">
							<label className="text-[11px] font-bold text-slate-500">
								Назва категорії *
							</label>
							<Input
								className="text-xs h-9"
								value={catName}
								onChange={(e) => setCatName(e.target.value)}
								placeholder="Наприклад: Топ кальянів 2026"
								required
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-bold text-slate-500">
								Опис (необов'язково)
							</label>
							<Input
								className="text-xs h-9"
								value={catDesc}
								onChange={(e) => setCatDesc(e.target.value)}
								placeholder="Кращі заклади за версією платформи"
							/>
						</div>
						<Button
							type="submit"
							className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs font-bold h-9"
							disabled={isCreatingCat}
						>
							{isCreatingCat ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<PlusCircle size={14} />
							)}
							{isCreatingCat ? "Створення..." : "Створити категорію"}
						</Button>
					</form>
				</div>
				<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
					<h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
						<LinkIcon size={15} className="text-amber-500" /> Додати заклад до
						категорії
					</h3>
					<form onSubmit={handleLinkVenue} className="space-y-3">
						<div className="space-y-1">
							<label className="text-[11px] font-bold text-slate-500">
								Виберіть категорію *
							</label>
							<select
								value={selectedCategoryId}
								onChange={(e) => setSelectedCategoryId(e.target.value)}
								className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg block w-full p-2 h-9 outline-none font-semibold"
							>
								{categories.length === 0 ? (
									<option>Немає доступних категорій</option>
								) : (
									categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))
								)}
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-[11px] font-bold text-slate-500">
								Виберіть заклад *
							</label>
							<select
								value={selectedVenueId}
								onChange={(e) => setSelectedVenueId(e.target.value)}
								className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg block w-full p-2 h-9 outline-none font-semibold"
							>
								{venues.length === 0 ? (
									<option>Немає доступних закладів</option>
								) : (
									venues.map((v) => (
										<option key={v.id} value={v.id}>
											{v.name}
										</option>
									))
								)}
							</select>
						</div>
						<Button
							type="submit"
							className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 text-xs h-9"
							disabled={
								isLinking || venues.length === 0 || categories.length === 0
							}
						>
							{isLinking ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<CheckCircle2 size={14} />
							)}
							{isLinking ? "Зв'язування..." : "Прив'язати заклад"}
						</Button>
					</form>
				</div>
			</div>
			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
				<div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
					<ListFilter size={15} className="text-slate-400" />
					<h3 className="text-xs font-bold text-slate-800">
						Існуючі підбірки на платформі
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
								<th className="py-2.5 px-4">Назва підбірки</th>
								<th className="py-2.5 px-4">Опис</th>
								<th className="py-2.5 px-4 text-center">Закладів у підбірці</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 font-medium">
							{categories.length === 0 ? (
								<tr>
									<td
										colSpan={3}
										className="text-center py-8 text-slate-400 italic text-xs"
									>
										Підбірок ще не створено
									</td>
								</tr>
							) : (
								categories.map((cat) => (
									<tr
										key={cat.id}
										className="hover:bg-slate-50/80 transition-colors"
									>
										<td className="py-2.5 px-4 font-bold text-slate-900">
											{cat.name}
										</td>
										<td className="py-2.5 px-4 text-slate-500 max-w-xs truncate font-normal">
											{cat.description || (
												<span className="text-slate-300 italic">
													Немає опису
												</span>
											)}
										</td>
										<td className="py-2.5 px-4 text-center">
											<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
												{cat.venues?.length ?? 0}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<ListFilter size={16} className="text-amber-500" />
						<h3 className="text-xs font-bold text-slate-800">
							Прев'ю підборок на сайті
						</h3>
					</div>
					<span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
						🛡️ Відображаються перші 4 заклади підбірки
					</span>
				</div>
				{categories.length === 0 ? (
					<p className="text-xs text-slate-400 italic">
						Створіть категорію, щоб побачити прев'ю
					</p>
				) : (
					<div className="space-y-5">
						{categories.map((cat: any) => (
							<div
								key={cat.id}
								className="border border-slate-100 rounded-xl p-4 bg-slate-50/50"
							>
								<div className="flex justify-between items-start gap-4 mb-3">
									<div>
										<h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
											{cat.name}
										</h4>
										{cat.description && (
											<p className="text-[11px] text-slate-500 mt-0.5 pl-3.5 font-normal">
												{cat.description}
											</p>
										)}
									</div>

									{cat.venues && cat.venues.length > 0 && (
										<Button
											size="sm"
											variant="outline"
											className="h-6 text-[10px] px-2 font-bold shrink-0 rounded-md"
											onClick={() => router.push(`/categories/${cat.id}`)}
										>
											<Eye size={11} className="mr-1" />
											Дивитись все
										</Button>
									)}
								</div>

								{!cat.venues || cat.venues.length === 0 ? (
									<p className="text-xs text-slate-400 italic pl-3.5 font-normal">
										У цій підбірці ще немає закладів. Прив'яжіть їх за допомогою
										форми вище.
									</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pl-3.5">
										{cat.venues.map((item: any) => {
											const venue = item.venue;
											if (!venue) return null;
											return (
												<div
													key={venue.id}
													className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between font-medium"
												>
													<div>
														<h5 className="font-bold text-xs text-slate-900 truncate">
															{venue.name}
														</h5>
														<p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
															{venue.address || "Адресу не вказано"}
														</p>
													</div>
													<div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
														<span className="bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100">
															⭐ {(venue.rating || 0).toFixed(1)}
														</span>
														<span className="text-slate-400 font-normal">
															ID: {venue.id.substring(0, 5)}...
														</span>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
