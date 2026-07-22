"use client";

import React, { SyntheticEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createVenueSchema } from "@/src/lib/validations";
import { ImageIcon, X, Loader2, ArrowLeft } from "lucide-react";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { toast } from "sonner";
import { formatUkrainianPhoneNumber } from "@/src/helpers/formatPhone";
import { getAuthToken } from "@/src/helpers/auth";

export default function EditVenuePage() {
	const router = useRouter();
	const params = useParams();
	const venueId = params.id as string;
	const [formData, setFormData] = useState<any>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		const fetchVenueData = async () => {
			try {
				const token = getAuthToken();
				const response = await fetch(`/api/venues/${venueId}`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
					credentials: "include",
				});

				if (!response.ok) throw new Error("Не вдалося завантажити дані");

				const data = await response.json();
				const venue = data.venue;

				setFormData({
					name: venue.name || "",
					type: venue.type || "RESTAURANT",
					address: venue.address || "",
					// Форматуємо збережений номер у стабільну маску +380 (XX) XXX-XX-XX
					phone: formatUkrainianPhoneNumber(venue.phone || ""),
					averageCheck: venue.averageCheck || 0,
					workingHours: venue.workingHours || "",
					hasWifi: venue.hasWifi || false,
					hasParking: venue.hasParking || false,
					hasMusic: venue.hasLiveMusic ?? venue.hasMusic ?? false,
					mainImage: venue.mainImage || "",
					images: venue.images || [],
					tags: venue.tags ? venue.tags.map((t: any) => t.name).join(", ") : "",
					latitude: venue.latitude || 46.4825,
					longitude: venue.longitude || 30.7233,
				});
			} catch (error) {
				console.error(error);
				toast.error("Помилка завантаження");
			} finally {
				setIsLoading(false);
			}
		};

		if (venueId) void fetchVenueData();
	}, [venueId]);

	const handleMainImageChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file);
			if (uploadedUrl) {
				setFormData((prev: any) => ({
					...prev,
					mainImage: uploadedUrl,
				}));
				toast.success("Головне фото успішно оновлено");
			} else {
				const input = document.getElementById(e.target.id) as HTMLInputElement;
				if (input) input.value = "";
			}
		} catch (error: any) {
			console.error("Помилка головного фото:", error);
			toast.error("Не вдалося завантажити головне фото");
		} finally {
			setIsUploading(false);
		}
	};

	const handleGalleryImagesChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		try {
			const uploadedUrls: string[] = [];
			for (const file of Array.from(files)) {
				const finalFileUrl = await uploadFileToS3(file);
				if (finalFileUrl) {
					uploadedUrls.push(finalFileUrl);
				}
			}

			if (uploadedUrls.length > 0) {
				setFormData((prev: any) => ({
					...prev,
					images: [...(prev.images || []), ...uploadedUrls],
				}));
				toast.success(
					`Успішно додано фото до галереї: ${uploadedUrls.length} шт.`,
				);
			}
		} catch (error) {
			console.error("Помилка галереї:", error);
			toast.error("Помилка при завантаженні файлів галереї");
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemoveGalleryImage = (indexToRemove: number) => {
		setFormData((prev: any) => ({
			...prev,
			images: prev.images.filter(
				(_: any, index: number) => index !== indexToRemove,
			),
		}));
	};

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		const formattedPhone = formatUkrainianPhoneNumber(formData.phone || "");

		const finalData = {
			...formData,
			phone: formattedPhone,
			averageCheck: Number(formData.averageCheck) || 0,
			hasLiveMusic: Boolean(formData.hasMusic),
			tags: formData.tags || "",
		};

		const result = createVenueSchema.safeParse(finalData);
		if (!result.success) {
			console.error("❌ Zod Errors:", result.error.format());
			const firstError = result.error.issues[0];
			toast.error(`Помилка в полі [${firstError.path.join(".")}]: ${firstError.message}`);
			return;
		}

		setIsSaving(true);
		try {
			const token = getAuthToken();

			const cleanDigits = formattedPhone.replace(/\D/g, "");
			const payloadToSend = {
				...finalData,
				phone: `+${cleanDigits}`,
			};

			const response = await fetch(`/api/venues/${venueId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
				body: JSON.stringify(payloadToSend),
			});

			if (!response.ok) throw new Error("Помилка при збереженні");

			toast.success("Дані закладу оновлено!");
			router.push("/manager/dashboard");
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
				<Loader2 size={18} className="animate-spin text-slate-400" />
				<span className="uppercase tracking-wider text-[10px]">
                Завантаження даних закладу...
             </span>
			</div>
		);
	}

	if (!formData) {
		return (
			<div className="p-8 text-center text-xs font-bold text-slate-400 uppercase">
				Заклад не знайдено
			</div>
		);
	}

	return (
		<div className="max-w-xl mx-auto p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-medium text-slate-900">
			<div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-5">
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => router.push("/manager/dashboard")}
					className="h-8 w-8 rounded-xl border-slate-200"
				>
					<ArrowLeft size={14} />
				</Button>
				<div>
					<h1 className="text-base font-bold tracking-tight text-slate-900">
						Редагування закладу
					</h1>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Внесіть зміни у картку вашої інфраструктури
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Назва закладу *
					</label>
					<Input
						value={formData.name || ""}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						required
						className="h-10 text-xs font-semibold rounded-xl border-slate-200"
					/>
				</div>

				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Адреса *
					</label>
					<Input
						value={formData.address || ""}
						onChange={(e) =>
							setFormData({ ...formData, address: e.target.value })
						}
						required
						className="h-10 text-xs font-semibold rounded-xl border-slate-200"
					/>
				</div>

				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Номер телефону *
					</label>
					<Input
						type="tel"
						placeholder="+380 (XX) XXX-XX-XX"
						value={formData.phone || ""}
						onChange={(e) => {
							const formatted = formatUkrainianPhoneNumber(e.target.value);
							if (formatted.length <= 19) {
								setFormData((prev: any) => ({ ...prev, phone: formatted }));
							}
						}}
						className="h-10 text-xs font-semibold rounded-xl border-slate-200"
						required
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600">
							Середній чек (грн) *
						</label>
						<Input
							type="number"
							value={formData.averageCheck || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									averageCheck: Number(e.target.value),
								})
							}
							required
							className="h-10 text-xs font-semibold rounded-xl border-slate-200"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-600">
							Часи роботи *
						</label>
						<Input
							value={formData.workingHours || ""}
							onChange={(e) =>
								setFormData({ ...formData, workingHours: e.target.value })
							}
							placeholder="Наприклад: 10:00 - 22:00"
							required
							className="h-10 text-xs font-semibold rounded-xl border-slate-200"
						/>
					</div>
				</div>

				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Теги (через кому) *
					</label>
					<Input
						value={formData.tags || ""}
						onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
						placeholder="кальян, тераса, жива музика"
						className="h-10 text-xs font-semibold rounded-xl border-slate-200"
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 p-4 rounded-2xl bg-slate-50/50 mt-4">
					<div className="space-y-1.5">
						<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
							<ImageIcon size={14} /> Головне фото *
						</label>
						<Input
							type="file"
							accept="image/*"
							onChange={handleMainImageChange}
							disabled={isUploading}
							className="text-xs rounded-xl bg-white file:font-bold"
						/>

						{formData.mainImage && (
							<div className="relative h-20 w-28 rounded-xl overflow-hidden border border-slate-200 mt-2 group shadow-sm">
								<img
									src={formData.mainImage}
									alt="Main Preview"
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() =>
										setFormData((prev: any) => ({ ...prev, mainImage: "" }))
									}
									className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<X size={16} className="text-white" />
								</button>
							</div>
						)}
					</div>

					<div className="space-y-1.5">
						<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
							<ImageIcon size={14} /> Галерея (поточні + нові)
						</label>
						<Input
							type="file"
							accept="image/*"
							multiple
							onChange={handleGalleryImagesChange}
							disabled={isUploading}
							className="text-xs rounded-xl bg-white file:font-bold"
						/>

						<div className="flex gap-1.5 mt-2 max-h-24 overflow-x-auto p-1.5 border border-dashed border-slate-200 rounded-xl bg-white">
							{!formData.images || formData.images.length === 0 ? (
								<p className="text-[10px] text-slate-400 italic p-2 w-full text-center font-semibold">
									Галерея порожня
								</p>
							) : (
								formData.images.map((url: string, index: number) => (
									<div
										key={index}
										className="relative h-12 w-16 rounded-lg border overflow-hidden shrink-0 group cursor-pointer shadow-sm border-slate-100"
									>
										<img
											src={url}
											alt="Gallery Preview"
											className="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => handleRemoveGalleryImage(index)}
											className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
										>
											<X size={12} className="text-white" />
										</button>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3 pt-3 border-t border-slate-100">
					<Button
						type="button"
						variant="outline"
						className="w-1/2 h-10 font-bold rounded-xl border-slate-200 hover:bg-slate-50"
						onClick={() => router.push("/manager/dashboard")}
					>
						Скасувати
					</Button>
					<Button
						type="submit"
						className="w-1/2 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
						disabled={isSaving || isUploading}
					>
						{isSaving ? "Збереження..." : "Зберегти зміни"}
					</Button>
				</div>
			</form>
		</div>
	);
}