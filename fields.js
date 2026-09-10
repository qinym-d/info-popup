export function normalizeLocation(location) {
  if (Array.isArray(location)) {
    return location
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v.length > 0);
  }
  if (typeof location === 'string' && location.trim().length > 0) {
    return [location.trim()];
  }
  return [];
}

export function resolveLabel(data, field, defaultLabel) {
  const custom = data?.[`${field}_txt`];
  return typeof custom === 'string' && custom.trim().length > 0
    ? custom.trim()
    : defaultLabel;
}

function single(value) {
  return typeof value === 'string' && value.trim().length > 0
    ? [value.trim()]
    : [];
}

export function buildFieldList(data) {
  const list = [];

  const locations = normalizeLocation(data?.location);
  if (locations.length > 0) {
    list.push({ label: resolveLabel(data, 'location', '地点'), values: locations });
  }

  const role = single(data?.role);
  if (role.length > 0) {
    list.push({ label: resolveLabel(data, 'role', '职位'), values: role });
  }

  const since = single(data?.since);
  if (since.length > 0) {
    list.push({ label: resolveLabel(data, 'since', '时间'), values: since });
  }

  return list;
}
