import { loadAsync } from "expo-font";
import { PropsWithChildren, useEffect } from "react";
import { Platform } from "react-native";
import { useGlobalLoader } from "./global-loader";

function useFonts() {
  const [, patchState] = useGlobalLoader("fonts");

  useEffect(() => {
    //
    // IMPORTANT: We only need to load the fonts for the web
    // for Android / iOS they need to be present in the app.json definition
    //
    if (Platform.OS !== "web") {
      patchState(true);

      return;
    }

    loadAsync({
      Gabriela: require("../assets/fonts/gabriela/gabriela-latin-400-normal.ttf"),
    })
      .then(() => {
        patchState(true);
      })
      .catch(() => {
        // TODO: ERROR!
      });
  }, []);
}

export function FontsProvider({ children }: PropsWithChildren) {
  useFonts();

  return <>{children}</>;
}
