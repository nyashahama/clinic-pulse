import { RefObject, useSyncExternalStore } from "react";

function readScrollPosition(container?: RefObject<HTMLElement | null>) {
  if (typeof window === "undefined") {
    return 0;
  }

  return container?.current ? container.current.scrollTop : window.scrollY;
}

export function useScroll(
  threshold: number,
  { container }: { container?: RefObject<HTMLElement | null> } = {},
) {
  const scrollPosition = useSyncExternalStore(
    (onStoreChange) => {
      const element = container?.current ?? window;
      element.addEventListener("scroll", onStoreChange);
      return () => element.removeEventListener("scroll", onStoreChange);
    },
    () => readScrollPosition(container),
    () => 0,
  );

  return scrollPosition > threshold;
}
