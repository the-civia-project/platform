import { useNavigation } from "@react-navigation/native";
import { Ellipsis, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { DrawerItem } from "../../components/Drawer";
import { useResolvedColorScheme, useTheme } from "../../components/use-theme";
import { webFocusOutlineStyle } from "../web-focus-outline";
import { homeNavRoute } from "./home-nav-routes";
import { HOME_NAV_ITEMS, type HomeNavItemId } from "./home-nav";

type HomeSidebarProps = {
  activeId?: HomeNavItemId;
};

export function HomeSidebar({ activeId = "home" }: HomeSidebarProps) {
  const theme = useTheme();
  const navigation = useNavigation<{
    navigate: (
      route:
        | ReturnType<typeof homeNavRoute>
        | "settings",
    ) => void;
  }>();

  return (
    <View
      style={[
        styles.sidebar,
        { borderRightColor: theme.borderDefault },
      ]}
    >
      <View style={styles.nav}>
        {HOME_NAV_ITEMS.map((item) => (
          <HomeNavRow
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={item.id === activeId}
            onPress={() => navigation.navigate(homeNavRoute(item.id))}
          />
        ))}
      </View>
      <DrawerItem
        icon={Ellipsis}
        label="More"
        onPress={() => navigation.navigate("settings")}
      />
    </View>
  );
}

type HomeNavRowProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
};

function HomeNavRow({ icon: Icon, label, active, onPress }: HomeNavRowProps) {
  const theme = useTheme();
  const isDark = useResolvedColorScheme() === "dark";
  const pressedBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const fg = active ? theme.primary : theme.fgEmphasis;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        navRowStyles.row,
        webFocusOutlineStyle(),
        pressed && { backgroundColor: pressedBg },
      ]}
    >
      <Icon size={20} color={fg} strokeWidth={1.75} />
      <RNText style={[navRowStyles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </RNText>
    </Pressable>
  );
}

const navRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  label: {
    fontSize: 17,
    fontWeight: "500",
    flex: 1,
  },
});

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-between",
  },
  nav: {
    gap: 2,
  },
});
