"use client";

import { SyntheticEvent, useState } from "react";
import { Mail, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VenueFeedbackModalProps } from "@/src/interfaces/venue";
import { getAuthToken } from "@/src/helpers/auth";

export default function VenueFeedbackModal({
	venueId,
	venueName,
	isOpen,
	onClose,
}: VenueFeedbackModalProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [category, setCategory] = useState("QUESTION");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [statusMessage, setStatusMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	if (!isOpen) return null;

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setStatusMessage(null);

		try {
			const token = getAuthToken();

			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					name,
					email,
					category,
					message,
					venueId,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setStatusMessage({
					type: "success",
					text: data.message || "Звернення успішно надіслано!",
				});
				setMessage("");
				setTimeout(() => {
					onClose();
					setStatusMessage(null);
				}, 2000);
			} else {
				setStatusMessage({
					type: "error",
					text: data.message || "Щось пішло не так",
				});
			}
		} catch (error) {
			console.error(error);
			setStatusMessage({ type: "error", text: "Помилка з'єднання з сервером" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-xs">
			<div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
				<div className="bg-slate-900 text-white p-4 flex justify-between items-center">
					<div className="space-y-0.5">
						<h3 className="text-sm font-black flex items-center gap-1.5">
							<Mail size={16} className="text-amber-400" /> Написати менеджеру
						</h3>
						<p className="text-[10px] text-slate-400 font-medium truncate max-w-[280px]">
							Звернення щодо закладу: {venueName}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
					>
						<X size={16} />
					</button>
				</div>
				<form
					onSubmit={handleSubmit}
					className="p-4 space-y-4 font-medium text-slate-700"
				>
					{statusMessage && (
						<div
							className={`p-3 rounded-xl border text-[11px] font-bold ${
								statusMessage.type === "success"
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: "bg-rose-50 text-rose-700 border-rose-200"
							}`}
						>
							{statusMessage.text}
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-slate-500 font-bold">Ваше ім'я *</label>
							<input
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Олександр"
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition font-medium"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-slate-500 font-bold">Ваш Email *</label>
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@mail.com"
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition font-medium"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-slate-500 font-bold">Тип звернення *</label>
						<select
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-amber-500 transition font-bold text-slate-800"
						>
							<option value="QUESTION">Запитання / Бронювання</option>
							<option value="COMPLAINT">Жалоба на заклад</option>
							<option value="FEEDBACK">Відгук / Пропозиція</option>
						</select>
					</div>
					<div className="space-y-1">
						<label className="text-slate-500 font-bold">
							Текст повідомлення *
						</label>
						<textarea
							required
							rows={4}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Опишіть ваше запитання або скаргу стосовно цього закладу..."
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition font-medium resize-none leading-relaxed"
						/>
					</div>
					<div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="h-9 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
						>
							Скасувати
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="h-9 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white gap-1.5 transition shadow-sm shrink-0"
						>
							{isSubmitting ? "Надсилання..." : "Надіслати"} <Send size={12} />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
