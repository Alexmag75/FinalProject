import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifyAuth } from "@/lib/auth";

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY!,
		secretAccessKey:
			process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY!,
	},
});

export async function POST(request: Request) {
	try {
		const user = await verifyAuth(request);
		if (!user) {
			return NextResponse.json(
				{ message: "Неавторизований доступ" },
				{ status: 401 },
			);
		}

		let filename = "";
		let contentType = "";
		let folder = "temp";

		const contentTypeHeader = request.headers.get("content-type") || "";

		if (contentTypeHeader.includes("application/json")) {
			const body = await request.json();
			filename = body.filename;
			contentType = body.contentType;
			if (body.folder) folder = body.folder;
		} else {
			const formData = await request.formData();
			const file = formData.get("file") as File | null;

			if (file && typeof file !== "string") {
				filename = file.name;
				contentType = file.type;
			} else {
				filename = (formData.get("filename") ||
					formData.get("name") ||
					"") as string;
				contentType = (formData.get("contentType") ||
					formData.get("type") ||
					"") as string;
			}
			const formFolder = formData.get("folder") as string | null;
			if (formFolder) folder = formFolder;
		}
		if (!filename || !contentType) {
			return NextResponse.json(
				{
					message: `Відсутні дані про файл. Отримано: filename=${filename}, contentType=${contentType}`,
				},
				{ status: 400 },
			);
		}

		const cleanFileName = filename
			.replace(/^temp\//, "")
			.replace(/^venues\//, "")
			.replace(/^avatars\//, "")
			.replace(/^news\//, "");

		const fileKey = `${folder}/${Date.now()}-${cleanFileName}`;

		const command = new PutObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: fileKey,
			ContentType: contentType,
		});

		const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
		const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

		return NextResponse.json({ uploadUrl, fileUrl }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Помилка генерації посилання для завантаження" },
			{ status: 500 },
		);
	}
}
