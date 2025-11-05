/** Turn the value into a string for editing (NOTE: Unused for now) */
export default function toString(d) {
  return d
    .toString() // it could be a function, make sure we've got it in string form
    .replace(/^\(d\)\s*=>\s*/, '') // Replace the '(d) => ' at the beginning
    .replace(/d\./g, ''); // Replace 'd.' occurrences
}
