import {
	S3Client,
	CopyObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";

export async function moveFileToPermanent(currentUrl: string): Promise<string> {
	const bucketName = process.env.AWS_BUCKET_NAME!;
	const region = process.env.AWS_REGION!;

	if (!currentUrl) return currentUrl;
	if (currentUrl.includes(`/venues/`)) return currentUrl;
	if (currentUrl.includes(`/temp/`)) {
		const fileKey = currentUrl.split(
			`${bucketName}.s3.${region}.amazonaws.com/`,
		)[1];
		if (!fileKey) return currentUrl;

		const decodedKey = decodeURIComponent(fileKey);
		const newFileKey = decodedKey.replace(/^temp\//, "venues/");
		const permanentUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${newFileKey}`;

		const s3Client = new S3Client({
			region: region,
			credentials: {
				accessKeyId:
					process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY!,
				secretAccessKey:
					process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY!,
			},
		});

		try {
			try {
				await s3Client.send(
					new HeadObjectCommand({ Bucket: bucketName, Key: newFileKey }),
				);
				return permanentUrl;
			} catch {}

			await s3Client.send(
				new CopyObjectCommand({
					Bucket: bucketName,
					CopySource: `${bucketName}/${encodeURIComponent(decodedKey)}`,
					Key: newFileKey,
				}),
			);

			await s3Client.send(
				new DeleteObjectCommand({
					Bucket: bucketName,
					Key: decodedKey,
				}),
			);

			return permanentUrl;
		} catch (error: any) {
			console.error(
				`🚨 КРИТИЧНА ПОМИЛКА S3 ПРИ ПЕРЕНЕСЕННІ (${decodedKey}):`,
				error.name,
			);

			if (error.name === "NoSuchKey") {
				return permanentUrl;
			}

			return currentUrl;
		}
	}

	return currentUrl;
}
