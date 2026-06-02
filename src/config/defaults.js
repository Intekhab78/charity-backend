const numberFromEnv = (key, fallback = null) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
};

module.exports = {
  DEFAULT_COMPANY_ID: numberFromEnv("DEFAULT_COMPANY_ID"),
  DEFAULT_LOCATION_ID: numberFromEnv("DEFAULT_LOCATION_ID"),
  DEFAULT_ORGANISATION_ID: numberFromEnv("DEFAULT_ORGANISATION_ID", 1),
  DEFAULT_VENDOR_ROLE_ID: numberFromEnv("DEFAULT_VENDOR_ROLE_ID", 2),
  DEFAULT_CUSTOMER_USER_ID: numberFromEnv("DEFAULT_CUSTOMER_USER_ID", 1)
};
