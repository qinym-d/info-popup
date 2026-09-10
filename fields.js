export function normalizeInfo(info) {
  if (!Array.isArray(info)) return [];
  return info
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const type = typeof item.type === 'string' ? item.type.trim() : '';
      let value = '';
      if (Array.isArray(item.value)) {
        value = item.value
          .map((v) => (typeof v === 'string' ? v.trim() : ''))
          .filter((v) => v.length > 0)
          .join(' / ');
      } else if (typeof item.value === 'string') {
        value = item.value.trim();
      }
      if (type.length === 0 || value.length === 0) return null;
      return { type, value };
    })
    .filter(Boolean);
}
