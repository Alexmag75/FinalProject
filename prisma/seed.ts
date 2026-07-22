import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialTags = [
    "кальян",
    "тераса",
    "коктейлі",
    "жива музика",
    "настільні ігри",
    "караоке",
    "веган меню",
    "крафтове пиво",
];

async function main() {
    for (const tagName of initialTags) {
        await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
        });
    }
    console.log("✅ Базові теги успішно завантажені в БД");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());