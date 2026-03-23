import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import { Description, Lede } from "../../components/Typography";

export type PlaceholderSection = {
  title: string;
  body: string;
};

export type PlaceholderPageProps = {
  lede: string;
  sections?: PlaceholderSection[];
};

export function PlaceholderPage({ lede, sections }: PlaceholderPageProps) {
  return (
    <Page>
      <Lede>{lede}</Lede>
      {sections?.map((section) => (
        <Section key={section.title} title={section.title}>
          <Description>{section.body}</Description>
        </Section>
      ))}
    </Page>
  );
}
