import type { PropsWithChildren, ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Card } from "../../components/card/Card";
import { Hero } from "../../components/Hero";
import { Description, Strong } from "../../components/Typography";
import { useTheme } from "../../components/use-theme";

export type AuthScreenProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
  hint?: string;
  /** Renders above the title, left-aligned (e.g. an Optional pill). */
  titleLeading?: ReactNode;
  footer?: ReactNode;
  error?: string | null;
}>;

export function AuthScreen({
  eyebrow,
  title,
  subtitle,
  hint,
  titleLeading,
  footer,
  error,
  children,
}: AuthScreenProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <Hero
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            hint={hint}
            titleLeading={titleLeading}
          />
          <Card>
            <View style={styles.form}>{children}</View>
            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    borderColor: theme.borderDefault,
                    backgroundColor: theme.surfaceSubtle,
                  },
                ]}
              >
                <Description>{error}</Description>
              </View>
            ) : null}
          </Card>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
          <View nativeID="clerk-captcha" style={styles.captcha} />
        </View>
      </ScrollView>
    </View>
  );
}

export type AuthLinkFooterProps = {
  lead: string;
  linkLabel: string;
  onPress: () => void;
};

export function AuthLinkFooter({ lead, linkLabel, onPress }: AuthLinkFooterProps) {
  return (
    <View style={styles.linkRow}>
      <Description>{lead}</Description>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        style={({ pressed }) => [pressed && styles.linkPressed]}
      >
        <Strong>{linkLabel}</Strong>
      </Pressable>
    </View>
  );
}

export function authFieldStackStyle(): ViewStyle {
  return styles.fieldStack;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  form: {
    gap: 16,
  },
  fieldStack: {
    gap: 4,
  },
  errorBanner: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  linkPressed: {
    opacity: Platform.OS === "web" ? 0.72 : 0.85,
  },
  captcha: {
    marginTop: 8,
    minHeight: 1,
  },
});
