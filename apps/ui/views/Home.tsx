import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Feed } from "../components/Feed";
import { useFormFactor } from "../components/use-form-factor";
import { useTheme } from "../components/use-theme";
import { HomeAside } from "../core/home/HomeAside";
import { HomeFeedTabs } from "../core/home/HomeFeedTabs";
import { HomeFooter } from "../core/home/HomeFooter";
import { HomeHeader } from "../core/home/HomeHeader";
import { HomeSidebar } from "../core/home/HomeSidebar";
import { useHomeFeed } from "../core/home/use-home-feed";

export default function Home() {
  const theme = useTheme();
  const formFactor = useFormFactor();
  const isDesktop = formFactor === "web";
  const feed = useHomeFeed();

  const stickyFeedTabs = useMemo(
    () => (
      <HomeFeedTabs
        activeTabId={feed.activeTabId}
        onTabPress={feed.setActiveTab}
      />
    ),
    [feed.activeTabId, feed.setActiveTab],
  );

  return (
    <View style={styles.root}>
      <HomeHeader />

      <View style={styles.body}>
        {isDesktop ? <HomeSidebar activeId="home" /> : null}

        <View
          style={[
            styles.feedColumn,
            isDesktop && {
              borderLeftColor: theme.borderDefault,
              borderRightColor: theme.borderDefault,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderRightWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Feed
            ref={feed.feedRef}
            posts={feed.posts}
            stickyHeader={stickyFeedTabs}
            onEndReached={feed.onEndReached}
            onPostPress={feed.onPostPress}
            onPostLike={feed.onPostLike}
            onPostComment={feed.onPostComment}
            onPostRepost={feed.onPostRepost}
            onPostShare={feed.onPostShare}
            onPostBookmark={feed.onPostBookmark}
            onPostMention={feed.onPostMention}
            onPostUrlPress={feed.onPostUrlPress}
            onPostHashtag={feed.onPostHashtag}
          />
        </View>

        {isDesktop ? <HomeAside /> : null}
      </View>

      <HomeFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  feedColumn: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});
