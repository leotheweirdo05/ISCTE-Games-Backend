import geoip from "geoip-lite";

export function getCurrentLocation(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};
  return {
    type: "Point",
    coordinates: geo.ll ? [geo.ll[1], geo.ll[0]] : [0, 0], // [lng, lat]
    city: geo.city || "",
    country: geo.country || "",
    ip,
    updatedAt: new Date(),
  };
}

export function isNewLocation(lastLocation, currentLocation) {
  if (!lastLocation) return true;
  return (
    lastLocation.country !== currentLocation.country ||
    lastLocation.city !== currentLocation.city
  );
}
