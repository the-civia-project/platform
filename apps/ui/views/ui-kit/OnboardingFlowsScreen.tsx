/**
 * UI Kit screen for the Civia introduction — one copy path, multiple full-flow
 * design variants (classic, ambient, flow).
 */
import { useMemo } from "react";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
} from "../../components/Typography";
import { FlowStepPreview } from "./components/FlowStepPreview";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";
import { civiaIntroFlow } from "./onboarding-flows";
import { onboardingFlowDesignVariants } from "./onboarding-flow-design-variants";
type DesignRow = ExampleBlockProps & { key: string };

export default function OnboardingFlowsScreen() {
  const designRows: DesignRow[] = useMemo(
    () =>
      onboardingFlowDesignVariants.map((meta, index) => ({
        key: meta.id,
        name: meta.name,
        summary: <Description>{meta.summary}</Description>,
        description: <Description>{meta.description}</Description>,
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<FlowStepPreview designVariant="${meta.id}" />`}</Code>
          </Caption>
        ),
        samples: (
          <FlowStepPreview flow={civiaIntroFlow} designVariant={meta.id} />
        ),
        isLast: index === onboardingFlowDesignVariants.length - 1,
      })),
    [],
  );

  return (
    <Page>
      <Lede>
        Pre-auth Civia introduction flow designs. Samples use step pills and
        prev/next to walk through each screen.
      </Lede>
      <Section title="Civia introduction — flow designs">
        {designRows.map((row) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={row.isLast}
          />
        ))}
      </Section>
    </Page>
  );
}
