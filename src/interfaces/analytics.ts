interface ChartItem {
	date: string;
	count: number;
}

export interface AnalyticsData {
	periodDays: number;
	totalViews: number;
	chartData: ChartItem[];
}
