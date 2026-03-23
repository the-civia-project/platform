import * as Application from "expo-application";
import { useState } from "react";

export default function useApplication() {
  const [state, setState] = useState({
    nativeApplicationVersion: Application.nativeApplicationVersion,
    nativeBuildVersion: Application.nativeBuildVersion,
  });

  console.log(state);
}
