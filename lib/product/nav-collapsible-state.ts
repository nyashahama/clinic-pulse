export type NavCollapsibleStateInput = {
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
}: NavCollapsibleStateInput) {
  return (
    userOpen ||
    (active && activeSignature !== null && activeSignature !== closedActiveSignature)
  );
}
