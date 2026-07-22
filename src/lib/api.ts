import { getAuthToken, getRefreshToken } from "@/src/helpers/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface RequestOptions extends RequestInit {
	body?: any;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
	refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
	refreshSubscribers.forEach((cb) => cb(token));
	refreshSubscribers = [];
};

export async function apiFetch(
	endpoint: string,
	options: RequestOptions = {},
): Promise<any> {
	const url = `${BASE_URL}${endpoint}`;
	const headers = new Headers(options.headers);

	if (options.body && !(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	if (typeof window !== "undefined" && !headers.has("Authorization")) {
		const token = getAuthToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
	}

	const config: RequestInit = {
		...options,
		headers,
		body:
			options.body && !(options.body instanceof FormData)
				? JSON.stringify(options.body)
				: options.body,
	};

	const response = await fetch(url, config);

	if (
		(response.status === 401 || response.status === 403) &&
		typeof window !== "undefined"
	) {
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				subscribeTokenRefresh((newToken) => {
					headers.set("Authorization", `Bearer ${newToken}`);
					fetch(url, { ...config, headers })
						.then(async (res) => {
							const data = await res.json().catch(() => ({}));
							if (!res.ok)
								reject(new Error(data.message || `Помилка: ${res.status}`));
							resolve(data);
						})
						.catch(reject);
				});
			});
		}

		const savedRefreshToken = getRefreshToken();

		if (savedRefreshToken && savedRefreshToken !== "undefined") {
			isRefreshing = true;
			try {
				const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken: savedRefreshToken }),
					credentials: "include",
				});

				if (refreshResponse.ok) {
					const refreshData = await refreshResponse.json();
					const newAccess = refreshData.accessToken;
					const newRefresh =
						refreshData.backendRefreshSecretString || refreshData.refreshToken;

					if (newAccess && newRefresh) {
						localStorage.setItem("token", newAccess);
						localStorage.setItem("refreshToken", newRefresh);

						isRefreshing = false;
						onTokenRefreshed(newAccess);
						headers.set("Authorization", `Bearer ${newAccess}`);

						const retryResponse = await fetch(url, { ...config, headers });
						const retryData = await retryResponse.json().catch(() => ({}));
						if (!retryResponse.ok) {
							new Error(
								retryData.message || `Помилка: ${retryResponse.status}`,
							);
						}
						return retryData;
					}
				}
			} catch (refreshError: any) {
				console.error("[apiFetch] Помилка при оновленні токена:", refreshError);
			} finally {
				isRefreshing = false;
				refreshSubscribers = [];
			}
		}

		const errData = await response.json().catch(() => ({}));
		if (errData.message) {
			throw new Error(errData.message);
		}

		localStorage.removeItem("token");
		localStorage.removeItem("refreshToken");
		if (window.location.pathname !== "/login") {
			window.location.href = "/login";
		}
		throw new Error("Сесія застаріла. Будь ласка, увійдіть знову.");
	}

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.message || "Щось пішло не так");
	}

	return data;
}
