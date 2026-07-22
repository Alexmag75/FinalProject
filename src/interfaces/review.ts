export interface BaseReviewItem {
	id: string;
	text: string;
	rating: number;
	createdAt: string;
}

export interface ReviewItem extends BaseReviewItem {
	venueId?: string;
	user?: {
		name: string;
		email: string;
	};
	venue?: {
		id?: string;
		name: string;
		mainImage?: string;
		type?: string;
	};
}
export interface Review extends BaseReviewItem {
	user: {
		name: string;
		avatar?: string;
	};
}
