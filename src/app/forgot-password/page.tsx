"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	forgotPasswordSchema,
	ForgotPasswordInput,
} from "@/src/lib/validations";
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
import Link from "next/link";

export default function ForgotPasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordInput>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (data: ForgotPasswordInput) => {
		setIsLoading(true);
		setError(null);
		setMessage(null);
		try {
			const res = await apiFetch("/auth/forgot-password", {
				method: "POST",
				body: data,
			});
			setMessage(res.message || "Лист надіслано на вашу пошту.");
		} catch (err: any) {
			setError(err.message || "Щось пішло не так");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-[70vh]">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">
						Відновлення пароля
					</CardTitle>
					<CardDescription className="text-center">
						Введіть свій Email, і мы надішлемо вам посилання для зміни пароля
					</CardDescription>
				</CardHeader>
				<CardContent>
					{message ? (
						<div className="p-4 text-center text-green-700 bg-green-50 rounded-md border border-green-200 space-y-3">
							<p>{message}</p>
							<Link
								href="/login"
								className="text-sm text-blue-600 block hover:underline"
							>
								Повернутися до входу
							</Link>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							{error && (
								<div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
									{error}
								</div>
							)}
							<div className="space-y-1">
								<label className="text-sm font-medium">Email</label>
								<Input
									type="email"
									placeholder="example@mail.com"
									{...register("email")}
								/>
								{errors.email && (
									<p className="text-xs text-red-500">{errors.email.message}</p>
								)}
							</div>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Надсилання..." : "Надіслати інструкцію"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
