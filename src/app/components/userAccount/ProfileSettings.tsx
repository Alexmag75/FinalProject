"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Mail, Phone } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { ProfileFormData } from "@/src/interfaces/profile";

export default function ProfileSettings() {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<ProfileFormData>();

	const { data, isLoading, error } = useQuery({
		queryKey: ["currentUserProfile"],
		queryFn: async () => {
			const res = await apiFetch("/user/me");
			return res.user;
		},
	});

	useEffect(() => {
		if (data) {
			setValue("name", data.name || "");
			setValue("email", data.email || "");
			setValue("phoneNumber", data.phoneNumber || "");
			setValue("avatarUrl", data.avatarUrl || "");
		}
	}, [data, setValue]);

	const updateProfileMutation = useMutation({
		mutationFn: async (formData: ProfileFormData) => {
			return await apiFetch("/user/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: formData as any,
			});
		},
		onSuccess: (responseData) => {
			toast.success(responseData.message || "Профіль успішно оновлено!");
			void queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
		},
		onError: (err: any) => {
			toast.error(err.message || "Помилка при збереженні профілю");
		},
	});

	const executeDeleteAccount = () => {
		toast.info("Запит на видалення надіслано (заглушка)");
	};

	const handleDeleteAccount = () => {
		toast("Ви впевнені, що хочете НАВЖДИ видалити свій профіль?", {
			description: "Цю дію неможливо скасувати. Всі ваші дані будуть стерті.",
			action: {
				label: "Видалити",
				onClick: () => executeDeleteAccount(),
			},
			duration: 6000,
		});
	};

	const onSubmit = (formData: ProfileFormData) => {
		updateProfileMutation.mutate(formData);
	};

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100 text-center">
				Не вдалося завантажити дані профілю. Спробуйте перезавантажити сторінку.
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-xl text-xs font-medium">
			<div>
				<h2 className="text-lg font-bold text-slate-900">
					Редагування профілю
				</h2>
				<p className="text-[11px] text-slate-500">
					Оновіть свої особисті дані або керуйте акаунтом
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Ваше ім'я
					</label>
					<div className="relative">
						<User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
						<Input
							type="text"
							className="pl-10 rounded-xl text-xs h-10 font-semibold"
							placeholder="Олександр"
							{...register("name", { required: "Ім'я обов'язкове" })}
						/>
					</div>
					{errors.name && (
						<p className="text-[11px] font-bold text-red-500 mt-0.5">
							{errors.name.message}
						</p>
					)}
				</div>
				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Email адреса
					</label>
					<div className="relative">
						<Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
						<Input
							type="email"
							className="pl-10 rounded-xl text-xs h-10 font-semibold"
							placeholder="example@mail.com"
							{...register("email", { required: "Email обов'язковий" })}
						/>
					</div>
					{errors.email && (
						<p className="text-[11px] font-bold text-red-500 mt-0.5">
							{errors.email.message}
						</p>
					)}
				</div>
				<div className="space-y-1">
					<label className="text-[11px] font-bold text-slate-600">
						Номер телефону
					</label>
					<div className="relative">
						<Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
						<Input
							type="text"
							className="pl-10 rounded-xl text-xs h-10 font-semibold"
							placeholder="+380XXXXXXXXX"
							{...register("phoneNumber")}
						/>
					</div>
				</div>
				<div className="pt-2">
					<Button
						type="submit"
						disabled={updateProfileMutation.isPending}
						className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm px-6 font-bold h-10 inline-flex items-center"
					>
						{updateProfileMutation.isPending ? (
							<>
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								Збереження...
							</>
						) : (
							"Зберегти зміни"
						)}
					</Button>
				</div>
			</form>
			<div className="pt-6 border-t border-slate-200">
				<div className="bg-red-50/40 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">
							Видалення профілю
						</h4>
						<p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
							Після видаления вашого акаунту всі ваші дані, коментарі та обрані
							заклади будуть безповоротно стерті з бази даних системи.
						</p>
					</div>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDeleteAccount}
						className="rounded-xl text-xs font-bold shrink-0 h-9 px-4"
					>
						Видалити акаунт
					</Button>
				</div>
			</div>
		</div>
	);
}
