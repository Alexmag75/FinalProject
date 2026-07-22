"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Check, X, Scale } from "lucide-react";

export default function AgeVerificationModal() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const isVerified = localStorage.getItem("age_verified_18");
		if (!isVerified) {
			setIsOpen(true);
		}
	}, []);

	const handleConfirm = () => {
		localStorage.setItem("age_verified_18", "true");
		setIsOpen(false);
	};

	const handleReject = () => {
		window.location.href = "https://www.google.com";
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 select-none">
			<div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
				<div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-bounce">
					<ShieldAlert size={24} />
				</div>
				<div className="space-y-1">
					<h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
						Необхідне підтвердження віку
					</h2>
					<span className="inline-block bg-rose-500 text-white font-black px-2 py-0.5 rounded text-[10px]">
						18+ ВХІД ОБМЕЖЕНО
					</span>
				</div>
				<p className="text-slate-600 text-[11px] font-medium leading-relaxed">
					Цей додаток містить інформацію про заклади відпочинку, події та акції,
					які можуть бути призначені виключно для повнолітніх осіб.
					<br />
					<span className="font-bold text-slate-800">
						Запускаючи цей додаток, ви підтверджуєте, що вам вже виповнилося 18
						років.
					</span>
				</p>
				<div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 font-medium leading-snug flex gap-2 items-start text-left">
					<Scale size={14} className="text-slate-300 shrink-0 mt-0.5" />
					<span>
						Натискаючи «Підтверджую», ви також повністю погоджуєтесь із нашими{" "}
						<Link
							href="/info/terms"
							target="_blank"
							className="text-slate-600 underline hover:text-slate-900 font-bold"
						>
							Правилами використання
						</Link>{" "}
						та{" "}
						<Link
							href="/info/privacy"
							target="_blank"
							className="text-slate-600 underline hover:text-slate-900 font-bold"
						>
							Політикою конфіденційності
						</Link>
						.
					</span>
				</div>
				<div className="flex gap-2 pt-1">
					<button
						onClick={handleReject}
						className="flex-1 h-8 text-[11px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 rounded-xl transition flex items-center justify-center gap-1"
					>
						<X size={12} /> Мені немає 18
					</button>

					<button
						onClick={handleConfirm}
						className="flex-1 h-8 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1"
					>
						<Check size={12} /> Підтверджую
					</button>
				</div>
			</div>
		</div>
	);
}
