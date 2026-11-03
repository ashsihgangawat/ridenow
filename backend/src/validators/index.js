export const validatePhone = (phone) => {
  if (!phone) return false;
  // Clean phone number
  const clean = phone.replace(/[\s+-]/g, '');
  return clean.length >= 10;
};

export const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

