"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { useUiStore } from "@/src/store/useUiStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	Star,
	MapPin,
	Phone,
	Clock,
	Globe,
	Wifi,
	ParkingCircle,
	Music,
	Eye,
	Calendar,
	Heart,
	MessageSquare,
	Images,
	X,
	Users,
} from "lucide-react";
import VenueMeetupsSection from "@/src/app/components/VenueMeetupsSection";
import VenueFeedbackModal from "@/src/app/components/VenueFeedbackModal";
import VenueTags from "@/src/app/components/VenueTags";
import { toast } from "sonner";
import { NewsVenueItem } from "@/src/interfaces/news";
import { FullVenue } from "@/src/interfaces/venue";
import { getAuthToken } from "@/src/helpers/auth";

interface ApiResponse {
	venue: FullVenue;
}

export default function VenueDetailsPage() {
	const { id } = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { openReviewModal } = useUiStore();
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const token = getAuthToken();
			setIsAuthenticated(!!token);
		}
	}, []);

	const { data, isLoading, isError } = useQuery<ApiResponse>({
		queryKey: ["venueDetails", id],
		queryFn: () => apiFetch(`/venues/${id}`),
		enabled: !!id,
	});

	const venue = data?.venue;

	const [activeImage, setActiveImage] = useState<string>("");
	const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
	const [currentImgIndex, setCurrentImgIndex] = useState<number>(0);
	const [selectedNews, setSelectedNews] = useState<NewsVenueItem | null>(null);
	const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
	const [isFavorite, setIsFavorite] = useState<boolean>(false);
	const [isFavLoading, setIsFavLoading] = useState<boolean>(false);

	useEffect(() => {
		if (venue) {
			if (venue.mainImage && !activeImage) {
				setActiveImage(venue.mainImage);
			}
			setIsFavorite(!!venue.isFavorite);
		}
	}, [venue, activeImage]);
	useEffect(() => {
		if (!id) return;

		const recordView = async () => {
			try {
				await fetch(`/api/venues/${id}/view`, { method: "POST" });
				await queryClient.invalidateQueries({ queryKey: ["venueDetails", id] });
			} catch (err) {
				console.error("Не вдалося зафіксувати перегляд для аналітики:", err);
			}
		};

		void recordView();
	}, [id, queryClient]);

	const allVenueImages = venue
		? [venue.mainImage, ...(venue.images || [])].filter(Boolean)
		: [];

	const handleProtectedAction = (action: () => void) => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
		} else {
			action();
		}
	};

	const handleToggleFavorite = async () => {
		if (!venue || isFavLoading) return;

		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		setIsFavLoading(true);
		try {
			const method = isFavorite ? "DELETE" : "POST";

			await apiFetch("/user/favorites", {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: { venueId: venue.id } as any,
			});

			setIsFavorite(!isFavorite);
			await queryClient.invalidateQueries({
				queryKey: ["venueDetails", venue.id],
			});
			await queryClient.invalidateQueries({ queryKey: ["favoriteVenues"] });
		} catch (err: any) {
			console.error("Помилка при зміні обраного:", err);
			toast.error("Не вдалося зберегти в обране");
		} finally {
			setIsFavLoading(false);
		}
	};

	const nextImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		setCurrentImgIndex((prev) => (prev + 1) % allVenueImages.length);
	};

	const prevImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		setCurrentImgIndex(
			(prev) => (prev - 1 + allVenueImages.length) % allVenueImages.length,
		);
	};

	if (isLoading) {
		return (
			<div className="max-w-6xl mx-auto p-6 space-y-6 animate-pulse">
				<div className="h-96 bg-slate-200 rounded-3xl" />
				<div className="h-10 bg-slate-200 w-1/3 rounded" />
				<div className="h-20 bg-slate-200 rounded" />
			</div>
		);
	}

	if (isError || !venue) {
		return (
			<div className="text-center py-20 text-red-600 bg-red-50 rounded-2xl border border-red-100 max-w-xl mx-auto m-6">
				Заклад не знайдено або сталася помилка завантаження даних.
			</div>
		);
	}

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }).map((_, index) => (
			<Star
				key={index}
				className={`h-4 w-4 ${index < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
			/>
		));
	};

	return (
		<div className="max-w-6xl mx-auto space-y-8 animate-fadeIn px-4 sm:px-6 pb-10">
			<div className="relative h-[450px] w-full overflow-hidden rounded-3xl shadow-lg bg-slate-900">
				<img
					src={
						activeImage ||
						venue.mainImage ||
						"https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200"
					}
					alt={venue.name}
					onClick={() => {
						const index = allVenueImages.indexOf(
							activeImage || venue.mainImage,
						);
						setCurrentImgIndex(index >= 0 ? index : 0);
						setIsGalleryOpen(true);
					}}
					className="w-full h-full object-cover opacity-90 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

				<div className="absolute bottom-6 left-6 right-6 text-white z-10 pointer-events-none flex items-end justify-between">
					<div>
						<span className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
							{venue.type}
						</span>
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 drop-shadow-sm">
							{venue.name}
						</h1>
					</div>
				</div>
				<button
					onClick={handleToggleFavorite}
					disabled={isFavLoading}
					className={`absolute bottom-6 right-6 z-20 p-3.5 rounded-full backdrop-blur-md shadow-lg border border-white/10 transition-all duration-300 transform active:scale-95 disabled:opacity-50 ${
						isFavorite
							? "bg-red-500/20 text-red-500 border-red-500/30"
							: "bg-slate-950/40 text-white hover:bg-slate-950/60 hover:text-red-400"
					}`}
					title={isFavorite ? "Видалити з обраного" : "Додати в обране"}
				>
					<Heart
						className={`w-6 h-6 transition-all duration-300 ${isFavorite ? "scale-110" : ""}`}
						fill={isFavorite ? "#ef4444" : "none"}
					/>
				</button>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-4 flex items-center space-x-3">
					<div className="p-3 bg-amber-50 rounded-xl">
						<Star className="h-6 w-6 text-amber-500 fill-amber-500" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">
							Рейтинг закладу
						</p>
						<p className="text-lg font-bold text-slate-900">
							{venue.rating > 0 ? venue.rating.toFixed(1) : "0.0"} / 5.0
						</p>
					</div>
				</Card>

				<Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-4 flex items-center space-x-3">
					<div className="p-3 bg-blue-50 rounded-xl">
						<Eye className="h-6 w-6 text-blue-600" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">Перегляди</p>
						<p className="text-lg font-bold text-slate-900">
							{venue.views || 0} разів
						</p>
					</div>
				</Card>

				<Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-4 flex items-center space-x-3">
					<div className="p-3 bg-green-50 rounded-xl">
						<span className="text-xl font-bold text-green-600">₴</span>
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">Середній чек</p>
						<p className="text-lg font-bold text-slate-900">
							{venue.averageCheck} ₴
						</p>
					</div>
				</Card>

				<Card className="bg-white border-slate-100 shadow-sm rounded-2xl p-4 flex items-center space-x-3">
					<div className="p-3 bg-purple-50 rounded-xl">
						<Clock className="h-6 w-6 text-purple-600" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">Режим роботи</p>
						<p className="text-sm font-bold text-slate-900 truncate">
							{venue.workingHours || "Не вказано"}
						</p>
					</div>
				</Card>
			</div>
			{isAuthenticated ? (
				<VenueMeetupsSection venueId={venue.id} venueName={venue.name} />
			) : (
				<div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
					<div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm">
						<Users className="h-6 w-6 text-blue-500" />
					</div>
					<div>
						<h3 className="text-lg font-bold text-slate-900">
							Компанії та зустрічі
						</h3>
						<p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
							Авторизуйтесь, щоб бачити, хто зараз відпочиває у цьому закладі,
							або створити власну зустріч.
						</p>
					</div>
					<Button
						onClick={() => setIsAuthModalOpen(true)}
						className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
					>
						Увійти
					</Button>
				</div>
			)}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				<div className="lg:col-span-2 space-y-8">
					<Card className="bg-white border-slate-200/60 shadow-sm rounded-2xl p-6">
						<h2 className="text-xl font-bold text-slate-900 mb-3">
							Про заклад
						</h2>
						<p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
							{venue.description || "Ласкаво просимо до нашого закладу!"}
						</p>

						{venue.tags && venue.tags.length > 0 && (
							<div className="pt-4 mt-4 border-t border-slate-100">
								<VenueTags tags={venue.tags} />
							</div>
						)}
					</Card>
					{venue.images && venue.images.length > 0 && (
						<Card className="bg-white border-slate-200/60 shadow-sm rounded-2xl p-6">
							<h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
								<Images className="h-5 w-5 text-blue-600" />
								Галерея закладу ({allVenueImages.length})
							</h2>
							<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
								{allVenueImages.map((imgUrl, idx) => (
									<div
										key={idx}
										onClick={() => {
											setActiveImage(imgUrl);
											setCurrentImgIndex(idx);
											setIsGalleryOpen(true);
										}}
										className={`h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === imgUrl ? "border-blue-600 scale-95 shadow-sm" : "border-transparent hover:border-slate-300"}`}
									>
										<img
											src={imgUrl}
											alt={`Галерея ${idx + 1}`}
											className="w-full h-full object-cover"
										/>
									</div>
								))}
							</div>
						</Card>
					)}
					<Card className="bg-white border-slate-200/60 shadow-sm rounded-2xl p-6">
						<h2 className="text-xl font-bold text-slate-900 mb-4">
							Зручності та послуги
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div
								className={`flex items-center space-x-3 text-sm font-medium p-3 rounded-xl border ${venue.hasWifi ? "border-green-100 bg-green-50/50 text-green-800" : "border-slate-100 text-slate-400"}`}
							>
								<Wifi className="h-5 w-5 shrink-0" />
								<span>
									{venue.hasWifi ? "Безкоштовний Wi-Fi" : "Немає Wi-Fi"}
								</span>
							</div>
							<div
								className={`flex items-center space-x-3 text-sm font-medium p-3 rounded-xl border ${venue.hasParking ? "border-blue-100 bg-blue-50/50 text-blue-800" : "border-slate-100 text-slate-400"}`}
							>
								<ParkingCircle className="h-5 w-5 shrink-0" />
								<span>
									{venue.hasParking ? "Власна парковка" : "Немає парковки"}
								</span>
							</div>
							<div
								className={`flex items-center space-x-3 text-sm font-medium p-3 rounded-xl border ${venue.hasMusic ? "border-purple-100 bg-purple-50/50 text-purple-800" : "border-slate-100 text-slate-400"}`}
							>
								<Music className="h-5 w-5 shrink-0" />
								<span>
									{venue.hasMusic ? "Жива музика" : "Без живої музики"}
								</span>
							</div>
						</div>
					</Card>
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
							<Calendar className="h-5 w-5 text-blue-600" />
							Новини та Акції закладу
						</h2>

						{!venue.news || venue.news.length === 0 ? (
							<p className="text-sm text-slate-500 italic bg-slate-50 border border-slate-100 p-4 rounded-xl">
								Заклад ще не публікував жодних новин або спеціальних пропозицій.
							</p>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{venue.news.map((item) => (
									<Card
										key={item.id}
										onClick={() => setSelectedNews(item)}
										className="overflow-hidden bg-white border-slate-200/60 shadow-sm rounded-2xl flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-100 transition duration-200"
									>
										<div>
											{item.image && (
												<div className="h-40 w-full overflow-hidden bg-slate-100">
													<img
														src={item.image}
														alt={item.title}
														className="w-full h-full object-cover"
													/>
												</div>
											)}
											<CardHeader className="p-4 pb-2">
												<div className="text-[10px] font-semibold text-slate-400">
													{new Date(item.createdAt).toLocaleDateString("uk-UA")}
												</div>
												<CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
													{item.title}
												</CardTitle>
											</CardHeader>

											<CardContent className="p-4 pt-0 text-xs text-slate-600">
												<p className="line-clamp-3 leading-relaxed">
													{item.content}
												</p>
											</CardContent>
										</div>

										<div className="px-4 pb-4 pt-0">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setSelectedNews(item);
												}}
												className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1"
											>
												Читати повністю...
											</button>
										</div>
									</Card>
								))}
							</div>
						)}
					</div>
					<div className="space-y-4 pt-4">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
								<MessageSquare className="h-5 w-5 text-blue-600" />
								Відгуки користувачів
							</h2>
							<Button
								variant="outline"
								size="sm"
								className="text-xs font-semibold rounded-xl"
								onClick={() =>
									handleProtectedAction(() => openReviewModal(venue.id))
								}
							>
								Написати відгук
							</Button>
						</div>

						{!venue.reviews || venue.reviews.length === 0 ? (
							<div className="text-center p-8 bg-white border border-slate-200/60 rounded-2xl shadow-sm text-slate-500 space-y-2">
								<p className="text-sm font-medium">Ще немає жодного відгуку.</p>
								<p className="text-xs text-slate-400">
									Станьте першим, хто поділиться своїми враженнями!
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{venue.reviews.map((review) => (
									<Card
										key={review.id}
										className="bg-white border-slate-200/60 shadow-sm rounded-2xl p-5 space-y-3"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-center space-x-3">
												<Avatar className="h-10 w-10 border border-slate-100">
													<AvatarImage
														src={review.user?.avatar}
														alt={review.user?.name}
													/>
													<AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
														{review.user?.name
															? review.user.name.slice(0, 2).toUpperCase()
															: "УК"}
													</AvatarFallback>
												</Avatar>
												<div>
													<h4 className="text-sm font-bold text-slate-900">
														{review.user?.name || "Анонім"}
													</h4>
													<p className="text-[10px] text-slate-400">
														{new Date(review.createdAt).toLocaleDateString(
															"uk-UA",
														)}
													</p>
												</div>
											</div>
											<div className="flex items-center space-x-0.5 bg-slate-50 px-2 py-1 rounded-lg border text-xs font-bold text-slate-700">
												{renderStars(review.rating)}
											</div>
										</div>
										<p className="text-slate-600 text-sm leading-relaxed pl-1">
											{review.text}
										</p>
									</Card>
								))}
							</div>
						)}
					</div>
				</div>
				<div className="space-y-6">
					<Card className="bg-white border-slate-200/60 shadow-sm rounded-2xl p-6 sticky top-6">
						<h3 className="text-lg font-bold text-slate-900 mb-4">
							Контакти закладу
						</h3>
						<div className="space-y-4 text-sm text-slate-600">
							{venue.phone && (
								<div className="flex items-center space-x-3">
									<Phone className="h-4 w-4 text-slate-400 shrink-0" />
									<a
										href={`tel:${venue.phone}`}
										className="hover:text-blue-600 font-medium transition"
									>
										{venue.phone}
									</a>
								</div>
							)}
							{venue.website && (
								<div className="flex items-center space-x-3">
									<Globe className="h-4 w-4 text-slate-400 shrink-0" />
									<a
										href={venue.website}
										target="_blank"
										rel="noreferrer"
										className="hover:text-blue-600 font-medium transition truncate"
									>
										{venue.website}
									</a>
								</div>
							)}
							<div className="flex items-start space-x-3 pt-2 border-t border-slate-100">
								<MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
								<div>
									<p className="font-semibold text-slate-800">Адреса закладу</p>
									<p className="text-xs text-slate-500 mt-0.5">
										{venue.address}
									</p>
								</div>
							</div>
							<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
								<div>
									<h3 className="font-bold text-slate-800 text-sm">
										Зворотній зв'язок
									</h3>
									<p className="text-slate-400 text-[11px] mt-0.5">
										Виникли запитання чи є скарга на сервіс?
									</p>
								</div>

								<Button
									onClick={() =>
										handleProtectedAction(() => setIsFeedbackOpen(true))
									}
									className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 rounded-xl gap-2 shadow-sm transition"
								>
									<MessageSquare size={14} /> Написати менеджеру
								</Button>
							</div>
							<VenueFeedbackModal
								venueId={venue.id}
								venueName={venue.name}
								isOpen={isFeedbackOpen}
								onClose={() => setIsFeedbackOpen(false)}
							/>
						</div>
					</Card>
				</div>
			</div>
			{selectedNews && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div
						className="absolute inset-0"
						onClick={() => setSelectedNews(null)}
					></div>

					<div className="bg-white border rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] flex flex-col relative z-10 overflow-hidden animate-scale-up text-slate-900">
						<div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
							<div className="flex items-center gap-2">
								<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
									{selectedNews.category === "PROMOTED" ? "Акція" : "Новина"}
								</span>
								<span className="text-xs text-slate-400 font-medium">
									{new Date(selectedNews.createdAt).toLocaleDateString("uk-UA")}
								</span>
							</div>
							<button
								onClick={() => setSelectedNews(null)}
								className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
							>
								<X size={18} />
							</button>
						</div>

						<div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
							{selectedNews.image && (
								<div className="w-full h-48 rounded-lg overflow-hidden border">
									<img
										src={selectedNews.image}
										alt={selectedNews.title}
										className="w-full h-full object-cover"
									/>
								</div>
							)}

							<h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
								{selectedNews.title}
							</h2>

							<p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
								{selectedNews.content}
							</p>
						</div>

						<div className="p-4 border-t bg-slate-50/20 flex justify-end">
							<button
								type="button"
								onClick={() => setSelectedNews(null)}
								className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
							>
								Закрити
							</button>
						</div>
					</div>
				</div>
			)}

			{isGalleryOpen && allVenueImages.length > 0 && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none">
					<button
						onClick={() => setIsGalleryOpen(false)}
						className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition z-50"
					>
						<X size={24} />
					</button>

					<div className="absolute top-7 text-sm font-medium text-white/60 z-40">
						{currentImgIndex + 1} із {allVenueImages.length}
					</div>

					<div
						className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center px-4"
						onClick={() => setIsGalleryOpen(false)}
					>
						<img
							src={allVenueImages[currentImgIndex]}
							alt={`Фото закладу ${currentImgIndex + 1}`}
							onClick={(e) => e.stopPropagation()}
							className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up"
						/>

						{allVenueImages.length > 1 && (
							<button
								onClick={prevImage}
								className="absolute left-4 sm:left-6 p-3 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition shadow-lg backdrop-blur-sm"
							>
								<ChevronLeft size={24} />
							</button>
						)}

						{allVenueImages.length > 1 && (
							<button
								onClick={nextImage}
								className="absolute right-4 sm:right-6 p-3 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition shadow-lg backdrop-blur-sm"
							>
								<ChevronRight size={24} />
							</button>
						)}
					</div>

					{allVenueImages.length > 1 && (
						<div className="absolute bottom-6 flex items-center gap-2 overflow-x-auto max-w-full px-4 py-2 custom-scrollbar">
							{allVenueImages.map((imgUrl, idx) => (
								<div
									key={idx}
									onClick={() => setCurrentImgIndex(idx)}
									className={`h-12 w-16 rounded-md overflow-hidden cursor-pointer border-2 transition shrink-0 ${currentImgIndex === idx ? "border-blue-500 scale-105 shadow-md" : "border-white/20 opacity-50 hover:opacity-100"}`}
								>
									<img
										src={imgUrl}
										alt="Миниатюра"
										className="w-full h-full object-cover"
									/>
								</div>
							))}
						</div>
					)}
				</div>
			)}
			{isAuthModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
					<div
						className="absolute inset-0"
						onClick={() => setIsAuthModalOpen(false)}
					></div>
					<div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 relative z-10 text-center space-y-5">
						<button
							onClick={() => setIsAuthModalOpen(false)}
							className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
						>
							<X size={18} />
						</button>

						<div className="mx-auto h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 text-amber-500">
							<Heart size={28} className="fill-amber-500 text-amber-500" />
						</div>

						<div className="space-y-2">
							<h3 className="text-xl font-black text-slate-900 tracking-tight">
								Потрібна авторизація
							</h3>
							<p className="text-xs text-slate-500 leading-relaxed px-2">
								Зберігати заклади в обране, створювати зустрічі П'ячок, писати
								відгуки та зв'язуватися з менеджером можуть лише зареєстровані
								користувачі.
							</p>
						</div>

						<div className="flex flex-col gap-2 pt-2">
							<Button
								onClick={() => router.push("/register")}
								className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl gap-2 shadow-md transition"
							>
								Створити акаунт
							</Button>

							<Button
								onClick={() => router.push("/login")}
								variant="outline"
								className="w-full border-slate-200 hover:bg-slate-50 font-bold h-11 rounded-xl gap-2 transition text-slate-700"
							>
								Увійти
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
