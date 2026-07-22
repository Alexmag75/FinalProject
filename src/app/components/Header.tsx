"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/context/AuthContext";
import {
	MapPin,
	User,
	LogOut,
	Settings,
	Menu,
	X,
	Layers,
	Newspaper,
	Beer,
	Heart,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SafetyWarningModal from "@/src/app/components/SafetyWarningModal";
import { createPortal } from "react-dom";

export default function Header() {
	const { user, logout } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const [isWarningOpen, setIsWarningOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setIsDropdownOpen(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setIsDropdownOpen(false);
		}, 150);
	};

	const handleMeetupsClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsMobileMenuOpen(false);
		if (!user) {
			setIsAuthModalOpen(true);
			return;
		}
		const isSafetyConfirmed = localStorage.getItem("meetup_safety_confirmed");
		if (isSafetyConfirmed) {
			router.push("/meetups");
		} else {
			setIsWarningOpen(true);
		}
	};

	const handleConfirmSafety = () => {
		localStorage.setItem("meetup_safety_confirmed", "true");
		setIsWarningOpen(false);
		router.push("/meetups");
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
				<Link
					href="/"
					onClick={() => setIsMobileMenuOpen(false)}
					className="flex items-center space-x-2 text-xl font-black tracking-tight text-blue-600 hover:opacity-90 transition"
				>
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
						<MapPin className="h-5 w-5" />
					</div>
					<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
						Пʼячок
					</span>
				</Link>
				<div className="flex items-center space-x-3 md:space-x-6">
					<nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
						<Link
							href="/venues"
							className={`px-3 py-2 rounded-xl transition-all duration-200 hover:text-blue-600 hover:bg-slate-50 ${
								pathname === "/venues"
									? "text-blue-600 bg-blue-50/50 font-semibold"
									: "text-slate-600"
							}`}
						>
							Каталог
						</Link>

						<Link
							href="/news"
							className={`px-3 py-2 rounded-xl transition-all duration-200 hover:text-blue-600 hover:bg-slate-50 ${
								pathname === "/news"
									? "text-blue-600 bg-blue-50/50 font-semibold"
									: "text-slate-600"
							}`}
						>
							Новини
						</Link>

						<Link
							href="/meetups"
							onClick={handleMeetupsClick}
							className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 ${
								pathname === "/meetups"
									? "bg-amber-500 text-white font-bold shadow-sm shadow-amber-100"
									: "text-amber-600 hover:bg-amber-50"
							}`}
						>
							<span>🍻</span>
							<span>Пиячок</span>
							{pathname !== "/meetups" && (
								<span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
							)}
						</Link>

						{user?.role === "MANAGER" && (
							<Link
								href="/manager/dashboard"
								className={`px-3 py-2 rounded-xl transition-all duration-200 hover:bg-amber-50 font-semibold text-amber-600 ${
									pathname.startsWith("/manager") ? "bg-amber-50" : ""
								}`}
							>
								Панель менеджера
							</Link>
						)}

						{user?.role === "SUPERADMIN" && (
							<Link
								href="/admin/dashboard"
								className={`px-3 py-2 rounded-xl transition-all duration-200 hover:bg-red-50 font-semibold text-red-600 ${
									pathname.startsWith("/admin") ? "bg-red-50" : ""
								}`}
							>
								Панель admin
							</Link>
						)}
					</nav>

					<div className="hidden md:block h-5 w-px bg-slate-200" />
					<div className="flex items-center">
						{user ? (
							<div
								className="relative"
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
							>
								<button className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium text-slate-700 border border-transparent hover:border-slate-100">
									{user.avatarUrl ? (
										<img
											src={user.avatarUrl}
											alt={user.name}
											className="h-7 w-7 rounded-full object-cover border border-slate-200"
										/>
									) : (
										<div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
											{user.name ? user.name[0].toUpperCase() : "U"}
										</div>
									)}
									<span className="hidden sm:inline">{user.name}</span>
								</button>
								{isDropdownOpen && (
									<div
										className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-1 duration-200
                                        before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2"
									>
										<div className="px-4 py-2 border-b border-slate-100 mb-1">
											<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
												Акаунт
											</p>
											<p className="text-xs text-slate-500 truncate font-medium">
												{user.email}
											</p>
										</div>

										<Link
											href="/profile"
											onClick={() => setIsDropdownOpen(false)}
											className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
										>
											<User className="h-4 w-4 text-slate-400" />
											<span>Особистий кабінет</span>
										</Link>

										{user.role === "MANAGER" && (
											<Link
												href="/manager/dashboard"
												onClick={() => setIsDropdownOpen(false)}
												className="flex items-center space-x-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50/50 transition-colors font-medium"
											>
												<Settings className="h-4 w-4 text-amber-500" />
												<span>Панель менеджера</span>
											</Link>
										)}

										{user.role === "SUPERADMIN" && (
											<Link
												href="/admin/dashboard"
												onClick={() => setIsDropdownOpen(false)}
												className="flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition-colors font-medium"
											>
												<Settings className="h-4 w-4 text-red-500" />
												<span>Панель admin</span>
											</Link>
										)}

										<div className="border-t border-slate-100 mt-1.5 pt-1.5">
											<button
												onClick={() => {
													setIsDropdownOpen(false);
													logout();
													window.location.href = "/";
												}}
												className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
											>
												<LogOut className="h-4 w-4 text-red-500" />
												<span>Вийти з акаунту</span>
											</button>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="hidden md:flex items-center space-x-2">
								<Button
									variant="ghost"
									size="sm"
									asChild
									className="rounded-xl"
								>
									<Link href="/login">Увійти</Link>
								</Button>
								<Button
									size="sm"
									asChild
									className="rounded-xl shadow-md shadow-blue-100"
								>
									<Link href="/register">Реєстрація</Link>
								</Button>
							</div>
						)}
					</div>
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-slate-600 md:hidden hover:bg-slate-100 transition shadow-sm"
						aria-label="Toggle Menu"
					>
						{isMobileMenuOpen ? (
							<X className="h-4 w-4" />
						) : (
							<Menu className="h-4 w-4" />
						)}
					</button>
				</div>
				{isMobileMenuOpen && (
					<div className="md:hidden absolute right-4 top-[68px] w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2.5 z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
						<div className="px-3.5 py-1 mb-1">
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								Навігація
							</p>
						</div>

						<Link
							href="/venues"
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${
								pathname === "/venues" ? "text-blue-600 bg-blue-50/40" : ""
							}`}
						>
							<Layers className="h-4 w-4 text-slate-400" />
							<span>Каталог закладів</span>
						</Link>

						<Link
							href="/news"
							onClick={() => setIsMobileMenuOpen(false)}
							className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors ${
								pathname === "/news" ? "text-blue-600 bg-blue-50/40" : ""
							}`}
						>
							<Newspaper className="h-4 w-4 text-slate-400" />
							<span>Новини та акції</span>
						</Link>

						<Link
							href="/meetups"
							onClick={handleMeetupsClick}
							className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50/60 transition-colors ${
								pathname === "/meetups"
									? "bg-amber-500 text-white hover:bg-amber-500"
									: ""
							}`}
						>
							<Beer className="h-4 w-4 text-amber-500" />
							<span>Пиячок (Зустрічі)</span>
						</Link>

						{!user && (
							<div className="border-t border-slate-100 mt-2 pt-2 px-3 flex flex-col gap-1.5">
								<Button
									variant="outline"
									size="sm"
									className="w-full rounded-xl h-8 text-xs font-semibold border-slate-200"
									onClick={() => {
										setIsMobileMenuOpen(false);
										router.push("/login");
									}}
								>
									Увійти
								</Button>
								<Button
									size="sm"
									className="w-full rounded-xl h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
									onClick={() => {
										setIsMobileMenuOpen(false);
										router.push("/register");
									}}
								>
									Реєстрація
								</Button>
							</div>
						)}

						{user && (
							<>
								<div className="border-t border-slate-100 mt-2 pt-2 px-3.5 pb-1">
									<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
										Кабінет ({user.name})
									</p>
								</div>

								<Link
									href="/profile"
									onClick={() => setIsMobileMenuOpen(false)}
									className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
								>
									<User className="h-4 w-4 text-slate-400" />
									<span>Особистий кабінет</span>
								</Link>

								{user.role === "MANAGER" && (
									<Link
										href="/manager/dashboard"
										onClick={() => setIsMobileMenuOpen(false)}
										className="flex items-center space-x-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50/50 transition-colors font-semibold"
									>
										<Settings className="h-4 w-4 text-amber-500" />
										<span>Панель менеджера</span>
									</Link>
								)}

								{user.role === "SUPERADMIN" && (
									<Link
										href="/admin/dashboard"
										onClick={() => setIsMobileMenuOpen(false)}
										className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors font-semibold"
									>
										<Settings className="h-4 w-4 text-red-500" />
										<span>Панель admin</span>
									</Link>
								)}

								<div className="border-t border-slate-100 mt-1.5 pt-1.5">
									<button
										onClick={() => {
											setIsMobileMenuOpen(false);
											logout();
											window.location.href = "/";
										}}
										className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
									>
										<LogOut className="h-4 w-4 text-red-500" />
										<span>Вийти з акаунту</span>
									</button>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			<SafetyWarningModal
				isOpen={isWarningOpen}
				onClose={() => setIsWarningOpen(false)}
				onConfirm={handleConfirmSafety}
			/>
			{isAuthModalOpen &&
				typeof window !== "undefined" &&
				createPortal(
					<div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 transition-all">
						<div
							className="absolute inset-0 w-full h-full"
							onClick={() => setIsAuthModalOpen(false)}
						></div>
						<div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 relative z-10 text-center space-y-5 my-auto text-slate-900 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
							<button
								onClick={() => setIsAuthModalOpen(false)}
								className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
							>
								<X size={18} />
							</button>

							<div className="mx-auto h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 text-amber-500 mt-2">
								<Heart size={28} className="fill-amber-500 text-amber-500" />
							</div>

							<div className="space-y-2">
								<h3 className="text-xl font-black tracking-tight">
									Потрібна авторизація
								</h3>
								<p className="text-xs text-slate-500 leading-relaxed px-2">
									Створювати компанії, приєднуватися до зустрічей Пиячок,
									залишати відгуки та додавати заклади в обране можуть лише
									авторизовані користувачі.
								</p>
							</div>

							<div className="flex flex-col gap-2 pt-2">
								<Button
									onClick={() => {
										setIsAuthModalOpen(false);
										router.push("/register");
									}}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl gap-2 shadow-md transition"
								>
									Створити акаунт
								</Button>

								<Button
									onClick={() => {
										setIsAuthModalOpen(false);
										router.push("/login");
									}}
									variant="outline"
									className="w-full border-slate-200 hover:bg-slate-50 font-bold h-11 rounded-xl gap-2 transition text-slate-700"
								>
									Увійти
								</Button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</header>
	);
}
