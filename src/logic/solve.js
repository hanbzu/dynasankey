import _ from 'lodash';

/** Solve the functions in the 'obj' param recursivelly. They need values from each other so the next solvable key needs to be solved until none are left */
export default function solve(obj) {
  const nextFnKey = Object.keys(obj).find((k) => obj[k] instanceof Function && !isNaN(obj[k](obj)));
  if (nextFnKey === undefined) return _.omitBy(obj, (value) => typeof value !== 'number');
  else return solve({ ...obj, [nextFnKey]: obj[nextFnKey](obj) });
}
