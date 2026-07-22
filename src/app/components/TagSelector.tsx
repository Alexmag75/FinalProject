"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/src/lib/api";
import { Tag, Loader2 } from "lucide-react";
import { TagItem, TagSelectorProps } from "@/src/interfaces/tags";

export default function TagSelector({
	selectedTagIds,
	onChange,
}: TagSelectorProps) {
	const { data, isLoading, isError } = useQuery<{ tags: TagItem[] }>({
		queryKey: ["availableTags"],
		queryFn: () => apiFetch("/tags"),
	});

	const toggleTag = (tagId: string) => {
		if (selectedTagIds.includes(tagId)) {
			onChange(selectedTagIds.filter((id) => id !== tagId));
		} else {
			onChange([...selectedTagIds, tagId]);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center space-x-2 text-sm text-slate-500 py-2">
				<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
				<span>Завантаження доступних тегів...</span>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-xs text-red-500 bg-red-50 p-2 rounded-md border border-red-100">
				Не вдалося завантажити теги з сервера.
			</div>
		);
	}

	const tags = data?.tags || [];

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
				<Tag className="h-4 w-4 text-slate-500" />
				Теги / Категорії закладу
			</label>

			{tags.length === 0 ? (
				<p className="text-xs text-slate-400 italic">
					У базі даних бекенду поки немає створених тегів.
				</p>
			) : (
				<div className="flex flex-wrap gap-2 pt-1">
					{tags.map((tag) => {
						const isSelected = selectedTagIds.includes(tag.id);
						return (
							<button
								key={tag.id}
								type="button"
								onClick={() => toggleTag(tag.id)}
								className={`text-xs font-medium px-3 py-1.5 rounded-full border transition duration-200 select-none ${
									isSelected
										? "bg-blue-600 border-blue-600 text-white shadow-sm"
										: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
								}`}
							>
								#{tag.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
