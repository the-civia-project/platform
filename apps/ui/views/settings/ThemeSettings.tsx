import { StyleSheet, View } from "react-native";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import { Lede } from "../../components/Typography";
import { ThemeFlavorSwitcher } from "../../core/theme/ThemeFlavorSwitcher";

export default function ThemeSettings() {
  return (
    <Page>
      <Lede>
        Pick a colour flavour; applies across the app immediately.
      </Lede>
      <Section title="Colour theme">
        <View style={styles.switcher}>
          <ThemeFlavorSwitcher width={200} />
        </View>
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  switcher: {
    alignSelf: "flex-start",
  },
});
