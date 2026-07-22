"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { useUiStore } from "@/src/store/useUiStore";
import { reviewSchema, type ReviewInput } from "@/src/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, X } from "lucide-react";

export default function ReviewModal() {
	const queryClient = useQueryClient();
	const { isReviewModalOpen, activeVenueIdForReview, closeReviewModal } =
		useUiStore();
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<ReviewInput>({
		resolver: zodResolver(reviewSchema),
		defaultValues: {
			rating: "5",
			text: "",
			isComplaint: false,
			complaintReason: "",
		},
	});

	const currentRating = watch("rating");
	const isComplaintChecked = watch("isComplaint");

	const { mutate, isPending } = useMutation({
		mutationFn: (data: ReviewInput) =>
			apiFetch(`/venues/${activeVenueIdForReview}/reviews`, {
				method: "POST",
				body: {
					...data,
					rating: parseInt(data.rating),
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["venueDetails", activeVenueIdForReview],
			});
			reset();
			closeReviewModal();
		},
		onError: (error: any) => {
			setServerError(error.message || "Сталася помилка при надсиланні відгуку");
		},
	});

	const onSubmit: SubmitHandler<ReviewInput> = (data) => {
		mutate(data);
	};

	if (!isReviewModalOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
				<button
					onClick={closeReviewModal}
					className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10"
				>
					<X className="h-5 w-5" />
				</button>
				<div className="p-6 pb-2">
					<h3 className="text-xl font-bold text-slate-900">
						Залишити відгук про заклад
					</h3>
				</div>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar"
				>
					{serverError && (
						<div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-100">
							{serverError}
						</div>
					)}
					<div className="space-y-1">
						<label className="text-sm font-medium text-slate-700">
							Ваша оцінка
						</label>
						<div className="flex space-x-2 pt-1">
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									onClick={() => setValue("rating", star.toString())}
									className="transition transform active:scale-95"
								>
									<Star
										className={`h-7 w-7 ${star <= parseInt(currentRating || "5") ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
									/>
								</button>
							))}
						</div>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium text-slate-700">
							Коментар
						</label>
						<textarea
							{...register("text")}
							placeholder="Поділіться враженнями..."
							className="w-full h-24 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
						/>
						{errors.text && (
							<p className="text-xs text-red-500">{errors.text.message}</p>
						)}
					</div>

					<div className="pt-2 border-t border-slate-100">
						<label className="flex items-center space-x-3 text-sm font-medium text-slate-700 cursor-pointer">
							<input
								type="checkbox"
								{...register("isComplaint")}
								className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
							/>
							<span className="text-red-600">
								⚠️ Подати скаргу на обман / невідповідність
							</span>
						</label>
					</div>

					{isComplaintChecked && (
						<div className="space-y-1 animate-fadeIn">
							<label className="text-xs font-semibold text-slate-600">
								Причина скарги (обов'язково)
							</label>
							<Input
								type="text"
								placeholder="Наприклад: ціни в чеку вищі за меню"
								{...register("complaintReason")}
							/>
							{errors.complaintReason && (
								<p className="text-xs text-red-500">
									{errors.complaintReason.message}
								</p>
							)}
						</div>
					)}

					<div className="flex space-x-3 pt-4 border-t border-slate-100 bg-white">
						<Button
							type="button"
							variant="outline"
							onClick={closeReviewModal}
							className="flex-1 min-w-0 px-2 rounded-xl text-sm"
						>
							Скасувати
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							className="flex-1 min-w-0 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm truncate"
						>
							{isPending ? "..." : "Опублікувати"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
