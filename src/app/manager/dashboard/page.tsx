"use client";

import React, { useState, useEffect, SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Plus,
	Store,
	MapPin,
	Layers,
	Wallet,
	Clock,
	CheckCircle2,
	AlertCircle,
	Image,
	X,
	Trash2,
	Newspaper,
	Loader2,
	Check,
	Pencil,
	Wifi,
	Car,
	Music,
} from "lucide-react";
import { createVenueSchema } from "@/src/lib/validations";
import Link from "next/link";
import { Venue } from "@/src/interfaces/venue";
import { DBTag } from "@/src/interfaces/dbTag";
import { toast } from "sonner";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { getAuthToken } from "@/src/helpers/auth";
import { formatUkrainianPhoneNumber } from "@/src/helpers/formatPhone";
import {VENUE_STATUSES, VENUE_TYPES} from "@/src/types/constants";

const ManagerMap = dynamic(() => import("@/src/app/components/ManagerMap"), {
	ssr: false,
	loading: () => (
		<div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-xs font-semibold text-muted-foreground">
			Завантаження інтерактивної карти...
		</div>
	),
});

export default function ManagerDashboard() {
	const [venues, setVenues] = useState<Venue[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAdding, setIsAdding] = useState(false);
	const [isTagsOpen, setIsTagsOpen] = useState(false);
	const [allTags, setAllTags] = useState<DBTag[]>([]);
	const [galleryImages, setGalleryImages] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [formData, setFormData] = useState({
		name: "",
		type: "CAFE",
		mainImage: "",
		address: "",
		workingHours: "10:00 - 22:00",
		averageCheck: 300,
		description: "",
		phone: "",
		hasWifi: false,
		hasParking: false,
		hasLiveMusic: false,
		latitude: "",
		longitude: "",
	});

	const loadTags = async () => {
		try {
			const data = await apiFetch("/tags", { method: "GET" });
			setAllTags(data.tags || []);
		} catch (err) {
			console.error("Помилка завантаження тегів:", err);
		}
	};

	const loadVenues = async () => {
		setIsLoading(true);
		try {
			const data = await apiFetch("/venues?myOwn=true", { method: "GET" });
			setVenues(data.venues || []);
		} catch (err) {
			toast.error("Не вдалося оновити список закладів");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadVenues();
		void loadTags();
	}, []);

	const executeDeleteVenue = async (id: string, name: string) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/venues/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			let message = "Не вдалося видалити заклад";
			if (response.status !== 204) {
				const data = await response.json();
				message = data.message || message;
			}

			if (!response.ok) throw new Error(message);

			toast.success(`Заклад "${name}" успішно видалено!`);
			void loadVenues();
		} catch (error: any) {
			console.error("Помилка видалення:", error);
			toast.error(error.message || "Помилка при видаленні закладу");
		}
	};

	const handleDeleteClick = (id: string, name: string) => {
		toast(`Ви впевнені, що хочете видалити заклад "${name}"?`, {
			description:
				"Цю дію неможливо скасувати. Заклад та всі повʼязані дані зникнуть.",
			action: {
				label: "Видалити",
				onClick: () => executeDeleteVenue(id, name),
			},
			duration: 5000,
		});
	};

	const handleMainImageChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploadedUrl = await uploadFileToS3(file);
			setFormData((prev) => ({ ...prev, mainImage: uploadedUrl }));
			toast.success("Головне фото успішно підготовлено");
		} catch (err) {
			toast.error("Помилка завантаження головного фото");
		} finally {
			setIsUploading(false);
		}
	};

	const handleGalleryImagesChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		if (galleryImages.length + files.length > 10) {
			toast.error("Максимум 10 фотографій для галереї закладу.");
			return;
		}

		setIsUploading(true);
		try {
			const uploadedUrls: string[] = [];
			for (const file of files) {
				const url = await uploadFileToS3(file);
				uploadedUrls.push(url);
			}
			setGalleryImages((prev) => [...prev, ...uploadedUrls]);
			toast.success(`Завантажено фото до галереї: ${files.length} шт.`);
		} catch (err) {
			toast.error("Помилка завантаження деяких файлів галереї");
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemoveGalleryImage = (indexToRemove: number) => {
		setGalleryImages((prev) =>
			prev.filter((_, index) => index !== indexToRemove),
		);
	};

	const toggleTag = (tagName: string) => {
		if (selectedTags.includes(tagName)) {
			setSelectedTags(selectedTags.filter((t) => t !== tagName));
		} else {
			setSelectedTags([...selectedTags, tagName]);
		}
	};

	const handleCreateVenue = async (e: SyntheticEvent) => {
		e.preventDefault();

		const formattedPhone = formatUkrainianPhoneNumber(formData.phone);

		const dataToValidate = {
			...formData,
			phone: formattedPhone,
		};

		const result = createVenueSchema.safeParse(dataToValidate);

		if (!result.success) {
			const errorMessage = result.error.issues[0].message;
			toast.error(errorMessage);
			return;
		}

		try {
			const cleanDigits = formattedPhone.replace(/\D/g, "");

			const res = await apiFetch("/venues", {
				method: "POST",
				body: {
					...formData,
					phone: `+${cleanDigits}`,
					images: galleryImages,
					averageCheck: Number(formData.averageCheck),
					tags: selectedTags,
					latitude: formData.latitude ? parseFloat(formData.latitude) : null,
					longitude: formData.longitude ? parseFloat(formData.longitude) : null,
				},
			});

			toast.success(res.message || "Заклад успішно відправлено на модерацію!");

			setFormData({
				name: "",
				type: "CAFE",
				mainImage: "",
				address: "",
				workingHours: "10:00 - 22:00",
				averageCheck: 300,
				description: "",
				phone: "",
				hasWifi: false,
				hasParking: false,
				hasLiveMusic: false,
				latitude: "",
				longitude: "",
			});
			setGalleryImages([]);
			setSelectedTags([]);
			setIsAdding(false);
			void loadVenues();
		} catch (err: any) {
			toast.error(
				err.message ||
				"Не вдалося створити заклад. Перевірте обовʼязкові поля.",
			);
		}
	};

	const renderStatusBadge = (venue: Venue) => {
		const isApproved = venue.isApproved || venue.status === VENUE_STATUSES.APPROVED;
		const isRejected = venue.status === VENUE_STATUSES.REJECTED;

		if (isApproved) {
			return (
				<span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border flex items-center gap-1 shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 size={11} /> Опубліковано
             </span>
			);
		}

		if (isRejected) {
			return (
				<span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border flex items-center gap-1 shadow-sm bg-rose-50 text-rose-700 border-rose-200">
                <AlertCircle size={11} /> Відхилено
             </span>
			);
		}

		return (
			<span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border flex items-center gap-1 shadow-sm bg-amber-50 text-amber-700 border-amber-200">
             <AlertCircle size={11} /> На модерації
          </span>
		);
	};

	return (
		<div className="container mx-auto p-6 space-y-6 max-w-6xl text-xs font-medium">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 border-slate-200">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-slate-900">
						Панель керування менеджера
					</h1>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Додавайте заклади, керуйте інфраструктурою та перевіряйте статус
						модерації.
					</p>
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					<Button
						onClick={() => setIsAdding(!isAdding)}
						className="flex gap-1.5 h-9 rounded-xl font-bold text-xs"
					>
						<Plus size={14} /> {isAdding ? "Сховати форму" : "Додати заклад"}
					</Button>
				</div>
			</div>

			{isAdding && (
				<Card className="max-w-2xl border-slate-200 shadow-sm rounded-2xl animate-in fade-in-50 duration-200">
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-bold">Новий заклад</CardTitle>
						<CardDescription className="text-[11px]">
							Заповніть інформацію. Заклад буде відправлено на перевірку
							модераторам.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleCreateVenue} className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600">
										Назва закладу *
									</label>
									<Input
										required
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Наприклад: Бар Пʼятачок"
										className="h-10 text-xs font-semibold rounded-xl"
									/>
								</div>

								{/* Оновлений селект для типу закладу */}
								<div className="space-y-1">
									<label className="text-slate-500 font-bold">Тип закладу *</label>
									<select
										value={formData.type}
										onChange={(e) =>
											setFormData({ ...formData, type: e.target.value })
										}
										className="w-full text-xs h-9 px-3 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors text-slate-900"
										required
									>
										<option value="" disabled className="text-slate-400">
											Оберіть тип закладу...
										</option>
										{VENUE_TYPES.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<label
									htmlFor="description"
									className="text-sm font-medium text-gray-700"
								>
									Опис закладу
								</label>
								<textarea
									id="description"
									name="description"
									rows={5}
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Введіть детальний опис закладу (атмосфера, фірмові напої, правила...)"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-black resize-y"
								/>
								<p className="text-xs text-gray-400">
									Цей текст буде відображатися на детальній сторінці бару.
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600">
										Адреса *
									</label>
									<Input
										required
										value={formData.address}
										onChange={(e) =>
											setFormData({ ...formData, address: e.target.value })
										}
										placeholder="м. Болград, вул. Інзова, 10"
										className="h-10 text-xs font-semibold rounded-xl"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600">
										Години роботи *
									</label>
									<Input
										required
										value={formData.workingHours}
										onChange={(e) =>
											setFormData({ ...formData, workingHours: e.target.value })
										}
										placeholder="10:00 - 23:00"
										className="h-10 text-xs font-semibold rounded-xl"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600">
										Номер телефону *
									</label>
									<Input
										type="tel"
										placeholder="+380 (__) ___-__-__"
										value={formData.phone || ""}
										disabled={isUploading}
										onChange={(e) => {
											const formatted = formatUkrainianPhoneNumber(e.target.value);
											if (formatted.length <= 19) {
												setFormData((prev) => ({ ...prev, phone: formatted }));
											}
										}}
										className="h-10 text-xs font-semibold rounded-xl"
										required
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600">
										Середній чек (грн) *
									</label>
									<Input
										type="number"
										required
										value={
											formData.averageCheck === 0 ? "" : formData.averageCheck
										}
										onChange={(e) => {
											const val = e.target.value;
											setFormData({
												...formData,
												averageCheck: (val === "" ? "" : Number(val)) as any,
											});
										}}
										placeholder="300"
										className="h-10 text-xs font-semibold rounded-xl"
									/>
								</div>
								<div className="space-y-1 relative">
									<label className="text-[11px] font-bold text-slate-600 block">
										Теги закладу
									</label>
									<button
										type="button"
										onClick={() => setIsTagsOpen(!isTagsOpen)}
										className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold flex items-center justify-between text-left hover:border-slate-400 transition-colors"
									>
										{selectedTags.length === 0 ? (
											<span className="text-slate-400">Обрати теги...</span>
										) : (
											<span className="text-slate-900 truncate">
                                     Обрано тегів: {selectedTags.length}
                                  </span>
										)}
										<span className="text-slate-400 text-[10px]">
                                  {isTagsOpen ? "▲" : "▼"}
                               </span>
									</button>

									{isTagsOpen && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() => setIsTagsOpen(false)}
											/>
											<div className="absolute left-0 right-0 mt-1 p-4 bg-background border rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto border-slate-200">
												<div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                           Доступні теги
                                        </span>
												</div>
												<div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
													{allTags.map((tag) => {
														const tagName = typeof tag === "string" ? tag : tag.name;
														const isSelected = selectedTags.includes(tagName);

														return (
															<button
																key={typeof tag === "string" ? tag : tag.id || tag.name}
																type="button"
																onClick={() => toggleTag(tagName)}
																className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all flex items-center gap-1 ${
																	isSelected
																		? "bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-sm"
																		: "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
																}`}
															>
																{isSelected && <Check size={10} />}
																{tagName}
															</button>
														);
													})}
												</div>
											</div>
										</>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
								<div className="space-y-1.5">
									<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
										<Image size={14} /> Головне фото *
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
												alt="Main"
												className="w-full h-full object-cover"
											/>
											<button
												type="button"
												onClick={() =>
													setFormData((prev) => ({ ...prev, mainImage: "" }))
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
										<Image size={14} /> Галерея (до 10 фото)
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
										{galleryImages.length === 0 ? (
											<p className="text-[11px] text-slate-400 italic p-2 w-full text-center">
												Черга галереї порожня
											</p>
										) : (
											galleryImages.map((url, index) => (
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
														className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<X size={12} className="text-white" />
													</button>
												</div>
											))
										)}
									</div>
								</div>
							</div>

							<div className="space-y-1.5 border border-slate-200 p-4 rounded-2xl bg-slate-50/50">
								<label className="text-[11px] font-bold text-slate-600 block">
									Місцезнаходження на карті *
								</label>
								<div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 z-10 relative bg-white">
									<ManagerMap
										lat={formData.latitude}
										lng={formData.longitude}
										onChange={(lat, lng) =>
											setFormData((prev) => ({
												...prev,
												latitude: lat,
												longitude: lng,
											}))
										}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4 mt-1">
									<Input
										readOnly
										value={formData.latitude}
										placeholder="Широта"
										className="bg-slate-100 font-semibold text-[10px] h-8 rounded-xl"
									/>
									<Input
										readOnly
										value={formData.longitude}
										placeholder="Довгота"
										className="bg-slate-100 font-semibold text-[10px] h-8 rounded-xl"
									/>
								</div>
							</div>

							<div className="flex gap-6 p-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={formData.hasWifi}
										onChange={(e) =>
											setFormData({ ...formData, hasWifi: e.target.checked })
										}
										className="rounded text-blue-600 focus:ring-0 h-3.5 w-3.5 border-slate-300"
									/>
									<span>Є Wi-Fi</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={formData.hasParking}
										onChange={(e) =>
											setFormData({ ...formData, hasParking: e.target.checked })
										}
										className="rounded text-blue-600 focus:ring-0 h-3.5 w-3.5 border-slate-300"
									/>
									<span>Парковка</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={formData.hasLiveMusic}
										onChange={(e) =>
											setFormData({
												...formData,
												hasLiveMusic: e.target.checked,
											})
										}
										className="rounded text-blue-600 focus:ring-0 h-3.5 w-3.5 border-slate-300"
									/>
									<span>Жива музика</span>
								</label>
							</div>

							<Button
								type="submit"
								disabled={isUploading}
								className="w-full h-10 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
							>
								{isUploading ? (
									<>
										<Loader2 className="animate-spin mr-1.5 h-3.5 w-3.5" />
										Завантаження фото в S3...
									</>
								) : (
									"Створити заклад та надіслати на модерацію"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			{isLoading ? (
				<div className="text-center py-12 text-slate-400 animate-pulse font-bold uppercase tracking-wider text-[10px]">
					Завантаження списку закладів...
				</div>
			) : venues.length === 0 ? (
				<div className="flex flex-col items-center justify-center border border-dashed rounded-2xl border-slate-200 p-16 text-center bg-slate-50/50">
					<Store className="h-10 w-10 text-slate-300 mb-3" />
					<h3 className="font-bold text-sm text-slate-700">
						У вашій панелі немає жодного закладу
					</h3>
					<p className="text-[11px] text-slate-400 mt-1">
						Натисніть кнопку вгорі, щоб додати своє перше місце.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{venues.map((venue) => (
						<Card
							key={venue.id}
							className="overflow-hidden border-slate-100 flex flex-col hover:shadow-md transition-all duration-200 rounded-2xl shadow-sm bg-white"
						>
							<div className="h-44 w-full overflow-hidden relative bg-slate-100 border-b border-slate-100">
								{venue.mainImage ? (
									<img
										src={venue.mainImage}
										alt={venue.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-400 italic">
										Немає головного фото
									</div>
								)}
								<div className="absolute top-3 left-3">
									{renderStatusBadge(venue)}
								</div>
								<span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm text-slate-700">
                            <Layers size={11} /> {venue.type}
                         </span>
							</div>

							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
									{venue.name}
								</CardTitle>
							</CardHeader>

							<CardContent className="p-4 pt-0 mt-auto space-y-3 bg-slate-50/30">
								<div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 font-semibold">
									<MapPin size={13} className="shrink-0 text-slate-400" />
									<span className="line-clamp-1 text-slate-600">
                               {venue.address}
                            </span>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
									<Clock size={13} className="shrink-0 text-slate-400" />
									<span className="text-slate-600">{venue.workingHours}</span>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
									<Wallet size={13} className="shrink-0 text-slate-400" />
									<span className="text-slate-600">
                               Середній чек:{" "}
										<span className="font-bold text-slate-800">
                                  {venue.averageCheck} грн
                               </span>
                            </span>
								</div>

								{venue.images && venue.images.length > 0 && (
									<div className="space-y-1 pt-2 border-t border-slate-100">
                               <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">
                                  Галерея ({venue.images.length}):
                               </span>
										<div className="flex gap-1.5 overflow-x-auto pb-1">
											{venue.images.map((imgObj: any, idx: number) => {
												const imageUrl =
													typeof imgObj === "string" ? imgObj : imgObj.url;
												return (
													<div
														key={idx}
														className="relative h-9 w-12 rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-100"
													>
														<img
															src={imageUrl}
															alt="Gallery view"
															className="w-full h-full object-cover"
														/>
													</div>
												);
											})}
										</div>
									</div>
								)}

								<div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
									{venue.hasWifi && (
										<span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-blue-100">
                                  <Wifi size={11} /> Wi-Fi
                               </span>
									)}
									{venue.hasParking && (
										<span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-slate-200">
                                  <Car size={11} /> Парковка
                               </span>
									)}
									{venue.hasLiveMusic && (
										<span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-purple-100">
                                  <Music size={11} /> Жива музика
                               </span>
									)}
								</div>

								<div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 w-full">
									<Link
										href={`/manager/venues/${venue.id}/edit`}
										className="flex-1"
									>
										<Button
											type="button"
											variant="outline"
											className="w-full h-8 text-[11px] font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 px-2 flex items-center justify-center gap-1"
										>
											<Pencil size={12} /> Редагувати
										</Button>
									</Link>
									<Link
										href={`/manager/venues/${venue.id}/news`}
										className="flex-1"
									>
										<Button
											type="button"
											variant="outline"
											className="w-full h-8 text-[11px] font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 px-2 flex items-center justify-center gap-1"
										>
											<Newspaper size={12} /> Події
										</Button>
									</Link>
									<Button
										type="button"
										onClick={() => handleDeleteClick(venue.id, venue.name)}
										variant="outline"
										className="h-8 w-8 rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 p-0 flex items-center justify-center shrink-0"
										title="Видалити заклад"
									>
										<Trash2 size={12} />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}