type BookingSearchParams = Pick<URLSearchParams, "get">;

export function shouldOpenBookingModal(url: string) {
  const parsedUrl = new URL(url);

  return parsedUrl.hash === "#booking" || shouldOpenBookingModalFromSearchParams(parsedUrl.searchParams);
}

export function shouldOpenBookingModalFromSearchParams(searchParams: BookingSearchParams) {
  return searchParams.get("booking") === "1";
}
