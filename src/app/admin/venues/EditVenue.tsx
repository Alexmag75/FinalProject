"use client";

import React, { SyntheticEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PatternFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createVenueSchema } from "@/src/lib/validations";
import { ImageIcon, X, Tag, Check, ArrowLeft, Loader2 } from "lucide-react";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { toast } from "sonner";
import { getAuthToken } from "@/src/helpers/auth";

export default function EditVenue() {
	const router = useRouter();
	const params = useParams();
	const venueId = params.id as string;

	const [formData, setFormData] = useState<any>({
		name: "",
		address: "",
		phone: "",
		averageCheck: 0,
		workingHours: "",
		hasWifi: false,
		hasParking: false,
		hasMusic: false,
		mainImage: "",
		images: [],
	});

	const [availableTags, setAvailableTags] = useState<string[]>([
		"кальян",
		"тераса",
		"коктейлі",
		"жива музика",
		"настільні ігри",
		"караоке",
		"веган меню",
		"крафтове пиво",
	]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [customTagInput, setCustomTagInput] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const token = getAuthToken();
				try {
					const tagsRes = await fetch("/api/tags");
					if (tagsRes.ok) {
						const tagsData = await tagsRes.json();
						if (tagsData && tagsData.length > 0) {
							setAvailableTags(tagsData.map((t: any) => t.name));
						}
					}
				} catch (err) {
					console.error("Не вдалося завантажити теги з бази даних", err);
				}
				const response = await fetch(`/api/venues/${venueId}`, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					credentials: "include",
				});

				if (!response.ok) new Error("Не вдалося завантажити дані закладу");
				const data = await response.json();
				const venue = data.venue;
				const formatRawPhone = (rawPhone: string) => {
					if (!rawPhone) return "";
					const digits = rawPhone.replace(/\D/g, "");
					if (digits.length === 12 && digits.startsWith("380")) {
						return `+38 (0${digits.substring(3, 5)}) ${digits.substring(5, 8)}-${digits.substring(8, 10)}-${digits.substring(10, 12)}`;
					}
					return rawPhone;
				};

				setFormData({
					name: venue.name,
					address: venue.address,
					phone: formatRawPhone(venue.phone || ""),
					averageCheck: venue.averageCheck,
					workingHours: venue.workingHours,
					hasWifi: venue.hasWifi || false,
					hasParking: venue.hasParking || false,
					hasMusic: venue.hasMusic || false,
					mainImage: venue.mainImage,
					images: venue.images || [],
				});

				if (venue.tags) {
					const venueTagNames = venue.tags.map((t: any) =>
						t.name.toLowerCase(),
					);
					setSelectedTags(venueTagNames);
					setAvailableTags((prev) => {
						const uniqueNewTags = venueTagNames.filter(
							(t: string) => !prev.includes(t),
						);
						return [...prev, ...uniqueNewTags];
					});
				}
			} catch (error) {
				console.error(error);
				toast.error("Помилка при завантаженні закладу");
				router.push("/admin/dashboard");
			} finally {
				setIsLoading(false);
			}
		};

		if (venueId) void fetchInitialData();
	}, [venueId, router]);

	const toggleTag = (tag: string) => {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const handleAddCustomTag = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && customTagInput.trim()) {
			e.preventDefault();
			const newTag = customTagInput.trim().toLowerCase();
			if (!selectedTags.includes(newTag)) {
				setSelectedTags([...selectedTags, newTag]);
			}
			if (!availableTags.includes(newTag)) {
				setAvailableTags([...availableTags, newTag]);
			}
			setCustomTagInput("");
		}
	};

	const handleMainImageChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file);
			if (uploadedUrl) {
				setFormData((prev: any) => ({ ...prev, mainImage: uploadedUrl }));
				toast.success("Головне фото оновлено!");
			} else {
				const input = document.getElementById(e.target.id) as HTMLInputElement;
				if (input) input.value = "";
			}
		} catch (error: any) {
			console.error("Помилка при обробці головного фото:", error);
			toast.error("Не вдалося завантажити нове фото");
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
				if (finalFileUrl) uploadedUrls.push(finalFileUrl);
			}

			if (uploadedUrls.length > 0) {
				setFormData((prev: any) => ({
					...prev,
					images: [...(prev.images || []), ...uploadedUrls],
				}));
				toast.success(`Додано фото до галереї: ${uploadedUrls.length} шт.`);
			}
		} catch (error) {
			toast.error("Помилка при завантаженні файлів до галереї");
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

		if (formData.phone.includes("_") || !formData.phone) {
			toast.warning("Будь ласка, введіть номер телефону повністю");
			return;
		}

		if (!formData.mainImage) {
			toast.warning("Головне фото закладу є обов’язковим!");
			return;
		}

		const dataToSave = {
			...formData,
			phone: formData.phone.trim(),
			tags: selectedTags.join(", "),
		};

		const result = createVenueSchema.safeParse(dataToSave);
		if (!result.success) {
			toast.error(`Помилка валідації: ${result.error.issues[0].message}`);
			return;
		}

		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/venues/${venueId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
				body: JSON.stringify(dataToSave),
			});
			const data = await response.json();
			if (!response.ok) {
				new Error(data.message || "Помилка при оновленні");
			}
			toast.success("Дані закладу успішно оновлено!");
			router.push("/admin/dashboard");
			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти зміни");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="p-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				<span>Завантаження даних закладу...</span>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-xs font-medium">
			<div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => router.push("/admin/dashboard")}
					className="h-8 w-8 text-slate-500 hover:text-slate-700 rounded-lg"
				>
					<ArrowLeft size={16} />
				</Button>
				<div>
					<h1 className="text-sm font-bold text-slate-900">
						Редагування закладу (Адмін-панель)
					</h1>
					<p className="text-[11px] text-slate-400 mt-0.5">
						Повне керування інформацією, медіафайлами та мітками закладу.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-1">
						<label className="font-bold text-slate-500">Назва закладу *</label>
						<Input
							className="text-xs h-9"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="font-bold text-slate-500">Адреса *</label>
						<Input
							className="text-xs h-9"
							value={formData.address}
							onChange={(e) =>
								setFormData({ ...formData, address: e.target.value })
							}
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="font-bold text-slate-500">
							Номер телефону закладу *
						</label>
						<PatternFormat
							format="+38 (0##) ###-##-##"
							allowEmptyFormatting={false}
							mask="_"
							value={formData.phone}
							onValueChange={(values) => {
								setFormData((prev: any) => ({
									...prev,
									phone: values.formattedValue,
								}));
							}}
							customInput={Input}
							type="tel"
							className="text-xs h-9"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="font-bold text-slate-500">
							Середній чек (грн) *
						</label>
						<Input
							className="text-xs h-9"
							type="number"
							value={formData.averageCheck || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									averageCheck: Number(e.target.value),
								})
							}
							required
						/>
					</div>

					<div className="space-y-1 md:col-span-2">
						<label className="font-bold text-slate-500">Часи роботи *</label>
						<Input
							className="text-xs h-9"
							value={formData.workingHours}
							onChange={(e) =>
								setFormData({ ...formData, workingHours: e.target.value })
							}
							placeholder="Наприклад: 09:00 - 22:00"
							required
						/>
					</div>
				</div>

				<div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
					<label className="font-bold text-slate-500 flex items-center gap-1.5">
						<Tag size={13} className="text-slate-400" /> Теги закладу (оберіть
						кліком):
					</label>
					<div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
						{availableTags.map((tag) => {
							const isSelected = selectedTags.includes(tag);
							return (
								<button
									key={tag}
									type="button"
									onClick={() => toggleTag(tag)}
									className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all flex items-center gap-1 ${
										isSelected
											? "bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-sm"
											: "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
									}`}
								>
									{isSelected && <Check size={10} />}
									{tag}
								</button>
							);
						})}
					</div>
					<div className="pt-1">
						<Input
							value={customTagInput}
							onChange={(e) => setCustomTagInput(e.target.value)}
							onKeyDown={handleAddCustomTag}
							placeholder="Введіть новий тег та натисніть Enter..."
							className="h-8 text-xs bg-white"
						/>
					</div>
				</div>

				<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap gap-5 justify-center">
					{[
						{ key: "hasWifi", label: "Є Wi-Fi" },
						{ key: "hasParking", label: "Власна парковка" },
						{ key: "hasMusic", label: "Жива музика / DJ" },
					].map((item) => (
						<label
							key={item.key}
							className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-semibold"
						>
							<input
								type="checkbox"
								checked={!!formData[item.key]}
								onChange={(e) =>
									setFormData({ ...formData, [item.key]: e.target.checked })
								}
								className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
							/>
							{item.label}
						</label>
					))}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
					<div className="space-y-1.5">
						<label className="font-bold text-slate-500 flex items-center gap-1.5">
							<ImageIcon size={13} className="text-slate-400" /> Головне фото *
						</label>
						<Input
							type="file"
							accept="image/*"
							onChange={handleMainImageChange}
							disabled={isUploading}
							className="text-xs file:text-[11px] file:font-semibold bg-white cursor-pointer"
						/>
						{formData.mainImage && (
							<div className="relative h-16 w-24 rounded-lg overflow-hidden border border-slate-200 mt-2 group">
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
									className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<X size={14} className="text-white" />
								</button>
							</div>
						)}
					</div>

					<div className="space-y-1.5">
						<label className="font-bold text-slate-500 flex items-center gap-1.5">
							<ImageIcon size={13} className="text-slate-400" /> Галерея
							(поточні + нові)
						</label>
						<Input
							type="file"
							accept="image/*"
							multiple
							onChange={handleGalleryImagesChange}
							disabled={isUploading}
							className="text-xs file:text-[11px] file:font-semibold bg-white cursor-pointer"
						/>
						<div className="flex flex-wrap gap-1.5 mt-2 max-h-16 overflow-y-auto p-1 bg-white border rounded-lg">
							{!formData.images || formData.images.length === 0 ? (
								<p className="text-[11px] text-slate-400 italic p-1.5 w-full text-center">
									Галерея порожня
								</p>
							) : (
								formData.images.map((url: string, index: number) => (
									<div
										key={index}
										className="relative h-8 w-12 rounded border overflow-hidden group"
									>
										<img
											src={url}
											alt="Gallery Preview"
											className="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => handleRemoveGalleryImage(index)}
											className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X size={12} className="text-white" />
										</button>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3 pt-1">
					<Button
						type="button"
						variant="outline"
						className="w-1/2 h-9 border-slate-200 text-xs font-bold rounded-lg"
						onClick={() => router.push("/admin/dashboard")}
					>
						Скасувати
					</Button>
					<Button
						type="submit"
						className="w-1/2 h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm rounded-lg"
						disabled={isSaving || isUploading}
					>
						{isSaving && <Loader2 size={14} className="animate-spin" />}
						{isSaving ? "Збереження..." : "Зберегти зміни"}
					</Button>
				</div>
			</form>
		</div>
	);
}
