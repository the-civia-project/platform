import { createContext, PropsWithChildren, useMemo, useState } from "react";

type GlobalLoadingOptions = {
  fonts: boolean;
};

const DEFAULT: GlobalLoadingOptions = {
  fonts: false,
};

const Loader = createContext<GlobalLoadingOptions>(DEFAULT);

function usGlobalLoaderInternal() {
  const [state, setState] = useState<GlobalLoadingOptions>(DEFAULT);

  return [
    state,
    useMemo(
      () =>
        function patchState<K extends keyof GlobalLoadingOptions>(
          k: K,
          v: GlobalLoadingOptions[K],
        ) {
          setState((s) => ({ ...s, [k]: v }));
        },
      [],
    ),
  ] as const;
}

export function useGlobalLoader<K extends keyof GlobalLoadingOptions>(k: K) {
  const [state, patchState] = usGlobalLoaderInternal();

  return [
    state[k],
    useMemo(() => patchState.bind(null, k), [patchState]),
  ] as const;
}

export function GlobalLoadingProvider({ children }: PropsWithChildren) {
  const [state] = usGlobalLoaderInternal();

  return <Loader.Provider value={state}>{children}</Loader.Provider>;
}
