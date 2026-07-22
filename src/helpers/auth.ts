const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getAuthToken = (): string | null => {
	if (typeof window !== "undefined") {
		return localStorage.getItem(TOKEN_KEY);
	}
	return null;
};

export const getRefreshToken = (): string | null => {
	if (typeof window !== "undefined") {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	}
	return null;
};

export const clearAuthTokens = () => {
	if (typeof window !== "undefined") {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	}
};
