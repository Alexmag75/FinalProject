"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "@/src/lib/api";
import { User } from "@/src/interfaces/user";
import { getAuthToken, getRefreshToken } from "@/src/helpers/auth";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (accessToken: string, refreshToken: string) => Promise<void>;
	logout: () => void;
	checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const checkAuth = async (passedToken?: string) => {
		try {
			const token = passedToken || getAuthToken();

			if (!token) {
				setUser(null);
				setIsLoading(false);
				return;
			}

			try {
				const data = await apiFetch("/user/me", {
					headers: { Authorization: `Bearer ${token}` },
				});
				setUser(data.user);
			} catch (error: any) {
				console.warn("Access токен недійсний, пробуємо оновити...");

				const savedRefreshToken = getRefreshToken();

				if (!savedRefreshToken || savedRefreshToken === "undefined") {
					new Error("Refresh токен відсутній");
				}

				const refreshResponse = await fetch("/api/auth/refresh", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken: savedRefreshToken }),
				});

				if (refreshResponse.ok) {
					const refreshData = await refreshResponse.json();

					if (refreshData.accessToken && refreshData.refreshToken) {
						localStorage.setItem("token", refreshData.accessToken);
						localStorage.setItem("refreshToken", refreshData.refreshToken);

						const retryData = await apiFetch("/user/me", {
							headers: { Authorization: `Bearer ${refreshData.accessToken}` },
						});
						setUser(retryData.user);
					} else {
						new Error("Некоректна відповідь сервера ротації");
					}
				} else {
					new Error("Сервер відхилив Refresh токен");
				}
			}
		} catch (error: any) {
			console.warn("Access токен недійсний, пробуємо оновити...");

			const savedRefreshToken = getRefreshToken();

			if (!savedRefreshToken || savedRefreshToken === "undefined") {
				throw new Error("Refresh токен відсутній");
			}

			const refreshResponse = await fetch("/api/auth/refresh", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken: savedRefreshToken }),
			});

			if (refreshResponse.ok) {
				const refreshData = await refreshResponse.json();
				const newAccess = refreshData.accessToken;
				const newRefresh =
					refreshData.backendRefreshSecretString || refreshData.refreshToken;

				if (newAccess && newRefresh) {
					localStorage.setItem("token", newAccess);
					localStorage.setItem("refreshToken", newRefresh);

					const retryData = await apiFetch("/user/me", {
						headers: { Authorization: `Bearer ${newAccess}` },
					});
					setUser(retryData.user);
				} else {
					throw new Error(
						"Некоректна відповідь сервера ротації (відсутні токени)",
					);
				}
			} else {
				throw new Error("Сервер відхилив Refresh токен");
			}
		}
	};

	useEffect(() => {
		void checkAuth();
	}, []);

	const login = async (accessToken: string, refreshToken: string) => {
		if (!accessToken || accessToken === "undefined" || !refreshToken) {
			console.error(
				"Критическая ошибка: Попытка залогиниться с некорректными токенами!",
			);
			return;
		}

		localStorage.setItem("token", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		setIsLoading(true);
		await checkAuth();
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("refreshToken");
		setUser(null);
	};
	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth должен использоваться внутри AuthProvider");
	}
	return context;
}
