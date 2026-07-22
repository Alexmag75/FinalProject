import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.gmail.com",
	port: parseInt(process.env.SMTP_PORT || "465"),
	secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT,
	auth: {
		user: smtpUser,
		pass: smtpPassword,
	},
} as any);

const fromSender = `Piyachok <${process.env.SMTP_FROM || smtpUser}>`;

export async function sendVerificationEmail(to: string, token: string) {
	const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/login?verifyToken=${token}`;

	const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1a1a1a; text-align: center;">Добро пожаловать в команду! 🎉</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
       Дякуємо за реєстрацію у програмі Piyachok. Щоб активувати ваш обліковий запис, будь ласка, підтвердьте вашу адресу електронної пошти.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          Подтвердить Email
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
        Якщо кнопка вище не працює, скопіюйте це посилання у браузер:
      </p>
      <p style="font-size: 13px; color: #2563eb; word-break: break-all; background: #f4f4f5; padding: 10px; border-radius: 6px;">
        ${verificationLink}
      </p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="font-size: 12px; color: #a1a1aa; text-align: center;">
        Посилання дійсне протягом 24 годин.
      </p>
    </div>  `;

	await transporter.sendMail({
		from: fromSender,
		to,
		subject: "Підтвердження реєстрації | Piyachok",
		html: htmlContent,
	});
}
export async function sendPasswordResetEmail(to: string, token: string) {
	const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

	const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1a1a1a; text-align: center;">Скидання пароля в Piyachok 🍺</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
        Ви отримали цей лист, тому що запросили скидання пароля для вашого облікового запису.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
         Скинути пароль
        </a>
      </div>
      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
        Якщо ви не вимагали скидання, просто проігноруйте цей лист — ваш старий пароль залишиться в безпеці.
      </p>
      <p style="font-size: 13px; color: #ef4444; word-break: break-all; background: #f4f4f5; padding: 10px; border-radius: 6px;">
        ${resetLink}
      </p>
    </div>
  `;

	await transporter.sendMail({
		from: fromSender,
		to,
		subject: "Відновлення доступу | Piyachok",
		html: htmlContent,
	});
}

export async function sendFeedbackEmail(data: {
	name: string;
	email: string;
	category: string;
	message: string;
	venueName?: string;
	userIdText?: string;
}) {
	const { name, email, category, message, venueName, userIdText } = data;

	const categoryLabels: Record<string, string> = {
		COMPLAINT: "🚨 Скарга",
		FEEDBACK: "💬 Відгук",
		SUGGESTION: "💡 Пропозиція",
		QUESTION: "❓ Запитання",
	};

	const displayCategory = categoryLabels[category.toUpperCase()] || category;

	const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #ef4444; text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 12px;">
         Нове звернення | Piyachok Support
      </h2>
      <p style="font-size: 16px; color: #1a1a1a;"><strong>Категорія:</strong> 
        <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-weight: bold; color: #374151;">${displayCategory}</span>
      </p>
      <p style="color: #4a4a4a; font-size: 14px; margin: 6px 0;"><strong>Відправник:</strong> ${name}</p>
      <p style="color: #4a4a4a; font-size: 14px; margin: 6px 0;"><strong>Email для зв'язку:</strong> <a href="mailto:${email}">${email}</a></p>
      <p style="color: #4a4a4a; font-size: 14px; margin: 6px 0;"><strong>Пов'язаний заклад:</strong> ${venueName || "Не вказано"}</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 6px;">
        <h4 style="margin: 0 0 8px 0; color: #1a1a1a;">Текст повідомлення:</h4>
        <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.5;">${message}</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
     
      <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0 0 4px 0;">
        Службові дані: ${userIdText || "Гість (не авторизований)"}
      </p>
      <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0;">
        Система автоматичних сповіщень Piyachok API.
      </p>
    </div>
  `;

	await transporter.sendMail({
		from: fromSender,
		to: smtpUser,
		subject: `[${displayCategory}] Звернення від ${name} | Piyachok`,
		html: htmlContent,
	});
}
