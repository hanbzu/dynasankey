/** Go back to the original value format (number or func). Uses a naive contruction of an arrow function and evaluation, which may throw errors */
export default function fromString(d) {
  return !isNaN(Number(d))
    ? +d // converted to number
    : eval(`(d) => ${d.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, 'd.$1')}`); // converted to function
}
