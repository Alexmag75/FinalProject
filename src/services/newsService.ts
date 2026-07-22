import { NewsItem } from "@/src/interfaces/news";
import { getAuthToken } from "@/src/helpers/auth";

export async function getVenueNews(venueId: string): Promise<NewsItem[]> {
	try {
		const token = getAuthToken();
		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const res = await fetch(`/api/venues/${venueId}/news`, {
			method: "GET",
			headers,
		});

		if (!res.ok) {
			new Error(`Помилка сервера: Status ${res.status}`);
		}

		const data = await res.json();
		return data.news || [];
	} catch (error) {
		console.error(`Ошибка в getVenueNews (venueId: ${venueId}):`, error);
		throw error;
	}
}

export async function deleteVenueNews(
	venueId: string,
	newsId: string,
): Promise<boolean> {
	const token = getAuthToken();

	const res = await fetch(`/api/venues/${venueId}/news/${newsId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(
			errorData.message || "Не вдалося видалити новину з сервера",
		);
	}

	return true;
}
