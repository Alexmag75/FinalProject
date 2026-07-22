"use client";

import React, { useState, useEffect, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	ImageIcon,
	X,
	PlusCircle,
	MapPin,
	Tag,
	Check,
	Loader2,
} from "lucide-react";
import { createVenueSchema } from "@/src/lib/validations";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dynamic from "next/dynamic";
import { formatUkrainianPhoneNumber } from "@/src/helpers/formatPhone";
import { getAuthToken } from "@/src/helpers/auth";
import {VENUE_TYPES} from "@/src/types/constants";

if (typeof window !== "undefined") {
	delete (L.Icon.Default.prototype as any)._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
		iconRetinaUrl:
			"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
		shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
	});
}

function LocationMarker({
	position,
	setPosition,
}: {
	position: [number, number];
	setPosition: (pos: [number, number]) => void;
}) {
	useMapEvents({
		click(e) {
			setPosition([e.latlng.lat, e.latlng.lng]);
		},
	});
	return position ? <Marker position={position} /> : null;
}

interface InteractiveMapProps {
	mapPosition: [number, number];
	setMapPosition: (pos: [number, number]) => void;
}

function InteractiveMap({ mapPosition, setMapPosition }: InteractiveMapProps) {
	return (
		<MapContainer
			center={mapPosition}
			zoom={13}
			style={{ height: "100%", width: "100%" }}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<LocationMarker position={mapPosition} setPosition={setMapPosition} />
		</MapContainer>
	);
}
const DynamicMap = dynamic(() => Promise.resolve(InteractiveMap), {
	ssr: false,
});
export default function CreateVenue() {
	const router = useRouter();

	const [mapPosition, setMapPosition] = useState<[number, number]>([
		46.4825, 30.7233,
	]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);

	useEffect(() => {
		const fetchTags = async () => {
			try {
				const res = await fetch("/api/tags");
				const data = await res.json();
				if (data.tags) {
					setAvailableTags(data.tags.map((t: any) => t.name));
				}
			} catch (err) {
				console.error("Помилка завантаження тегів:", err);
			}
		};
		void fetchTags();
	}, []);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [customTagInput, setCustomTagInput] = useState("");

	const [formData, setFormData] = useState({
		name: "",
		type: "",
		address: "",
		phone: "",
		averageCheck: 0,
		workingHours: "",
		hasWifi: false,
		hasParking: false,
		hasMusic: false,
		mainImage: "",
		images: [] as string[],
		latitude: 46.4825,
		longitude: 30.7233,
	});

	const [isUploading, setIsUploading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			latitude: mapPosition[0],
			longitude: mapPosition[1],
		}));
	}, [mapPosition]);

	const toggleTag = (tag: string) => {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const handleAddCustomTag = async (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && customTagInput.trim()) {
			e.preventDefault();
			const newTag = customTagInput.trim().toLowerCase();

			try {
				const token = getAuthToken();

				console.log("📤 Відправляємо новий тег:", newTag);

				const res = await fetch("/api/tags", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name: newTag }),
				});

				const data = await res.json();

				if (!res.ok) {
					toast.error(data.error || "Не вдалося зберегти тег у базу");
					return;
				}
				toast.success(`Тег "${newTag}" додано в базу!`);
				const createdTagName = data.name || newTag;

				if (!availableTags.includes(createdTagName)) {
					setAvailableTags((prev) => [...prev, createdTagName]);
				}
				if (!selectedTags.includes(createdTagName)) {
					setSelectedTags((prev) => [...prev, createdTagName]);
				}

				setCustomTagInput("");
			} catch (err) {
				toast.error("Помилка з'єднання з сервером");
			}
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
				setFormData((prev) => ({ ...prev, mainImage: uploadedUrl }));
				toast.success("Головне фото успішно завантажено!");
			}
		} catch (error) {
			console.error("Помилка завантаження головного фото:", error);
			toast.error("Не вдалося завантажити головне фото");
		}
		{
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
				setFormData((prev) => ({
					...prev,
					images: [...prev.images, ...uploadedUrls],
				}));
				toast.success(
					`Завантажено фото до галереї: ${uploadedUrls.length} шт.`,
				);
			}
		} catch (error) {
			toast.error("Не вдалося завантажити файли галереї");
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();
		const cleanPhone = formData.phone.replace(/\D/g, "");

		if (!cleanPhone || cleanPhone.length !== 12) {
			toast.warning("Будь ласка, введіть номер телефону повністю");
			return;
		}

		if (!formData.mainImage) {
			toast.warning("Головне фото закладу є обов’язковим!");
			return;
		}
		const finalData = {
			...formData,
			averageCheck: Number(formData.averageCheck) || 0,
			hasLiveMusic: formData.hasMusic,
			tags: selectedTags.join(", "),
		};

		const result = createVenueSchema.safeParse(finalData);
		if (!result.success) {
			const firstError = result.error.issues[0];
			toast.error(`Помилка в полі [${firstError.path.join(".")}]: ${firstError.message}`);
			return;
		}
		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/venues", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				credentials: "include",
				body: JSON.stringify(finalData),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Помилка при створенні");
			}
			toast.success("Заклад успішно додано до платформи!");

			setFormData({
				name: "",
				type: "",
				address: "",
				phone: "",
				averageCheck: 0,
				workingHours: "",
				hasWifi: false,
				hasParking: false,
				hasMusic: false,
				mainImage: "",
				images: [],
				latitude: 46.4825,
				longitude: 30.7233,
			});
			setSelectedTags([]);
			setMapPosition([46.4825, 30.7233]);
			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти заклад");
		} finally {
			setIsSaving(false);
		}
	};
	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-2xl mx-auto text-xs font-medium">
			<div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
				<PlusCircle className="text-amber-500" size={18} />
				<div>
					<h2 className="text-sm font-bold text-slate-900">
						Додати новий заклад
					</h2>
					<p className="text-[11px] text-slate-400 mt-0.5">
						Створення точки з інтерактивною картою, маскою телефону та списком
						тегів.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-1">
						<label className="text-slate-500 font-bold">Назва закладу *</label>
						<Input
							className="text-xs h-9"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Наприклад: Hookah Lounge"
							required
						/>
					</div>

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

					<div className="space-y-1">
						<label className="text-slate-500 font-bold">Адреса закладу *</label>
						<Input
							className="text-xs h-9"
							value={formData.address}
							onChange={(e) =>
								setFormData({ ...formData, address: e.target.value })
							}
							placeholder="вул. Канатна, 22"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="text-slate-500 font-bold">Номер телефону *</label>
						<Input
							type="tel"
							placeholder="+380 (XX) XXX-XX-XX"
							value={formData.phone}
							onChange={(e) => {
								const formatted = formatUkrainianPhoneNumber(e.target.value);
								if (formatted.length <= 19) {
									setFormData((prev) => ({ ...prev, phone: formatted }));
								}
							}}
							className="text-xs h-9"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="text-slate-500 font-bold">
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

					<div className="space-y-1">
						<label className="text-slate-500 font-bold">Часи роботи *</label>
						<Input
							className="text-xs h-9"
							value={formData.workingHours}
							onChange={(e) =>
								setFormData({ ...formData, workingHours: e.target.value })
							}
							placeholder="12:00 - 00:00"
							required
						/>
					</div>
				</div>

				<div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
					<label className="font-bold text-slate-500 flex items-center gap-1.5">
						<Tag size={13} className="text-slate-400" /> Оберіть теги закладу
						або додайте свій:
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
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddCustomTag(e);
								}
							}}
							placeholder="Введіть новий тег та натисніть Enter..."
							className="h-8 text-xs bg-white"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<label className="font-bold text-slate-500 flex items-center gap-1">
						<MapPin size={13} className="text-amber-500" /> Локація на карті
						(Клікніть, щоб встановити маркер)
					</label>
					<div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative">
						<DynamicMap
							mapPosition={mapPosition}
							setMapPosition={setMapPosition}
						/>
					</div>
					<div className="flex gap-4 text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
             <span>
                <strong>Широта (Lat):</strong> {formData.latitude.toFixed(6)}
             </span>
						<span>
                <strong>Довгота (Lng):</strong> {formData.longitude.toFixed(6)}
             </span>
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
								checked={(formData as any)[item.key]}
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
									alt="Main"
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() =>
										setFormData((prev) => ({ ...prev, mainImage: "" }))
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
							{formData.images.map((url, idx) => (
								<div
									key={idx}
									className="relative h-8 w-12 rounded border overflow-hidden group"
								>
									<img
										src={url}
										alt="Gallery"
										className="w-full h-full object-cover"
									/>
									<button
										type="button"
										onClick={() =>
											setFormData((prev) => ({
												...prev,
												images: prev.images.filter((_, i) => i !== idx),
											}))
										}
										className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<X size={12} className="text-white" />
									</button>
								</div>
							))}
						</div>
					</div>
				</div>

				<Button
					type="submit"
					className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 text-xs flex items-center justify-center gap-1.5 shadow-sm"
					disabled={isSaving || isUploading}
				>
					{isSaving && <Loader2 size={14} className="animate-spin" />}
					{isSaving ? "Збереження..." : "Створити заклад"}
				</Button>
			</form>
		</div>
	);
}
