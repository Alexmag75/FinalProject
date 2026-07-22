"use client";

import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";

interface VenueTagsProps {
	tags?: string[] | { id: string; name: string }[];
}

export default function VenueTags({ tags = [] }: VenueTagsProps) {
	const router = useRouter();
	const finalTags =
		!tags || tags.length === 0
			? [
					{ id: "1", name: "Затишно" },
					{ id: "2", name: "Смачно" },
				]
			: tags;

	const handleTagClick = (tagName: string) => {
		router.push(`/venues?tag=${encodeURIComponent(tagName)}`);
	};

	return (
		<div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 text-xs w-full block">
			<h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
				<Tag size={14} className="text-amber-500 fill-amber-500/20" />
				Теги закладу
			</h3>

			<div className="flex flex-wrap gap-1.5">
				{finalTags.map((tag, index) => {
					const name = typeof tag === "string" ? tag : tag?.name;
					if (!name) return null;

					return (
						<button
							key={tag && typeof tag === "object" ? tag.id : index}
							type="button"
							onClick={() => handleTagClick(name)}
							className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-500/10 border border-slate-200 hover:border-amber-500/30 text-slate-600 hover:text-amber-600 font-bold text-[10px] transition-all cursor-pointer shadow-sm"
						>
							#{name}
						</button>
					);
				})}
			</div>
		</div>
	);
}
