import { registerRootComponent } from "expo";

import { installWebFocusOutlineReset } from "./core/web-focus-outline";
import App from "./App";

installWebFocusOutlineReset();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
