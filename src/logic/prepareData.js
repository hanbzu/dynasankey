import _ from 'lodash';
import fromString from './fromString.js';
import getAdditionalFormulasBasedOnFlows from './getAdditionalFormulasBasedOnFlows.js';
import solve from './solve.js';

export default function prepareData(state) {
  console.log('···state', state);
  if (_.isEmpty(state.flows)) return { error: 'Flows have not been defined yet' };
  const emptyFlow = Object.entries(state.flows).find(([k, v]) => _.isEmpty(v));
  if (emptyFlow) return { error: `Flow '${emptyFlow[0]}' is empty` };

  try {
    const valuesRunnable = _.mapValues(state.values, fromString); // Can throw TODO
    const dataSolved = solve({ ...valuesRunnable, ...getAdditionalFormulasBasedOnFlows(state.flows, Object.keys(valuesRunnable)) });
    const sankeyData = adaptData({ values: dataSolved, flows: state.flows });

    console.log('---sankeyData', sankeyData);
    return { sankeyData, dataSolved, error: false };
  } catch (err) {
    return { error: `Problem parsing data: ${err.message}` };
  }
}

function adaptData({ values, flows }) {
  // console.log('···values', values);
  // console.log('···flows', flows);
  const nodes = _.uniq(
    Object.entries(flows)
      .reduce((acc, [key, { from, to }]) => [...acc, from ?? key, to ?? key], [])
      .filter((d) => d)
  ).map((name, i) => ({ node: i, name }));
  const links = Object.entries(flows).map(([key, { from, to }]) => ({
    source: nodes.findIndex((d) => d.name === (from ?? key)),
    target: nodes.findIndex((d) => d.name === (to ?? key)),
    value: values[key],
  }));
  return { nodes, links };
}
