export function shouldOpenBookingModal(url: string) {
  const parsedUrl = new URL(url);

  return parsedUrl.hash === "#booking" || parsedUrl.searchParams.get("booking") === "1";
}
