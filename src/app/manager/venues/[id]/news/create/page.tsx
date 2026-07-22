"use client";

import React, { useState, use, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { toast } from "sonner";
import { getAuthToken } from "@/src/helpers/auth";

export default function CreateNewsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: venueId } = use(params);
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [category, setCategory] = useState("GENERAL");
	const [image, setImage] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file, "news");
			if (uploadedUrl) {
				setImage(uploadedUrl);
				toast.success("Обкладинку успішно завантажено на S3");
			} else {
				const input = document.getElementById(e.target.id) as HTMLInputElement;
				if (input) input.value = "";
			}
		} catch (error) {
			console.error(error);
			toast.error("Помилка при завантаженні зображення");
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		if (!title.trim() || !content.trim()) {
			toast.error("Будь ласка, заповніть заголовок та текст новини *");
			return;
		}

		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/venues/${venueId}/news`, {
				method: "POST",
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

			const data = await response.json();
			if (!response.ok) new Error(data.message || "Помилка при збереженні");

			toast.success("Новину успішно опубліковано!");
			router.push(`/manager/venues/${venueId}/news`);
			router.refresh();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Не вдалося опублікувати новину");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="container max-w-xl mx-auto p-6 space-y-6 text-xs font-medium text-slate-900">
			<div className="flex items-center gap-3 border-b border-slate-200 pb-4">
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => router.push(`/manager/venues/${venueId}/news`)}
					className="h-8 w-8 rounded-xl border-slate-200 shrink-0"
				>
					<ArrowLeft size={14} />
				</Button>
				<div>
					<h1 className="text-base font-bold tracking-tight text-slate-900">
						Створити новину
					</h1>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Додайте акцію, подію або оголошение для закладу
					</p>
				</div>
			</div>
			<Card className="p-5 border-slate-200 rounded-2xl shadow-sm bg-white space-y-4">
				<div>
					<h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
						Деталі публікації
					</h2>
					<p className="text-[11px] text-slate-400 font-semibold mt-0.5">
						Заповнена новина відразу з'явиться в стрічці застосунку.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Категорія публікації
						</label>
						<select
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
						>
							<option value="GENERAL">📢 Загальна новина</option>
							<option value="PROMOTION">🔥 Акція або Спецпропозиція</option>
							<option value="EVENT">🎉 Подія / Івент / Жива музика</option>
						</select>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Заголовок *
						</label>
						<input
							type="text"
							required
							placeholder="Наприклад: Жива музика цієї п'ятниці!"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={100}
							className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600 block">
							Текст новини / Опис акції *
						</label>
						<textarea
							required
							placeholder="Опишіть деталі події, меню акції або умови пропозиції..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={5}
							className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold resize-none focus:outline-none"
						/>
					</div>

					<div className="space-y-1.5 border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
						<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
							<ImageIcon size={14} /> Обкладинка новини (опціонально)
						</label>
						<input
							id="news-image-input"
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							disabled={isUploading || isSaving}
							className="w-full text-xs text-slate-500 cursor-pointer font-semibold file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
						/>

						{isUploading && (
							<div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-2">
								<Loader2 size={12} className="animate-spin" /> Завантаження на
								AWS S3...
							</div>
						)}

						{image && !isUploading && (
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
											const fileInput = document.getElementById(
												"news-image-input",
											) as HTMLInputElement;
											if (fileInput) fileInput.value = "";
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
							disabled={isSaving}
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
							Опублікувати новину
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}
