"use client";

import React, { useState, useEffect, use, SyntheticEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { NewsCategory } from "@/src/types/constants";
import { getAuthToken } from "@/src/helpers/auth";
import { BaseNews } from "@/src/interfaces/news";

export default function AdminEditNewsPage({
	params,
}: {
	params: Promise<{ newsId: string }>;
}) {
	const { newsId } = use(params);
	const router = useRouter();
	const searchParams = useSearchParams();
	const venueId = searchParams.get("venueId");
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState("GENERAL");
	const [image, setImage] = useState("");
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const goBack = () => {
		router.push("/admin/dashboard?tab=news-moderation");
	};

	useEffect(() => {
		if (!venueId) {
			toast.error("Не вказано ID закладу (venueId) в параметрах URL");
			goBack();
			return;
		}

		const fetchCurrentNews = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await fetch(`/api/venues/${venueId}/news`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) new Error("Помилка при завантаженні даних з сервера");
				const data = await res.json();
				const newsArray = Array.isArray(data) ? data : data.news || [];
				const currentNews = newsArray.find(
					(item: BaseNews) => item.id === newsId,
				);
				if (currentNews) {
					setTitle(currentNews.title);
					setContent(currentNews.content);
					setCategory(currentNews.category || NewsCategory.GENERAL);
					setImage(currentNews.image || "");
				} else {
					console.error(
						`Новость с ID ${newsId} не найдена в массиве:`,
						newsArray,
					);
					toast.error(`Новину не знайдено у даному закладі.`);
					goBack();
				}
			} catch (error) {
				console.error(error);
				toast.error("Не вдалося завантажити дані новини");
				goBack();
			} finally {
				setIsLoadingData(false);
			}
		};
		void fetchCurrentNews();
	}, [venueId, newsId]);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const token = localStorage.getItem("token");

			const res = await fetch("/api/upload", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type,
				}),
			});

			const data = await res.json();
			if (!res.ok || !data.uploadUrl) {
				new Error(
					data.message || "Не вдалося отримати посилання для завантаження",
				);
			}

			const awsResponse = await fetch(data.uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!awsResponse.ok) {
				new Error("Помилка при передачі файлу в сховище AWS S3");
			}

			setImage(data.fileUrl);
			toast.success("Зображення успішно завантажено!");
		} catch (error: any) {
			toast.error(error.message || "Не вдалося завантажити фото");
			setImage("");
			const input = document.getElementById(e.target.id) as HTMLInputElement;
			if (input) input.value = "";
		} finally {
			setIsUploading(false);
		}
	};
	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			toast.warning("Будь ласка, заповніть обов’язкові поля");
			return;
		}
		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/venues/${venueId}/news/${newsId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title,
					content,
					category,
					image: image || null,
				}),
			});
			if (!response.ok)
				new Error("Помилка при оновленні новини адміністратором");
			toast.success("Новину успішно оновлено адміністратором платформи!");
			goBack();
			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти зміни");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoadingData) {
		return (
			<div className="text-center py-20 text-muted-foreground animate-pulse text-xs">
				Завантаження даних новини для модерації...
			</div>
		);
	}

	return (
		<div className="container max-w-2xl mx-auto p-6 space-y-5 text-xs min-h-screen">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={goBack}
					className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
				>
					<ArrowLeft size={14} className="text-slate-600" />
				</button>
				<div>
					<h1 className="text-lg font-bold tracking-tight text-slate-900">
						Модерація: Редагувати новину
					</h1>
					<p className="text-xs text-slate-400">
						Примусове редагування публікації закладу як Адміністратор
					</p>
				</div>
			</div>

			<hr className="border-slate-100" />

			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="p-5">
					<form onSubmit={handleSubmit} className="space-y-4 font-medium">
						<div className="space-y-1.5">
							<label className="text-xs font-bold block text-slate-500">
								Категорія
							</label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:outline-none text-slate-700 font-semibold"
							>
								<option value="GENERAL">📢 Загальна новина</option>
								<option value="PROMOTION">🔥 Акція або Спецпропозиція</option>
								<option value="EVENT">🎉 Подія / Івент / Жива музика</option>
							</select>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-bold block text-slate-500">
								Заголовок *
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								maxLength={100}
								className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:border-amber-500 transition-all text-slate-800 font-bold"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-bold block text-slate-500">
								Текст новини *
							</label>
							<textarea
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={6}
								className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs resize-none focus:outline-none focus:border-amber-500 transition-all text-slate-600 font-normal leading-relaxed"
							/>
						</div>
						<div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
							<label className="text-xs font-bold flex items-center gap-2 text-slate-500">
								<ImageIcon size={14} className="text-slate-400" /> Обкладинка
								новини
							</label>
							<input
								id="admin-news-image-edit-input"
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								disabled={isUploading || isSaving}
								className="w-full text-xs text-slate-500 cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 transition"
							/>

							{image && (
								<div className="space-y-1 mt-2">
									<div className="relative h-32 w-full rounded-md overflow-hidden border border-slate-200 group">
										<img
											src={image}
											alt="News Preview"
											className="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setImage("");
												const input = document.getElementById(
													"admin-news-image-edit-input",
												) as HTMLInputElement;
												if (input) input.value = "";
											}}
											className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
										>
											<X size={18} className="text-white" />
										</button>
									</div>
								</div>
							)}
						</div>
						<div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
							<button
								type="button"
								onClick={goBack}
								className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
							>
								Скасувати
							</button>
							<button
								type="submit"
								disabled={isSaving || isUploading}
								className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
							>
								{isSaving ? (
									<Loader2 size={13} className="animate-spin" />
								) : null}
								Зберегти зміни
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
