export interface TagItem {
	id: string;
	name: string;
}

export interface TagSelectorProps {
	selectedTagIds: string[];
	onChange: (tags: string[]) => void;
}
