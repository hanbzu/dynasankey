export default function formatNum(d) {
  const format = (value) => {
    const formatted = value.toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
  };

  if (d >= 1000000) return format(d / 1000000) + 'M';
  else if (d >= 1000) return format(d / 1000) + 'K';
  else return format(d);
}
