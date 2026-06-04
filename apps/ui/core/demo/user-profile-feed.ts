import { useCallback, useMemo, useRef, useState } from "react";
import type { FeedItem } from "../../components/Feed";
import type { ProfileProps } from "../../components/Profile";
import type {
  ResolveMediaThumbnailSource,
  UserProfileMediaItem,
  UserProfileTabConfig,
} from "../../components/UserProfile";
import { randomAvatar } from "./random-avatar";

const POST_BODIES: readonly string[] = [
  "Two weeks in on the new editorial pipeline -- the layout team got their first end-to-end preview run today and it landed. Writing up the retro tomorrow.",
  "Walking the Bucegi plateau in the fog this morning. The visibility dropped to twenty metres for the saddle stretch and I didn't see another hiker for an hour.",
  "Notebook scribbles from the strategy offsite. Three frameworks worth keeping, four worth throwing out, one worth a longer post.",
  "Released v0.5 of the colour-tokens package. Picker now exports the flat WCAG-AA array alongside the indexed tree -- two views of the same data, picked at the import site.",
  "Long bus ride. Re-reading the second draft of the comms doc and it still doesn't say the thing it needs to say in the first paragraph. Cutting half of it.",
  "First snow on Tâmpa this morning. Hiked up before sunrise and got the light I've been chasing for a month.",
];

const REPLY_BODIES: readonly string[] = [
  "Strongly agree -- the cost driver was the validation in the producer, not the fuzzy match. We saw the same thing.",
  "Counterpoint: structured logging would have caught it earlier, but the alerting rule was the part that needed fixing.",
  "This is the post-mortem I've been waiting for -- point 2 alone is worth the whole read.",
  "Same lesson on our side. Took us a quarter to find it.",
  "Beautifully put. Quoting this in next week's review.",
  "Curious how the producer-side validation cost shows up in the new traces.",
];

const ORIGINAL_BODIES: readonly string[] = [
  "Spent the afternoon rewriting our notification pipeline. Three lessons: validation belongs on the consumer, dedupe on (user_id, payload_hash) was 40% cheaper than fuzzy match, and structured logging would have caught it a week earlier.",
  "Eight months in: hire for slope not intercept, have the boring 1:1 every week even when nothing is wrong, write down the decision you didn't make.",
  "We finally killed the legacy bridge service. Two years of small migrations, one final week of cut-over. The graph is so much cleaner now.",
  "Two views of the same palette: an indexed tree for typed runtime lookup, and a flat array of WCAG-AA pairs for picker UIs.",
  "Why 1.5 is the wrong default line-height for body copy and what we settled on after three rounds of A/B tests.",
];

const COUNTERPARTIES: readonly ProfileProps[] = [
  {
    source: randomAvatar("Felix"),
    name: "Felix Carter",
    flag: "US",
    from: "Brooklyn, NY",
  },
  {
    source: randomAvatar("Ren"),
    name: "Ren Müller",
    flag: "DE",
    from: "Munich, Germany",
  },
  {
    source: randomAvatar("Lin"),
    name: "Lin Tanaka",
    flag: "JP",
    from: "Tokyo, Japan",
  },
  {
    source: randomAvatar("Sara"),
    name: "Sara Becker",
    flag: "DE",
    from: "Berlin, Germany",
  },
  {
    source: randomAvatar("Mila"),
    name: "Mila Olteanu",
    flag: "RO",
    from: "Cluj, Romania",
  },
];

export const USER_PROFILE_TAB_DEFS: ReadonlyArray<{
  id: string;
  label: string;
  count?: number;
}> = [
  { id: "posts", label: "Posts", count: 482 },
  { id: "reposts", label: "Reposts", count: 76 },
  { id: "replies", label: "Replies", count: 1240 },
  { id: "media", label: "Media", count: 318 },
];

const PAGE_SIZE = 6;
const MEDIA_PAGE_SIZE = 300;
const MEDIA_INITIAL_SIZE = 300;

const mediaFullUrl = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/1200`;

export const picsumMediaThumbnail: ResolveMediaThumbnailSource = (
  item,
  pixelSize,
) =>
  `https://picsum.photos/seed/${encodeURIComponent(item.id)}/${pixelSize}/${pixelSize}`;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomCounts() {
  return {
    likeCount: chance(0.8) ? randInt(2500) : undefined,
    commentCount: chance(0.6) ? randInt(80) : undefined,
    repostCount: chance(0.5) ? randInt(200) : undefined,
  };
}

function randomActives() {
  return {
    liked: chance(0.3),
    commented: chance(0.15),
    reposted: chance(0.15),
  };
}

function takeFromGenerator<T>(
  gen: Generator<T, never, unknown>,
  count: number,
): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(gen.next().value);
  }
  return out;
}

function makeGenerator<T>(
  build: (n: number) => T,
): Generator<T, never, unknown> {
  function* gen(): Generator<T, never, unknown> {
    let n = 0;
    while (true) {
      yield build(n++);
    }
  }
  return gen();
}

type ProfileFeedBuilders = {
  buildPostsItem: (n: number) => FeedItem;
  buildMediaItem: (n: number) => UserProfileMediaItem;
  buildRepostsItem: (n: number) => FeedItem;
  buildRepliesItem: (n: number) => FeedItem;
};

function createProfileFeedBuilders(
  author: ProfileProps,
  idPrefix: string,
): ProfileFeedBuilders {
  const buildPostsItem = (n: number): FeedItem => ({
    id: `${idPrefix}-posts-${n}`,
    author,
    content: pick(POST_BODIES),
    ...randomCounts(),
    ...randomActives(),
  });

  const buildMediaItem = (n: number): UserProfileMediaItem => {
    const id = `${idPrefix}-media-${n}`;
    return {
      id,
      source: mediaFullUrl(id),
      alt: `Photo ${n + 1}`,
      aspectRatio: 1,
      onPress: () => console.log(`[profile feed] open full image ${id}`),
    };
  };

  const buildRepostsItem = (n: number): FeedItem => {
    const counterparty = pick(COUNTERPARTIES);
    return {
      id: `${idPrefix}-reposts-${n}`,
      author,
      content: chance(0.75) ? pick(REPLY_BODIES) : undefined,
      relation: {
        kind: "repost",
        post: {
          author: counterparty,
          content: pick(ORIGINAL_BODIES),
        },
      },
      ...randomCounts(),
      ...randomActives(),
      reposted: true,
    };
  };

  const buildRepliesItem = (n: number): FeedItem => {
    const counterparty = pick(COUNTERPARTIES);
    return {
      id: `${idPrefix}-replies-${n}`,
      author,
      content: pick(REPLY_BODIES),
      relation: {
        kind: "comment",
        post: {
          author: counterparty,
          content: pick(ORIGINAL_BODIES),
        },
      },
      ...randomCounts(),
      ...randomActives(),
      commented: true,
    };
  };

  return {
    buildPostsItem,
    buildMediaItem,
    buildRepostsItem,
    buildRepliesItem,
  };
}

export type UserProfileFeedOptions = {
  /** Profile row identity used as the author on every fabricated post. */
  author: ProfileProps;
  /** Stable prefix for generated row ids (defaults to a slug of `author.name`). */
  idPrefix?: string;
};

/**
 * Demo feed state for {@link UserProfile}: random posts, reposts, replies, and
 * media attributed to one author. Mirrors the UI Kit
 * {@link "../../views/ui-kit/UserProfileScreen".default} data layer.
 */
export function useUserProfileFeed({
  author,
  idPrefix = author.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
}: UserProfileFeedOptions) {
  const builders = useMemo(
    () => createProfileFeedBuilders(author, idPrefix),
    [author, idPrefix],
  );

  const [postsGen] = useState(() =>
    makeGenerator(builders.buildPostsItem),
  );
  const [mediaGen] = useState(() =>
    makeGenerator(builders.buildMediaItem),
  );
  const [repostsGen] = useState(() =>
    makeGenerator(builders.buildRepostsItem),
  );
  const [repliesGen] = useState(() =>
    makeGenerator(builders.buildRepliesItem),
  );

  const [postsItems, setPostsItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(postsGen, PAGE_SIZE),
  );
  const [mediaItems, setMediaItems] = useState<UserProfileMediaItem[]>(() =>
    takeFromGenerator(mediaGen, MEDIA_INITIAL_SIZE),
  );
  const [repostsItems, setRepostsItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(repostsGen, PAGE_SIZE),
  );
  const [repliesItems, setRepliesItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(repliesGen, PAGE_SIZE),
  );

  const postsPageRef = useRef(1);
  const mediaPageRef = useRef(1);
  const repostsPageRef = useRef(1);
  const repliesPageRef = useRef(1);

  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [mediaRefreshing, setMediaRefreshing] = useState(false);
  const [repostsRefreshing, setRepostsRefreshing] = useState(false);
  const [repliesRefreshing, setRepliesRefreshing] = useState(false);

  const onPostsEndReached = useCallback(() => {
    postsPageRef.current += 1;
    setPostsItems((prev) => [
      ...prev,
      ...takeFromGenerator(postsGen, PAGE_SIZE),
    ]);
  }, [postsGen]);

  const onMediaEndReached = useCallback(() => {
    mediaPageRef.current += 1;
    setMediaItems((prev) => [
      ...prev,
      ...takeFromGenerator(mediaGen, MEDIA_PAGE_SIZE),
    ]);
  }, [mediaGen]);

  const onRepostsEndReached = useCallback(() => {
    repostsPageRef.current += 1;
    setRepostsItems((prev) => [
      ...prev,
      ...takeFromGenerator(repostsGen, PAGE_SIZE),
    ]);
  }, [repostsGen]);

  const onRepliesEndReached = useCallback(() => {
    repliesPageRef.current += 1;
    setRepliesItems((prev) => [
      ...prev,
      ...takeFromGenerator(repliesGen, PAGE_SIZE),
    ]);
  }, [repliesGen]);

  const onPostsRefresh = useCallback(async () => {
    setPostsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setPostsItems((prev) => [
      ...takeFromGenerator(postsGen, PAGE_SIZE),
      ...prev,
    ]);
    setPostsRefreshing(false);
  }, [postsGen]);

  const onMediaRefresh = useCallback(async () => {
    setMediaRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setMediaItems((prev) => [
      ...takeFromGenerator(mediaGen, MEDIA_PAGE_SIZE),
      ...prev,
    ]);
    setMediaRefreshing(false);
  }, [mediaGen]);

  const onRepostsRefresh = useCallback(async () => {
    setRepostsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRepostsItems((prev) => [
      ...takeFromGenerator(repostsGen, PAGE_SIZE),
      ...prev,
    ]);
    setRepostsRefreshing(false);
  }, [repostsGen]);

  const onRepliesRefresh = useCallback(async () => {
    setRepliesRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRepliesItems((prev) => [
      ...takeFromGenerator(repliesGen, PAGE_SIZE),
      ...prev,
    ]);
    setRepliesRefreshing(false);
  }, [repliesGen]);

  const tabs = useMemo<[UserProfileTabConfig, ...UserProfileTabConfig[]]>(
    () => [
      {
        id: USER_PROFILE_TAB_DEFS[0].id,
        label: USER_PROFILE_TAB_DEFS[0].label,
        count: USER_PROFILE_TAB_DEFS[0].count,
        feed: {
          posts: postsItems,
          onEndReached: onPostsEndReached,
          onRefresh: onPostsRefresh,
          refreshing: postsRefreshing,
        },
      },
      {
        id: USER_PROFILE_TAB_DEFS[1].id,
        label: USER_PROFILE_TAB_DEFS[1].label,
        count: USER_PROFILE_TAB_DEFS[1].count,
        feed: {
          posts: repostsItems,
          onEndReached: onRepostsEndReached,
          onRefresh: onRepostsRefresh,
          refreshing: repostsRefreshing,
        },
      },
      {
        id: USER_PROFILE_TAB_DEFS[2].id,
        label: USER_PROFILE_TAB_DEFS[2].label,
        count: USER_PROFILE_TAB_DEFS[2].count,
        feed: {
          posts: repliesItems,
          onEndReached: onRepliesEndReached,
          onRefresh: onRepliesRefresh,
          refreshing: repliesRefreshing,
        },
      },
      {
        id: USER_PROFILE_TAB_DEFS[3].id,
        label: USER_PROFILE_TAB_DEFS[3].label,
        count: USER_PROFILE_TAB_DEFS[3].count,
        media: {
          images: mediaItems,
          onEndReached: onMediaEndReached,
          onRefresh: onMediaRefresh,
          refreshing: mediaRefreshing,
          resolveThumbnailSource: picsumMediaThumbnail,
        },
      },
    ],
    [
      postsItems,
      mediaItems,
      repostsItems,
      repliesItems,
      onPostsEndReached,
      onMediaEndReached,
      onRepostsEndReached,
      onRepliesEndReached,
      onPostsRefresh,
      onMediaRefresh,
      onRepostsRefresh,
      onRepliesRefresh,
      postsRefreshing,
      mediaRefreshing,
      repostsRefreshing,
      repliesRefreshing,
    ],
  );

  return { tabs };
}
