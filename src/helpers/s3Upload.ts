import { apiFetch } from "@/src/lib/api";
import { getAuthToken } from "@/src/helpers/auth";

export async function uploadFileToS3(
	file: File,
	folder: "venues" | "avatars" | "news" | "temp" = "temp",
): Promise<string> {
	const token = getAuthToken();
	const data = await apiFetch("/upload", {
		method: "POST",
		body: {
			filename: file.name,
			contentType: file.type,
			folder: folder,
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		},
	});

	if (!data?.uploadUrl || !data?.fileUrl) {
		throw new Error(
			"Не вдалося отримати посилання для завантаження від бэкенда",
		);
	}

	const awsResponse = await fetch(data.uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": file.type },
		body: file,
	});

	if (!awsResponse.ok) {
		throw new Error("Помилка при передачі файлу в сховище AWS S3");
	}

	return data.fileUrl;
}
