export interface CommentItem {
	id: string;
	text: string;
	rating?: number;
	createdAt: string;
	venue: {
		id: string;
		name: string;
	};
}
