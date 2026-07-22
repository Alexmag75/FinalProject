"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import SafetyWarningModal from "@/src/app/components/SafetyWarningModal";
import { VenueMeetupsSectionProps } from "@/src/interfaces/venue";

export default function VenueMeetupsSection({
	venueId,
	venueName,
}: VenueMeetupsSectionProps) {
	const router = useRouter();
	const [isWarningOpen, setIsWarningOpen] = useState(false);

	const handleButtonClick = () => {
		const isSafetyConfirmed = localStorage.getItem("meetup_safety_confirmed");

		if (isSafetyConfirmed) {
			navigateToMeetups();
		} else {
			setIsWarningOpen(true);
		}
	};
	const handleConfirmSafety = () => {
		localStorage.setItem("meetup_safety_confirmed", "true");
		setIsWarningOpen(false);
		navigateToMeetups();
	};

	const navigateToMeetups = () => {
		router.push(`/meetups?venueId=${venueId}`);
	};

	return (
		<div className="text-xs">
			<div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-2xl border border-amber-500/20 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div className="space-y-0.5">
					<h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
						<Sparkles
							size={16}
							className="text-amber-500 fill-amber-500 animate-pulse"
						/>
						Шукаєш компанію у цьому закладі? 🍻
					</h3>
					<p className="text-[11px] text-slate-500 font-medium">
						Перейди до загальної стрічки «Пиячок», щоб подивитися активні
						пропозиції або створити власну для {venueName}!
					</p>
				</div>

				<Button
					onClick={handleButtonClick}
					className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 h-9 rounded-xl shadow-sm self-stretch sm:self-auto shrink-0 transition"
				>
					Дивитись компанії <ArrowRight size={14} />
				</Button>
			</div>
			<SafetyWarningModal
				isOpen={isWarningOpen}
				onClose={() => setIsWarningOpen(false)}
				onConfirm={handleConfirmSafety}
			/>
		</div>
	);
}
