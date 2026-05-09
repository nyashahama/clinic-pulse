import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobileQuery(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const mediaQueryList = window.matchMedia(MOBILE_QUERY)
  mediaQueryList.addEventListener("change", onStoreChange)

  return () => mediaQueryList.removeEventListener("change", onStoreChange)
}

function getMobileSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
}

function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot
  )
}
