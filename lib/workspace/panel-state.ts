type ResolveVisibleClinicIdInput = {
  clinicIds: string[];
  selectedClinicId: string | null;
  panelOpen: boolean;
};

export function resolveVisibleClinicId({
  clinicIds,
  selectedClinicId,
  panelOpen,
}: ResolveVisibleClinicIdInput) {
  if (!panelOpen || !selectedClinicId) {
    return null;
  }

  return clinicIds.includes(selectedClinicId) ? selectedClinicId : null;
}
