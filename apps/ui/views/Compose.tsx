/**
 * Full-page post composer screen. Mounts the surface-agnostic
 * {@link "../components/PostComposer".PostComposer} as the screen's
 * root content inside a {@link "../components/Page".Page} shell, and
 * wires the composer's single attachment intent (`onAddPictures`)
 * plus the submit handler to the matching hooks in
 * `core/composer/*`. Link previews are auto-extracted from the body
 * text via {@link useDraftLinkExtraction} -- there is no manual
 * "attach link" affordance.
 *
 * Registered on the root stack in `App.tsx` as the `compose` route. The
 * composer's `onSubmit` calls the fake `useSubmitPost` hook, which
 * resolves after a 500ms simulated network delay and bubbles back via
 * the screen's `navigation.goBack()` once the submit succeeds.
 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Page } from "../components/Page";
import {
  addPictures,
  emptyDraft,
  PostComposer,
  type PostDraft,
} from "../components/PostComposer";
import { Lede } from "../components/Typography";
import { useDraftLinkExtraction } from "../core/composer/use-draft-link-extraction";
import { useImagePicker } from "../core/composer/use-image-picker";
import { useLinkResolver } from "../core/composer/use-link-resolver";
import { useSubmitPost } from "../core/composer/use-submit-post";

/**
 * Stand-in identity for the composer's author row. A real product flow
 * would pull this from the auth context (`useViewer()` or similar); for
 * now the screen pins a fixed record so the composer reads with a
 * concrete identity in every demo.
 */
const COMPOSE_AUTHOR = {
  source: "https://i.pravatar.cc/96?img=12",
  name: "You",
  flag: "RO",
} as const;

/**
 * Default-exported full-page composer. Registered with `App.tsx`'s root
 * stack as the `compose` route.
 */
export default function Compose() {
  const navigation = useNavigation();
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const { pickPictures } = useImagePicker();
  const { resolve } = useLinkResolver();
  const { submit, submitting, error } = useSubmitPost();

  useDraftLinkExtraction({ draft, onChange: setDraft, resolve });

  const handleSubmit = async () => {
    const ok = await submit(draft);
    if (ok) navigation.goBack();
  };

  return (
    <Page>
      <Lede>Share a thought, a link, or a photo. Take your time.</Lede>
      <View style={styles.composerWrap}>
        <PostComposer
          author={COMPOSE_AUTHOR}
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={() => navigation.goBack()}
          submitting={submitting}
          error={error}
          autoFocus
          onAddPictures={async () => {
            const picked = await pickPictures(4);
            if (picked.length > 0) {
              setDraft((d) => addPictures(d, picked));
            }
          }}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  /**
   * Vertical breathing room around the composer body. The {@link Page}
   * shell already supplies the page padding; this wrapper just adds the
   * gap between the intro lede and the composer block.
   */
  composerWrap: {
    marginTop: 24,
  },
});
