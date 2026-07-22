"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VenueOption } from "@/src/interfaces/venue";
import { MeetupModalProps } from "@/src/interfaces/meetup";
import { getAuthToken } from "@/src/helpers/auth";
import React, { SyntheticEvent } from "react";

export default function MeetupModal({
	isOpen,
	onClose,
	venueId,
	venueName,
	onSuccess,
}: MeetupModalProps) {
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [description, setDescription] = useState("");
	const [contactInfo, setContactInfo] = useState("");
	const [gender, setGender] = useState<"ANY" | "MALE" | "FEMALE">("ANY");
	const [whoPays, setWhoPays] = useState<"EACH_OWN" | "I_PAY" | "YOU_PAY">(
		"EACH_OWN",
	);
	const [companySize, setCompanySize] = useState("2");
	const [budget, setBudget] = useState("");
	const [selectedVenueId, setSelectedVenueId] = useState(venueId || "");
	const [venues, setVenues] = useState<VenueOption[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen && !venueId) {
			const fetchVenues = async () => {
				try {
					const response = await fetch("/api/venues?status=APPROVED");
					if (response.ok) {
						const data = await response.json();
						setVenues(Array.isArray(data) ? data : data.venues || []);
					}
				} catch (err) {
					console.error("Помилка завантаження закладів:", err);
				}
			};
			void fetchVenues();
		}
	}, [isOpen, venueId]);

	useEffect(() => {
		if (venueId) setSelectedVenueId(venueId);
	}, [venueId]);

	if (!isOpen) return null;

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		if (!selectedVenueId) {
			toast.error("Будь ласка, оберіть заклад для зустрічі");
			return;
		}
		setIsSubmitting(true);
		try {
			const token = getAuthToken();
			const response = await fetch("/api/meetups", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					venueId: selectedVenueId,
					date,
					time,
					description,
					contactInfo,
					gender,
					companySize: parseInt(companySize) || 2,
					whoPays,
					budget: parseInt(budget) || 0,
				}),
				credentials: "include",
			});

			const resData = await response.json();
			if (!response.ok) new Error(resData.message || "Щось пішло не так");

			toast.success("Зустріч «Пиячок» успішно створено! 🍻");
			if (onSuccess) onSuccess();
			onClose();
		} catch (err: any) {
			toast.error(err.message || "Помилка при створенні зустрічі");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
			<div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
				<div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<Sparkles size={18} className="text-amber-500 fill-amber-500" />
						<div>
							<h3 className="text-sm font-bold text-slate-800">
								Створити зустріч «Пиячок»
							</h3>
							<p className="text-[11px] text-slate-500 font-medium truncate max-w-[280px]">
								{venueName
									? `Заклад: ${venueName}`
									: "Оберіть місце зустрічі у формі"}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition"
					>
						<X size={18} />
					</button>
				</div>
				<form
					onSubmit={handleSubmit}
					className="p-5 space-y-4 overflow-y-auto flex-1 font-medium"
				>
					{!venueId && (
						<div className="space-y-1">
							<label className="font-bold text-slate-700">
								🏢 Оберіть заклад *
							</label>
							<select
								required
								value={selectedVenueId}
								onChange={(e) => setSelectedVenueId(e.target.value)}
								className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg p-2 h-9 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none cursor-pointer font-bold"
							>
								<option value="">-- Натисніть, щоб обрати заклад --</option>
								{venues.map((v) => (
									<option key={v.id} value={v.id}>
										{v.name}
									</option>
								))}
							</select>
						</div>
					)}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="font-bold text-slate-700 flex items-center gap-1">
								📅 Обрати дату *
							</label>
							<Input
								type="date"
								required
								value={date}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setDate(e.target.value)}
								className="text-xs h-9 font-semibold"
							/>
						</div>
						<div className="space-y-1">
							<label className="font-bold text-slate-700 flex items-center gap-1">
								⏰ Обрати час *
							</label>
							<Input
								type="time"
								required
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="text-xs h-9 font-semibold"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<label className="font-bold text-slate-700 flex items-center gap-1">
							🧔 Кого ви шукаєте?
						</label>
						<div className="grid grid-cols-3 gap-2">
							{(["ANY", "MALE", "FEMALE"] as const).map((g) => (
								<button
									key={g}
									type="button"
									onClick={() => setGender(g)}
									className={`py-2 px-3 rounded-lg border font-bold transition text-center ${gender === g ? "bg-amber-500 border-amber-500 text-white shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
								>
									{g === "ANY"
										? "🌍 Будь-хто"
										: g === "MALE"
											? "🧔 Хлопці"
											: "👩 Дівчата"}
								</button>
							))}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="font-bold text-slate-700 flex items-center gap-1">
								👥 Кількість людей *
							</label>
							<Input
								type="number"
								min="1"
								max="20"
								required
								value={companySize}
								onChange={(e) => setCompanySize(e.target.value)}
								className="text-xs h-9 font-semibold"
							/>
						</div>
						<div className="space-y-1">
							<label className="font-bold text-slate-700 flex items-center gap-1">
								💰 Бажана сума (грн) *
							</label>
							<Input
								type="number"
								min="0"
								required
								value={budget}
								onChange={(e) => setBudget(e.target.value)}
								className="text-xs h-9 font-semibold"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<label className="font-bold text-slate-700 flex items-center gap-1">
							💳 Хто оплачує рахунок?
						</label>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
							{(["EACH_OWN", "I_PAY", "YOU_PAY"] as const).map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => setWhoPays(p)}
									className={`py-2 px-1.5 rounded-lg border font-bold transition text-center text-[11px] ${whoPays === p ? "bg-amber-500 border-amber-500 text-white shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
								>
									{p === "EACH_OWN"
										? "💳 Кожен за себе"
										: p === "I_PAY"
											? "🎁 Я пригощаю"
											: "🥂 Мене пригощають"}
								</button>
							))}
						</div>
					</div>
					<div className="space-y-1">
						<label className="font-bold text-slate-700 flex items-center gap-1">
							💬 Контакти для звʼязку *
						</label>
						<Input
							type="text"
							required
							value={contactInfo}
							onChange={(e) => setContactInfo(e.target.value)}
							placeholder="Telegram-нік (@username) або № телефону"
							className="text-xs h-9 font-semibold"
						/>
					</div>
					<div className="space-y-1">
						<label className="font-bold text-slate-700">
							Опис мети зустрічі
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Наприклад: Зібратися подивитися футбол..."
							className="w-full min-h-[75px] bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition outline-none resize-none font-semibold"
						/>
					</div>

					<div className="pt-2">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 h-10 rounded-xl shadow-sm transition inline-flex items-center justify-center"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
									Створення...
								</>
							) : (
								"🍻 Опублікувати пропозицію"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
