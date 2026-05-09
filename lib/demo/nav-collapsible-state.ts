type ResolveNavCollapsibleOpenInput = {
  active: boolean;
  activeSignature: string | null;
  closedActiveSignature: string | null;
  userOpen: boolean;
};

export function resolveNavCollapsibleOpen({
  active,
  activeSignature,
  closedActiveSignature,
  userOpen,
}: ResolveNavCollapsibleOpenInput) {
  return (
    userOpen ||
    (active && activeSignature !== null && activeSignature !== closedActiveSignature)
  );
}
