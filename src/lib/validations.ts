import { z } from "zod";

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, "Електронна пошта обов'язкова")
		.email("Некоректний формат Email"),
	password: z.string().min(6, "Пароль має містити не менше 6 символів"),
});

export const registerSchema = z
	.object({
		name: z
			.string()
			.min(2, "Ім'я має містити не менше 2 символів")
			.max(50, "Ім'я занадто довге"),
		email: z
			.string()
			.min(1, "Електронна пошта обов'язкова")
			.email("Некоректний формат Email"),
		password: z.string().min(6, "Пароль має містити не менше 6 символів"),
		confirmPassword: z.string().min(1, "Підтвердження пароля обов'язкове"),
		role: z.enum(["USER", "MANAGER"], {
			error: "Будь ласка, оберіть тип аккаунту",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Паролі не збігаются",
		path: ["confirmPassword"],
	});

export const reviewSchema = z
	.object({
		rating: z.string().min(1, "Будь ласка, оберіть оцінку"),
		text: z.string().max(1000, "Коментар занадто довгий"),
		isComplaint: z.boolean(),
		complaintReason: z.string().optional(),
	})
	.refine(
		(data) =>
			!data.isComplaint ||
			(data.isComplaint &&
				data.complaintReason &&
				data.complaintReason.trim().length > 0),
		{
			message: "Вкажіть причину скарги",
			path: ["complaintReason"],
		},
	);

const phoneRegex = /^(\+380\d{9}|\+380\s\(\d{2}\)\s\d{3}-\d{2}-\d{2})$/;

export const createVenueSchema = z.object({
	name: z.string().min(2, "Назва закладу обовʼязкова (мінімум 2 символи)"),
	type: z.string().min(1, "Оберіть тип закладу"), // <--- ДОДАНО ПОЛЕ ТИПУ
	address: z.string().min(5, "Вкажіть повну адресу закладу"),
	phone: z
		.string()
		.min(1, "Номер телефону обовʼязковий")
		.regex(phoneRegex, "Номер телефону заповнений не повністю або невірно"),

	averageCheck: z.number().min(1, "Вкажіть середній чек закладу"),
	workingHours: z.string().min(1, "Вкажіть часи роботи"),
	hasWifi: z.boolean().default(false),
	hasParking: z.boolean().default(false),
	hasMusic: z.boolean().default(false),
	mainImage: z.string().min(1, "Головне фото закладу обовʼязкове"),
	images: z.array(z.string()).optional(),
});

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, "Електронна пошта обов'язкова")
		.email("Некоректний формат Email"),
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(6, "Пароль має містити не менше 6 символів"),
		confirmPassword: z.string().min(1, "Підтвердження пароля обов'язкове"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Паролі не збігаються",
		path: ["confirmPassword"],
	});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
