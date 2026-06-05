/**
 * UI Kit feature root: an inner stack navigator that wires the home grid and per-component
 * demo screens. Each screen file lives next to this one in `views/ui-kit/`, including the
 * UI-Kit-internal `ExampleBlock`. Shared layout primitives (`Hero`, `Page`, `Section`,
 * `Typography`, `Cluster`) come from `components/`.
 */
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "../../components/use-theme";
import AccordionScreen from "./AccordionScreen";
import ButtonScreen from "./ButtonScreen";
import CardsScreen from "./CardsScreen";
import DrawerScreen from "./DrawerScreen";
import FeedScreen from "./FeedScreen";
import HomeScreen from "./HomeScreen";
import IconsScreen from "./IconsScreen";
import InputScreen from "./InputScreen";
import LayoutScreen from "./LayoutScreen";
import LoadingIndicatorScreen from "./LoadingIndicatorScreen";
import LogoScreen from "./LogoScreen";
import OnboardingFlowsScreen from "./OnboardingFlowsScreen";
import PostComposerScreen from "./PostComposerScreen";
import PostPatternsScreen from "./PostPatternsScreen";
import PostScreen from "./PostScreen";
import ProfileScreen from "./ProfileScreen";
import QrCodeScreen from "./QrCodeScreen";
import SelectionScreen from "./SelectionScreen";
import TypographyScreen from "./TypographyScreen";
import UserProfileScreen from "./UserProfileScreen";
import type { UiKitStackParamList } from "./param-list";
import { UiKitThemeFlavorSwitcher } from "./components/UiKitThemeFlavorSwitcher";

const Stack = createStackNavigator<UiKitStackParamList>();

/**
 * Default-exported navigator registered with the app's root stack as `ui-kit`.
 */
export default function UiKit() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: { flex: 1, backgroundColor: "transparent" },
        headerStyle: {
          backgroundColor: theme.surfaceCard,
          borderBottomColor: theme.borderDefault,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.fgEmphasis,
        headerTitleStyle: { color: theme.fgEmphasis },
        headerRight: () => <UiKitThemeFlavorSwitcher />,
      }}
    >
      <Stack.Screen
        name="home"
        component={HomeScreen}
        options={{ title: "UI Kit" }}
      />
      <Stack.Screen
        name="accordion"
        component={AccordionScreen}
        options={{ title: "Accordion" }}
      />
      <Stack.Screen
        name="button"
        component={ButtonScreen}
        options={{ title: "Button" }}
      />
      <Stack.Screen
        name="cards"
        component={CardsScreen}
        options={{ title: "Cards" }}
      />
      <Stack.Screen
        name="drawer"
        component={DrawerScreen}
        options={{ title: "Drawer" }}
      />
      <Stack.Screen
        name="feed"
        component={FeedScreen}
        options={{ title: "Feed" }}
      />
      <Stack.Screen
        name="icons"
        component={IconsScreen}
        options={{ title: "Icons" }}
      />
      <Stack.Screen
        name="input"
        component={InputScreen}
        options={{ title: "Input" }}
      />
      <Stack.Screen
        name="layout"
        component={LayoutScreen}
        options={{ title: "Layout" }}
      />
      <Stack.Screen
        name="loading-indicator"
        component={LoadingIndicatorScreen}
        options={{ title: "Loading indicator" }}
      />
      <Stack.Screen
        name="logo"
        component={LogoScreen}
        options={{ title: "Logo" }}
      />
      <Stack.Screen
        name="onboarding"
        component={OnboardingFlowsScreen}
        options={{ title: "Onboarding flows" }}
      />
      <Stack.Screen
        name="selection"
        component={SelectionScreen}
        options={{ title: "Selection" }}
      />
      <Stack.Screen
        name="qr-code"
        component={QrCodeScreen}
        options={{ title: "QR code" }}
      />
      <Stack.Screen
        name="profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="post-patterns"
        component={PostPatternsScreen}
        options={{ title: "Post patterns" }}
      />
      <Stack.Screen
        name="post"
        component={PostScreen}
        options={{ title: "Post" }}
      />
      <Stack.Screen
        name="post-composer"
        component={PostComposerScreen}
        options={{ title: "Post composer" }}
      />
      <Stack.Screen
        name="typography"
        component={TypographyScreen}
        options={{ title: "Typography" }}
      />
      <Stack.Screen
        name="user-profile"
        component={UserProfileScreen}
        options={{ title: "User profile" }}
      />
    </Stack.Navigator>
  );
}
