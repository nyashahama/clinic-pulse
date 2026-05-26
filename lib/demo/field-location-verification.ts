export type FieldLocationCoordinate = {
  latitude: number;
  longitude: number;
};

export type FieldLocationVerificationInput = {
  accuracyMeters: number | null;
  capturedAt: string;
  clinic: FieldLocationCoordinate & {
    name: string;
  };
  position: FieldLocationCoordinate;
};

export type FieldLocationVerificationTone = "clear" | "attention" | "blocked";

export type FieldLocationVerification = {
  accuracyLabel: "Good GPS accuracy" | "Acceptable GPS accuracy" | "Poor GPS accuracy";
  capturedAt: string;
  coordinateLabel: string;
  distanceLabel: string;
  distanceMeters: number;
  statusLabel:
    | "Location verified"
    | "Near selected clinic"
    | "Away from selected clinic";
  tone: FieldLocationVerificationTone;
};

const EARTH_RADIUS_METERS = 6371000;
const ON_SITE_DISTANCE_METERS = 150;
const NEARBY_DISTANCE_METERS = 1000;
const GOOD_ACCURACY_METERS = 5;
const UNACCEPTABLE_ACCURACY_METERS = 100;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceBetweenMeters(left: FieldLocationCoordinate, right: FieldLocationCoordinate) {
  const dLat = toRadians(right.latitude - left.latitude);
  const dLng = toRadians(right.longitude - left.longitude);
  const leftLat = toRadians(left.latitude);
  const rightLat = toRadians(right.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a)));
}

function formatCompassCoordinate(value: number, positive: string, negative: string) {
  const direction = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(5)}°${direction}`;
}

export function formatCoordinatePair(position: FieldLocationCoordinate) {
  return `${formatCompassCoordinate(position.latitude, "N", "S")} ${formatCompassCoordinate(
    position.longitude,
    "E",
    "W",
  )}`;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function getAccuracyLabel(accuracyMeters: number | null) {
  if (accuracyMeters !== null && accuracyMeters <= GOOD_ACCURACY_METERS) {
    return "Good GPS accuracy" as const;
  }

  if (accuracyMeters !== null && accuracyMeters <= UNACCEPTABLE_ACCURACY_METERS) {
    return "Acceptable GPS accuracy" as const;
  }

  return "Poor GPS accuracy" as const;
}

export function buildFieldLocationVerification({
  accuracyMeters,
  capturedAt,
  clinic,
  position,
}: FieldLocationVerificationInput): FieldLocationVerification {
  const distanceMeters = distanceBetweenMeters(position, clinic);
  const accuracyLabel = getAccuracyLabel(accuracyMeters);

  if (distanceMeters <= ON_SITE_DISTANCE_METERS) {
    return {
      accuracyLabel,
      capturedAt,
      coordinateLabel: formatCoordinatePair(position),
      distanceLabel: formatDistance(distanceMeters),
      distanceMeters,
      statusLabel: "Location verified",
      tone: accuracyLabel === "Poor GPS accuracy" ? "attention" : "clear",
    };
  }

  if (distanceMeters <= NEARBY_DISTANCE_METERS) {
    return {
      accuracyLabel,
      capturedAt,
      coordinateLabel: formatCoordinatePair(position),
      distanceLabel: formatDistance(distanceMeters),
      distanceMeters,
      statusLabel: "Near selected clinic",
      tone: "attention",
    };
  }

  return {
    accuracyLabel,
    capturedAt,
    coordinateLabel: formatCoordinatePair(position),
    distanceLabel: formatDistance(distanceMeters),
    distanceMeters,
    statusLabel: "Away from selected clinic",
    tone: "blocked",
  };
}
