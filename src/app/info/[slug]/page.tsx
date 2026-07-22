"use client";

import React, { useState, useEffect, SyntheticEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	FileText,
	ShieldAlert,
	Edit2,
	Save,
	X,
	Loader2,
	ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAuthToken } from "@/src/helpers/auth";

interface SystemTextData {
	id: string;
	slug: string;
	title: string;
	content: string;
}

export default function SystemInfoPage() {
	const params = useParams();
	const router = useRouter();
	const slug =
		typeof params?.slug === "string" ? params.slug.toLowerCase() : "";
	const [data, setData] = useState<SystemTextData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const fetchSystemText = async () => {
		if (!slug) return;
		setIsLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/system-text?slug=${slug}`);

			if (response.status === 404) {
				setData({
					id: "",
					slug,
					title:
						slug === "privacy"
							? "Політика конфіденційності"
							: slug === "terms"
								? "Правила використання"
								: "Нова сторінка",
					content:
						'Текст для цієї сторінки ще не створено. Натисніть "Редагувати", щоб додати контент.',
				});
			} else if (!response.ok) {
				setError("Не вдалося завантажити інформацію сторінки");
			} else {
				const resData = await response.json();
				setData(resData.systemText);
			}
		} catch (err) {
			console.error(err);
			setError("Помилка з'єднання з сервером");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchSystemText();
		const token = getAuthToken();
		if (token) {
			try {
				const base64Url = token.split(".")[1];
				const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
				const jsonPayload = decodeURIComponent(
					window
						.atob(base64)
						.split("")
						.map((c) => {
							return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
						})
						.join(""),
				);

				const decoded = JSON.parse(jsonPayload);
				if (decoded?.role === "SUPERADMIN") {
					setIsSuperAdmin(true);
				}
			} catch (e) {
				console.error("Помилка декодування токену:", e);
			}
		}
	}, [slug]);

	const startEditing = () => {
		if (!data) return;
		setEditTitle(data.title);
		setEditContent(data.content);
		setIsEditing(true);
	};
	const handleSaveChanges = async (e: SyntheticEvent) => {
		e.preventDefault();
		if (!editTitle.trim() || !editContent.trim()) {
			toast.error("Заголовок та контент не можуть бути порожніми");
			return;
		}
		setIsSaving(true);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/system-text", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					slug,
					title: editTitle,
					content: editContent,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				setData(result.systemText);
				setIsEditing(false);
				toast.success("Сторінку успішно оновлено! 🎉");
			} else {
				toast.error(result.message || "Помилка збереження змін");
			}
		} catch (err) {
			toast.error("Критична помилка при збереженні контенту");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-400 animate-pulse flex flex-col items-center justify-center gap-2">
				<Loader2 size={20} className="animate-spin text-slate-400" />
				<span className="tracking-wide uppercase text-[10px]">
					Завантаження правової інформації...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-md mx-auto my-12 p-6 border border-rose-100 bg-rose-50/40 rounded-2xl text-center space-y-3">
				<ShieldAlert className="text-rose-500 mx-auto" size={32} />
				<h2 className="text-xs font-black text-rose-950 uppercase tracking-wider">
					Помилка завантаження
				</h2>
				<p className="text-[11px] text-rose-700 font-medium leading-relaxed">
					{error}
				</p>
				<Button
					onClick={() => router.push("/")}
					size="sm"
					className="bg-slate-900 hover:bg-slate-800 font-bold text-white text-[10px] h-8 rounded-xl px-4"
				>
					На головну
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-xs font-medium">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold transition-colors"
				>
					<ArrowLeft size={14} /> Назад
				</button>

				{isSuperAdmin && !isEditing && (
					<Button
						onClick={startEditing}
						className="h-8 px-3.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
					>
						<Edit2 size={12} /> Редагувати сторінку (SuperAdmin)
					</Button>
				)}
			</div>
			{isEditing ? (
				<form
					onSubmit={handleSaveChanges}
					className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in fade-in duration-150"
				>
					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-500 block">
							Заголовок сторінки *
						</label>
						<input
							type="text"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm h-10"
							placeholder="Введіть назву, наприклад: Політика конфіденційності"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-[11px] font-bold text-slate-500 block">
							Текст сторінки (Підтримує переноси рядків) *
						</label>
						<textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							rows={18}
							className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 leading-relaxed font-sans resize-y focus:outline-none focus:border-slate-400 shadow-sm"
							placeholder="Введіть повний офіційний text угоди чи правил..."
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsEditing(false)}
							disabled={isSaving}
							className="h-8 text-[11px] font-bold px-3.5 border-slate-200 text-slate-500 rounded-xl bg-white hover:bg-slate-50"
						>
							<X size={12} className="mr-1" /> Скасувати
						</Button>
						<Button
							type="submit"
							disabled={isSaving}
							className="h-8 text-[11px] font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1 shadow-sm"
						>
							{isSaving ? (
								<>
									<Loader2 size={12} className="animate-spin mr-0.5" />
									Збереження...
								</>
							) : (
								<>
									<Save size={12} />
									Зберегти зміни
								</>
							)}
						</Button>
					</div>
				</form>
			) : (
				<article className="space-y-6 bg-white p-6 md:p-8 border border-slate-100 rounded-2xl shadow-sm">
					<header className="space-y-2 border-b border-slate-100 pb-4">
						<div className="text-slate-400 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
							<FileText size={12} className="text-slate-300" /> Інформаційна
							довідка / {data?.slug}
						</div>
						<h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
							{data?.title}
						</h1>
					</header>
					<div className="text-slate-700 font-semibold text-[11px] leading-relaxed break-words whitespace-pre-line space-y-4">
						{data?.content}
					</div>
				</article>
			)}
		</div>
	);
}
