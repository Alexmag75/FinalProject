"use client";

import React, { useState, useEffect, use, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { toast } from "sonner";
import { getAuthToken } from "@/src/helpers/auth";

export default function EditNewsPage({
	params,
}: {
	params: Promise<{ id: string; newsId: string }>;
}) {
	const { id: venueId, newsId } = use(params);
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState("GENERAL");
	const [image, setImage] = useState("");
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchCurrentNews = async () => {
			try {
				const token = getAuthToken();
				const res = await fetch(`/api/venues/${venueId}/news`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) new Error("Помилка при завантаженні даних");
				const data = await res.json();
				const currentNews = data.news?.find((item: any) => item.id === newsId);

				if (currentNews) {
					setTitle(currentNews.title);
					setContent(currentNews.content);
					setCategory(currentNews.category);
					setImage(currentNews.image || "");
				} else {
					toast.error("Новину не знайдено");
					router.push(`/manager/venues/${venueId}/news`);
				}
			} catch (error) {
				console.error(error);
				toast.error("Не вдалося завантажити дані новини");
			} finally {
				setIsLoadingData(false);
			}
		};

		void fetchCurrentNews();
	}, [venueId, newsId, router]);

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file, "news");

			if (uploadedUrl) {
				setImage(uploadedUrl);
				toast.success("Обкладинку новини успішно оновлено");
			} else {
				setImage("");
				const input = document.getElementById(e.target.id) as HTMLInputElement;
				if (input) input.value = "";
			}
		} catch (error: any) {
			console.error("Детали ошибки S3:", error);
			toast.error("Не вдалося завантажити фото на сервер");
			setImage("");
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		if (!title.trim() || !content.trim()) {
			toast.error("Будь ласка, заповніть всі обов’язкові поля *");
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

			if (!response.ok) new Error("Помилка при оновленні на сервері");

			toast.success("Новину успішно оновлено!");
			router.push(`/manager/venues/${venueId}/news`);
			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти зміни");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoadingData) {
		return (
			<div className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
				<Loader2 size={18} className="animate-spin text-slate-400" />
				<span className="uppercase tracking-wider text-[10px]">
					Завантаження даних новини...
				</span>
			</div>
		);
	}

	return (
		<div className="container max-w-xl mx-auto p-6 space-y-6 text-xs font-medium text-slate-900">
			<div className="flex items-center gap-3 border-b border-slate-200 pb-4">
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => router.push(`/manager/venues/${venueId}/news`)}
					className="h-8 w-8 rounded-xl border-slate-200"
				>
					<ArrowLeft size={14} />
				</Button>
				<div>
					<h1 className="text-base font-bold tracking-tight text-slate-900">
						Редагувати новину
					</h1>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Внесіть зміни у вашу публікацію для стрічки
					</p>
				</div>
			</div>

			<Card className="p-5 border-slate-200 rounded-2xl shadow-sm bg-white">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Категорія
						</label>
						<select
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-0 appearance-none cursor-pointer"
						>
							<option value="GENERAL">📢 Загальна новина</option>
							<option value="PROMOTION">🔥 Акція або Спецпропозиція</option>
							<option value="EVENT">🎉 Подія / Івент / Жива музика</option>
						</select>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Заголовок новини *
						</label>
						<input
							type="text"
							required
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={100}
							className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
							placeholder="Введіть короткий заголовок"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Текст новини *
						</label>
						<textarea
							required
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={5}
							className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold resize-none focus:outline-none"
							placeholder="Опишіть деталі події чи пропозиції..."
						/>
					</div>

					<div className="space-y-1.5 border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
						<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
							<ImageIcon size={14} /> Обкладинка новини
						</label>
						<input
							id="news-image-edit-input"
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							disabled={isUploading || isSaving}
							className="w-full text-xs text-slate-500 cursor-pointer font-semibold file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
						/>

						{image && (
							<div className="space-y-1 mt-2">
								<div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
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
												"news-image-edit-input",
											) as HTMLInputElement;
											if (input) input.value = "";
										}}
										className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<X size={18} className="text-white" />
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push(`/manager/venues/${venueId}/news`)}
							className="w-1/2 h-10 font-bold rounded-xl border-slate-200 hover:bg-slate-50"
						>
							Скасувати
						</Button>
						<Button
							type="submit"
							disabled={isSaving || isUploading}
							className="w-1/2 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
						>
							{isSaving && <Loader2 size={14} className="animate-spin" />}
							Зберегти зміни
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}
