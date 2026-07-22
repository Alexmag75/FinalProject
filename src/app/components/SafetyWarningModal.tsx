"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

interface SafetyWarningModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export default function SafetyWarningModal({
	isOpen,
	onClose,
	onConfirm,
}: SafetyWarningModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 select-none">
			<div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
				<div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-pulse">
					<AlertTriangle size={24} />
				</div>
				<div className="space-y-1">
					<h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
						Попередження про безпеку
					</h3>
					<span className="inline-block bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
						Важливе застереження
					</span>
				</div>
				<div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left space-y-2">
					<p className="text-slate-700 text-[11px] font-semibold leading-relaxed">
						Адміністрація «Пиячка» застерігає вас бути максимально обережними!
					</p>
					<p className="text-slate-600 text-[11px] font-medium leading-relaxed">
						Наполегливо рекомендуємо{" "}
						<span className="font-bold text-rose-600">
							не зустрічатися з незнайомими людьми в небезпечних, безлюдних чи
							невідомих вам місцях
						</span>
						.
					</p>
					<p className="text-slate-500 text-[10px] leading-relaxed">
						Організовуйте зустрічі виключно в перевірених громадських закладах
						(барах, пабах, клубах), які представлені на нашій платформі, та
						завжди повідомляйте близьким про своє місцезнаходження.
					</p>
				</div>
				<div className="flex gap-2 pt-1">
					<button
						onClick={onClose}
						className="flex-1 h-8 text-[11px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 rounded-xl transition"
					>
						Скасувати
					</button>

					<button
						onClick={onConfirm}
						className="flex-1 h-8 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
					>
						<CheckCircle2 size={12} /> Я розумію ризики
					</button>
				</div>
			</div>
		</div>
	);
}
