/**
 * Landing screen for the UI Kit stack. Renders the hero panel and the section catalog
 * grouped into three tiers -- foundations, components, patterns -- so the list of cards
 * reads as a deliberate progression rather than a flat grid. Each tier becomes a
 * {@link Section} containing a wrapping {@link Cluster} of {@link DisclosureCard}s,
 * one per entry in {@link kitSections}.
 */
import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { DisclosureCard } from "../../components/card";
import { Cluster } from "../../components/Cluster";
import { Hero } from "../../components/Hero";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import type { UiKitStackParamList } from "./param-list";
import { kitCategories, kitSections, type UiKitSection } from "./sections";

/**
 * One category bucket prepared for rendering: the category metadata plus the
 * {@link UiKitSection}s that declare this category. Built once on mount via
 * {@link useMemo} since both the categories and sections lists are static.
 */
type SectionGroup = (typeof kitCategories)[number] & {
  sections: UiKitSection[];
};

/**
 * Default-exported screen registered with the UI Kit stack as `home`.
 */
export default function HomeScreen() {
  const navigation =
    useNavigation<StackNavigationProp<UiKitStackParamList>>();

  // Group sections under their category meta so the JSX below is a single pass --
  // each group emits a Section heading and a Cluster of cards. Memoised even though
  // the inputs are static so future hot-reloads don't recompute the filter on every
  // render.
  const groups: SectionGroup[] = useMemo(
    () =>
      kitCategories.map((category) => ({
        ...category,
        sections: kitSections.filter((s) => s.category === category.id),
      })),
    [],
  );

  return (
    <Page>
      <Hero
        eyebrow="Component library"
        title="UI Kit"
        subtitle={`Live, theme-aware examples for every primitive in apps/ui -- props, accessibility, and copy-ready code.`}
        hint={`${kitSections.length} components across ${kitCategories.length} tiers | foundations → components → patterns. Tap any card to drill in.`}
      />

      {groups.map((group) => (
        <Section
          key={group.id}
          title={group.title}
          subtitle={group.subtitle}
        >
          <Cluster>
            {group.sections.map((section) => (
              <DisclosureCard
                key={section.name}
                initial={section.initial}
                title={section.title}
                description={section.description}
                onPress={() => navigation.navigate(section.name)}
              />
            ))}
          </Cluster>
        </Section>
      ))}
    </Page>
  );
}
