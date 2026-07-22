"use client";

import React, { useState, useEffect, SyntheticEvent } from "react";
import {
	User,
	Heart,
	MessageSquare,
	Star,
	LogOut,
	Settings,
	Mail,
	Phone,
	Save,
	Trash2,
	Camera,
	Loader2,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/src/lib/api";
import { uploadFileToS3 } from "@/src/helpers/s3Upload";
import FavoriteVenues from "@/src/app/components/userAccount/FavoriteVenues";
import UserComments from "@/src/app/components/userAccount/UserComments";
import UserRatings from "@/src/app/components/userAccount/UserRatings";
import { toast } from "sonner";
import { TabType } from "@/src/types/constants";
import { formatUkrainianPhoneNumber } from "@/src/helpers/formatPhone";
import { clearAuthTokens } from "@/src/helpers/auth";

export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState<TabType>("edit-profile");
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phoneNumber: "",
		avatarUrl: "",
	});
	const [isLoadingProfile, setIsLoadingProfile] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

	useEffect(() => {
		async function loadProfile() {
			try {
				const data = await apiFetch("/user/me");
				const dbPhone = data.user.phoneNumber || "";
				setFormData({
					name: data.user.name || "",
					email: data.user.email || "",
					phoneNumber: dbPhone.startsWith("+380")
						? dbPhone
						: formatUkrainianPhoneNumber(dbPhone),
					avatarUrl: data.user.avatarUrl || "",
				});
			} catch (error) {
				toast.error("Не вдалося завантажити дані профілю");
			} finally {
				setIsLoadingProfile(false);
			}
		}
		void loadProfile();
	}, []);

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputVal = e.target.value;
		const maskedVal = formatUkrainianPhoneNumber(inputVal);
		if (maskedVal.length <= 19) {
			setFormData((prev) => ({ ...prev, phoneNumber: maskedVal }));
		}
	};

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploadingAvatar(true);
		try {
			const uploadedUrl = await uploadFileToS3(file, "avatars");
			if (!uploadedUrl) throw new Error("Не вдалося отримати посилання від S3");
			setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
			toast.success("Аватар успішно оновлено!");
		} catch (error: any) {
			toast.error(error.message || "Помилка при завантаженні аватара");
		} finally {
			setIsUploadingAvatar(false);
			if (e.target) e.target.value = "";
		}
	};

	const handleSaveProfile = async (e: SyntheticEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			const data = await apiFetch("/user/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: formData as any,
			});
			toast.success(data.message || "Профіль успішно оновлено!");
			setTimeout(() => window.location.reload(), 1000);
		} catch (error: any) {
			toast.error(error.message || "Не вдалося зберегти зміни");
		} finally {
			setIsSaving(false);
		}
	};

	// Обробник виходу з усіх пристроїв
	const handleLogoutAll = async () => {
		setIsLoggingOutAll(true);
		try {
			await apiFetch("/auth/logout-all", { method: "POST" });
			clearAuthTokens();
			toast.success("Ви успішно вийшли з усіх пристроїв!");
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);
		} catch (error: any) {
			toast.error(error.message || "Помилка при виконанні виходу");
		} finally {
			setIsLoggingOutAll(false);
		}
	};

	const confirmLogoutAll = () => {
		toast("⚠️ ВИХІД З УСІХ ПРИСТРОЇВ", {
			description:
				"Ви дійсно бажаєте анулювати всі сесії та вийти з акаунту на всіх пристроях?",
			action: {
				label: "Вийти з усіх",
				onClick: () => handleLogoutAll(),
			},
			duration: 6000,
		});
	};

	const executeDeleteAccount = async () => {
		try {
			await apiFetch("/user/profile", { method: "DELETE" });
			toast.success("Ваш акаунт було безповоротно видалено.");
			clearAuthTokens();
			setTimeout(() => {
				window.location.href = "/";
			}, 1500);
		} catch (error: any) {
			toast.error(error.message || "Помилка при видаленні акаунту");
		}
	};

	const handleDeleteAccountClick = () => {
		toast("🚨 Видалити акаунт назавжди?", {
			description:
				"Всі ваші персональні дані, відгуки та збережені заклади будуть повністю стерті.",
			action: {
				label: "Підтвердити",
				onClick: () => {
					toast.error("Остаточне підтвердження!", {
						description: "Ви дійсно впевнені? Цю дію неможливо скасувати.",
						action: {
							label: "Стерти дані",
							onClick: () => executeDeleteAccount(),
						},
						duration: 6000,
					});
				},
			},
			duration: 5000,
		});
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case "edit-profile":
				if (isLoadingProfile) {
					return (
						<div className="flex h-48 items-center justify-center text-[11px] font-bold text-slate-400 uppercase tracking-wider gap-2">
							<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
							<span>Завантаження...</span>
						</div>
					);
				}
				return (
					<div className="space-y-6 max-w-xl text-xs font-medium text-slate-900">
						<div>
							<h2 className="text-sm font-bold text-slate-900">
								Редагування профілю
							</h2>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Керування особистісними даними вашого акаунту
							</p>
						</div>

						<form onSubmit={handleSaveProfile} className="space-y-5">
							<div className="flex flex-col items-center space-y-2 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
								<div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center group">
									{formData.avatarUrl ? (
										<img
											src={formData.avatarUrl}
											alt="Avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										<User className="w-10 h-10 text-slate-400" />
									)}
									{isUploadingAvatar && (
										<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
											<Loader2 className="animate-spin text-white" size={20} />
										</div>
									)}
									{!isUploadingAvatar && (
										<label
											htmlFor="avatar-upload"
											className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white text-[9px] font-bold"
										>
											<Camera size={14} className="mb-0.5" />
											<span>Змінити</span>
										</label>
									)}
								</div>
								<input
									type="file"
									id="avatar-upload"
									accept="image/*"
									className="hidden"
									onChange={handleAvatarChange}
									disabled={isUploadingAvatar}
								/>
								<p className="text-[10px] text-slate-400 font-semibold">
									Квадратне фото завантажиться автоматично
								</p>
							</div>

							<div className="space-y-3">
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
										<User size={13} className="text-slate-400" /> Ім'я
										користувача
									</label>
									<Input
										type="text"
										required
										className="h-10 rounded-xl text-xs font-semibold"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
										<Mail size={13} className="text-slate-400" /> Електронна
										пошта
									</label>
									<Input
										type="email"
										required
										className="h-10 rounded-xl text-xs font-semibold"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
										<Phone size={13} className="text-slate-400" /> Номер
										телефону
									</label>
									<Input
										type="tel"
										className="h-10 rounded-xl text-xs font-semibold"
										placeholder="+380 (XX) XXX-XX-XX"
										value={formData.phoneNumber}
										onChange={handlePhoneChange}
									/>
								</div>
							</div>

							<Button
								type="submit"
								disabled={isSaving || isUploadingAvatar}
								className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm px-5 font-bold flex items-center gap-1.5"
							>
								{isSaving ? (
									<Loader2 className="animate-spin" size={14} />
								) : (
									<Save size={14} />
								)}
								Зберегти зміни
							</Button>
						</form>

						{/* Секція активних сесій та безпеки */}
						<div className="pt-5 border-t border-slate-100 space-y-4">
							<div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<h3 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
										<ShieldAlert size={14} className="text-amber-600" /> Безпека та сесії
									</h3>
									<p className="text-[11px] text-amber-800 font-semibold mt-0.5">
										Анулювати всі активні сесії та вийти з акаунту на всіх пристроях.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={confirmLogoutAll}
									disabled={isLoggingOutAll}
									className="h-9 rounded-xl text-[11px] font-bold border-amber-300 text-amber-900 bg-white hover:bg-amber-100 shrink-0 flex items-center gap-1.5"
								>
									{isLoggingOutAll ? (
										<Loader2 size={13} className="animate-spin" />
									) : (
										<LogOut size={13} />
									)}
									Вийти з усіх пристроїв
								</Button>
							</div>

							{/* Небезпечна зона */}
							<div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<h3 className="text-xs font-black text-rose-600 uppercase tracking-wide">
										Небезпечна зона
									</h3>
									<p className="text-[11px] text-slate-500 font-semibold mt-0.5">
										Видалення акаунту призведе до повної втрати доступу до
										системи.
									</p>
								</div>
								<Button
									type="button"
									variant="destructive"
									onClick={handleDeleteAccountClick}
									className="h-9 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1.5"
								>
									<Trash2 size={13} /> Видалити акаунт назавжди
								</Button>
							</div>
						</div>
					</div>
				);
			case "favorites":
				return <FavoriteVenues />;
			case "comments":
				return <UserComments />;
			case "ratings":
				return <UserRatings />;
			default:
				return null;
		}
	};

	const menuItems = [
		{ id: "edit-profile", label: "Редагування / Видалення", icon: Settings },
		{ id: "favorites", label: "Улюблені заклади", icon: Heart },
		{ id: "comments", label: "Мої коментарі", icon: MessageSquare },
		{ id: "ratings", label: "Мої оцінки", icon: Star },
	] as const;

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 text-xs font-medium text-slate-900">
			<h1 className="text-xl font-black text-slate-900 mb-6 tracking-tight">
				Особистий кабінет
			</h1>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm h-fit space-y-1.5">
					<div className="flex items-center space-x-3 p-1.5 pb-3.5 mb-1.5 border-b border-slate-100">
						<div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm shrink-0">
							{formData.avatarUrl ? (
								<img
									src={formData.avatarUrl}
									alt="Avatar"
									className="w-full h-full object-cover"
								/>
							) : formData.name ? (
								formData.name[0].toUpperCase()
							) : (
								"U"
							)}
						</div>
						<div className="min-w-0">
							<p className="text-xs font-bold truncate text-slate-900">
								{formData.name || "Користувач"}
							</p>
							<p className="text-[10px] text-slate-400 font-semibold truncate">
								Мій профіль у системі
							</p>
						</div>
					</div>

					<nav className="space-y-1">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeTab === item.id;
							return (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 ${
										isActive
											? "bg-blue-600 text-white shadow-sm"
											: "text-slate-600 hover:bg-slate-50"
									}`}
								>
									<Icon
										className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
									/>
									<span className="truncate">{item.label}</span>
								</button>
							);
						})}
					</nav>

					<div className="pt-2 mt-1 border-t border-slate-100">
						<button
							onClick={() => {
								clearAuthTokens();
								setFormData({
									name: "",
									email: "",
									phoneNumber: "",
									avatarUrl: "",
								});
								toast.success("Вихід здійснено успішно!");
								setTimeout(() => {
									window.location.href = "/";
								}, 800);
							}}
							className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150"
						>
							<LogOut className="h-3.5 w-3.5 shrink-0 text-rose-500" />
							<span>Вийти з акаунту</span>
						</button>
					</div>
				</div>
				<div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[420px]">
					{renderTabContent()}
				</div>
			</div>
		</div>
	);
}