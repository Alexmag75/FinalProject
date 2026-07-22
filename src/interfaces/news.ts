import { NewsCategory } from "@/src/types/constants";

export interface BaseNews {
	id: string;
	title: string;
	content: string;
	createdAt: string;
}

export interface NewsItem extends BaseNews {
	image: string | null;
	category: NewsCategory;
	venueId: string;
}

export interface FullNewsItem extends BaseNews {
	image: string | null;
	isPromoted: boolean;
	category: NewsCategory;
	venue: {
		id: string;
		name: string;
		mainImage: string;
		address: string;
	};
}

export interface AdminNewsItem extends BaseNews {
	category: NewsCategory;
	isPromoted: boolean;
	image?: string;
	venue: {
		id: string;
		name: string;
		address: string;
		mainImage?: string;
	} | null;
}

export interface NewsVenueItem {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	image?: string;
	category: string;
}
