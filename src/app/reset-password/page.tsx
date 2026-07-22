"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/src/lib/validations";
import { apiFetch } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordInput>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordInput) => {
		if (!token) {
			setError("Токен відсутній або недійсний.");
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			await apiFetch("/auth/reset-password", {
				method: "POST",
				body: {
					token: token,
					newPassword: data.password,
				},
			});

			setSuccess(true);
			setTimeout(() => {
				router.push("/login");
			}, 3000);
		} catch (err: any) {
			setError(err.message || "Не вдалося скинути пароль.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		return (
			<Card className="w-full max-w-md p-6 text-center text-red-600 bg-red-50 border-red-200">
				Помилка: Токен відновления пароля не знайдено або він некоректний.
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="text-2xl text-center">Новий пароль</CardTitle>
				<CardDescription className="text-center">
					Введіть свій новий надійний пароль
				</CardDescription>
			</CardHeader>
			<CardContent>
				{success ? (
					<div className="p-4 text-center text-green-700 bg-green-50 rounded-md border border-green-200">
						Пароль успішно змінено! Перенаправлення на сторінку входу...
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{error && (
							<div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
								{error}
							</div>
						)}

						<div className="space-y-1">
							<label className="text-sm font-medium">Новий пароль</label>
							<Input
								type="password"
								placeholder="••••••••"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-xs text-red-500">
									{errors.password.message}
								</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-sm font-medium">
								Підтвердження пароля
							</label>
							<Input
								type="password"
								placeholder="••••••••"
								{...register("confirmPassword")}
							/>
							{errors.confirmPassword && (
								<p className="text-xs text-red-500">
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Оновлення..." : "Зберегти новий пароль"}
						</Button>
					</form>
				)}
			</CardContent>
		</Card>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="flex justify-center items-center min-h-[70vh]">
			<Suspense fallback={<div>Завантаження сторінки...</div>}>
				<ResetPasswordForm />
			</Suspense>
		</div>
	);
}
