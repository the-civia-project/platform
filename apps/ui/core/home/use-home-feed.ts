import { useCallback, useRef, useState } from "react";
import type { FeedHandle, FeedItem } from "../../components/Feed";
import { randomPosts, takeFromGenerator } from "../demo/random-posts";
import type { HomeFeedTabId } from "./home-feed-tabs";

const PAGE_SIZE = 8;

type TabFeedState = {
  generator: ReturnType<typeof randomPosts>;
  posts: FeedItem[];
};

function createTabFeedState(): TabFeedState {
  const generator = randomPosts();
  return {
    generator,
    posts: takeFromGenerator(generator, PAGE_SIZE),
  };
}

function createInitialTabState(): Record<HomeFeedTabId, TabFeedState> {
  return {
    "for-you": createTabFeedState(),
    following: createTabFeedState(),
    "missing-out": createTabFeedState(),
  };
}

function updateTabPosts(
  tabs: Record<HomeFeedTabId, TabFeedState>,
  tabId: HomeFeedTabId,
  updater: (posts: FeedItem[]) => FeedItem[],
): Record<HomeFeedTabId, TabFeedState> {
  const tab = tabs[tabId];
  return {
    ...tabs,
    [tabId]: {
      ...tab,
      posts: updater(tab.posts),
    },
  };
}

export function useHomeFeed() {
  const feedRef = useRef<FeedHandle>(null);
  const [activeTabId, setActiveTabId] = useState<HomeFeedTabId>("for-you");
  const [tabs, setTabs] = useState(createInitialTabState);

  const activePosts = tabs[activeTabId].posts;

  const setActiveTab = useCallback((tabId: HomeFeedTabId) => {
    setActiveTabId((prev) => {
      if (prev === tabId) {
        feedRef.current?.scrollToTop({ animated: true });
        return prev;
      }
      feedRef.current?.scrollToTop({ animated: false });
      return tabId;
    });
  }, []);

  const onEndReached = useCallback(() => {
    setTabs((prev) => {
      const tab = prev[activeTabId];
      return {
        ...prev,
        [activeTabId]: {
          ...tab,
          posts: [
            ...tab.posts,
            ...takeFromGenerator(tab.generator, PAGE_SIZE),
          ],
        },
      };
    });
  }, [activeTabId]);

  const onPostLike = useCallback(
    (post: FeedItem) => {
      setTabs((prev) =>
        updateTabPosts(prev, activeTabId, (posts) =>
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  liked: !p.liked,
                  likeCount: p.liked
                    ? Math.max((p.likeCount ?? 0) - 1, 0)
                    : (p.likeCount ?? 0) + 1,
                }
              : p,
          ),
        ),
      );
    },
    [activeTabId],
  );

  const onPostRepost = useCallback(
    (post: FeedItem) => {
      setTabs((prev) =>
        updateTabPosts(prev, activeTabId, (posts) =>
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  reposted: !p.reposted,
                  repostCount: p.reposted
                    ? Math.max((p.repostCount ?? 0) - 1, 0)
                    : (p.repostCount ?? 0) + 1,
                }
              : p,
          ),
        ),
      );
    },
    [activeTabId],
  );

  const onPostComment = useCallback((post: FeedItem) => {
    console.log(`[Home] comment on ${post.id}`);
  }, []);

  const onPostShare = useCallback((post: FeedItem) => {
    console.log(`[Home] share ${post.id}`);
  }, []);

  const onPostBookmark = useCallback(
    (post: FeedItem) => {
      setTabs((prev) =>
        updateTabPosts(prev, activeTabId, (posts) =>
          posts.map((p) =>
            p.id === post.id ? { ...p, bookmarked: !p.bookmarked } : p,
          ),
        ),
      );
    },
    [activeTabId],
  );

  const onPostPress = useCallback((post: FeedItem) => {
    console.log(`[Home] open ${post.id}`);
  }, []);

  const onPostMention = useCallback((post: FeedItem, handle: string) => {
    console.log(`[Home] @${handle} in ${post.id}`);
  }, []);

  const onPostUrlPress = useCallback((post: FeedItem, href: string) => {
    console.log(`[Home] url ${href} in ${post.id}`);
  }, []);

  const onPostHashtag = useCallback((post: FeedItem, tag: string) => {
    console.log(`[Home] #${tag} in ${post.id}`);
  }, []);

  return {
    feedRef,
    activeTabId,
    setActiveTab,
    posts: activePosts,
    onEndReached,
    onPostLike,
    onPostRepost,
    onPostComment,
    onPostShare,
    onPostBookmark,
    onPostPress,
    onPostMention,
    onPostUrlPress,
    onPostHashtag,
  };
}
