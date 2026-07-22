"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, LoginInput } from "@/src/lib/validations";
import { apiFetch } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function LoginFormContent() {
	const router = useRouter();
	const { login } = useAuth();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const verifyToken = searchParams.get("verifyToken");

	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		if (!verifyToken) return;

		const verifyEmail = async () => {
			try {
				setStatusMessage("Активація вашого аккаунта...");
				await apiFetch(`/auth/verify?token=${verifyToken}`, { method: "GET" });

				setIsSuccess(true);
				setStatusMessage("Email успішно підтверджено! Тепер ви можете увійти.");
				router.replace("/login");
			} catch (error) {
				setIsSuccess(false);
				setStatusMessage("Помилка верифікації. Можливо, посилання застаріло.");
			}
		};

		void verifyEmail();
	}, [verifyToken, router]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginInput) => {
		setIsLoading(true);
		setServerError(null);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const response = await res.json();

			if (!res.ok) {
				throw new Error(response.message || "Неправильний email або пароль");
			}

			const accessKey = response.accessToken || response.token;
			const refreshKey =
				response.backendRefreshSecretString || response.refreshToken;
			await login(accessKey, refreshKey);
			router.push("/");
		} catch (error: any) {
			setServerError(error.message || "Неправильний email або пароль");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col justify-center items-center min-h-[70vh] p-4">
			{statusMessage && (
				<div
					className="w-full max-w-md p-3 mb-4 text-sm text-center rounded-md border"
					style={{
						backgroundColor: isSuccess ? "#d1fae5" : "#fee2e2",
						borderColor: isSuccess ? "#a7f3d0" : "#fca5a5",
						color: isSuccess ? "#065f46" : "#991b1b",
					}}
				>
					{statusMessage}
				</div>
			)}

			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">Вхід у систему</CardTitle>
					<CardDescription className="text-center">
						Введіть свої дані для доступу до особистого кабінету
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{serverError && (
							<div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
								{serverError}
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

						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-sm font-medium">Пароль</label>
								<Link
									href="/forgot-password"
									className="text-xs text-blue-600 hover:underline"
								>
									Забули пароль?
								</Link>
							</div>
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

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Вхід..." : "Увійти"}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-slate-600">
						Немає аккаунту?{" "}
						<Link href="/register" className="text-blue-600 hover:underline">
							Зареєструватися
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
export default function LoginPage() {
	return (
		<Suspense fallback={<div className="flex justify-center items-center min-h-[70vh]">Завантаження...</div>}>
			<LoginFormContent />
		</Suspense>
	);
}