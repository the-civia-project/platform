export type TrendingTopic = {
  id: string;
  category: string;
  title: string;
  posts: string;
  /** Post volume index for the last 7 days (oldest → newest). */
  trendSeries: readonly number[];
};

export type NewsItem = {
  headline: string;
  source: string;
};

export const HOME_TRENDING: TrendingTopic[] = [
  {
    id: "parliament-session",
    category: "Politics · Trending",
    title: "Parliament session",
    posts: "12.4K posts",
    trendSeries: [1.1, 2.6, 2.0, 4.4, 3.5, 7.8, 12.4],
  },
  {
    id: "budget-consultation",
    category: "Civic · Trending",
    title: "Budget consultation",
    posts: "8.1K posts",
    trendSeries: [0.9, 2.3, 1.7, 4.0, 3.2, 6.1, 8.1],
  },
  {
    id: "transit-referendum",
    category: "Local · Trending",
    title: "Transit referendum",
    posts: "5.6K posts",
    trendSeries: [0.7, 1.8, 1.3, 3.2, 2.5, 4.4, 5.6],
  },
  {
    id: "neighbourhood-forum",
    category: "Community · Trending",
    title: "Neighbourhood forum",
    posts: "2.3K posts",
    trendSeries: [0.4, 1.0, 0.7, 1.5, 1.1, 1.8, 2.3],
  },
];

export const HOME_NEWS: NewsItem[] = [
  {
    headline: "Committee advances transparency bill after late-night debate",
    source: "Civic Wire · 2h ago",
  },
  {
    headline: "Mayor outlines housing targets for the next fiscal year",
    source: "Metro Daily · 4h ago",
  },
  {
    headline: "Public consultation opens on coastal protection plan",
    source: "Regional Post · 6h ago",
  },
];
