type ResolveNavCollapsibleOpenInput = {
  active: boolean;
  open: boolean;
};

export function resolveNavCollapsibleOpen({
  active,
  open,
}: ResolveNavCollapsibleOpenInput) {
  return active || open;
}
