"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, RegisterInput } from "@/src/lib/validations";
import { apiFetch } from "@/src/lib/api";
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

export default function RegisterPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			role: "USER",
		},
	});

	const currentRole = watch("role");

	const onSubmit = async (data: RegisterInput) => {
		setIsLoading(true);
		setServerError(null);
		try {
			await apiFetch("/auth/register", {
				method: "POST",
				body: {
					name: data.name,
					email: data.email,
					password: data.password,
					role: data.role,
				},
			});

			setSuccess(true);
			setTimeout(() => {
				router.push("/login");
			}, 2000);
		} catch (error: any) {
			setServerError(error.message || "Цей Email вже використовується");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-[70vh]">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">Реєстрація</CardTitle>
					<CardDescription className="text-center">
						Створіть аккаунт для пошуку або додавання закладів
					</CardDescription>
				</CardHeader>
				<CardContent>
					{success ? (
						<div className="p-4 text-center text-green-700 bg-green-50 rounded-md border border-green-200">
							Реєстрація успішна! Будь ласка, перевірте пошту для
							підтвердження...
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							{serverError && (
								<div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
									{serverError}
								</div>
							)}
							<div className="space-y-2">
								<label className="text-sm font-medium block text-center">
									Хто ви?
								</label>
								<div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
									<Button
										type="button"
										variant={currentRole === "USER" ? "default" : "ghost"}
										className="w-full text-xs sm:text-sm"
										onClick={() => setValue("role", "USER")}
									>
										Відпочиваючий (Юзер)
									</Button>
									<Button
										type="button"
										variant={currentRole === "MANAGER" ? "default" : "ghost"}
										className="w-full text-xs sm:text-sm"
										onClick={() => setValue("role", "MANAGER")}
									>
										Власник закладу
									</Button>
								</div>
								{errors.role && (
									<p className="text-xs text-red-500 text-center">
										{errors.role.message}
									</p>
								)}
							</div>

							<div className="space-y-1">
								<label className="text-sm font-medium">Ім'я</label>
								<Input type="text" placeholder="Іван" {...register("name")} />
								{errors.name && (
									<p className="text-xs text-red-500">{errors.name.message}</p>
								)}
							</div>

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
								<label className="text-sm font-medium">Пароль</label>
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
								{isLoading ? "Створення..." : "Зареєструватися"}
							</Button>
						</form>
					)}
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-slate-600">
						Вже є аккаунт?{" "}
						<Link href="/login" className="text-blue-600 hover:underline">
							Увійти
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
