import React from 'react';
import fromString from './logic/fromString.js';
import getAdditionalFormulasBasedOnFlows from './logic/getAdditionalFormulasBasedOnFlows.js';
import solve from './logic/solve.js';
import _ from 'lodash';
import SankeyPlot from './SankeyPlot.jsx';
import ValuesEditor from './ValuesEditor.jsx';
import { useUrlState } from './useUrlState';

function App() {
  const [state, setState] = useUrlState(EMPTY_STATE);
  console.log('···state', state);

  const valuesRunnable = _.mapValues(state.values, fromString); // Can throw TODO
  const dataSolved = solve({ ...valuesRunnable, ...getAdditionalFormulasBasedOnFlows(state.flows, Object.keys(valuesRunnable)) });
  const sankeyData = adaptData({
    values: dataSolved,
    flows: state.flows,
  });
  console.log('---sankeyData', sankeyData);

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#333' }}>{state.title}</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>{state.description}</p>
      </header>

      <main>
        {sankeyData?.links?.length > 0 && <SankeyPlot height={400} width={800} sankeyData={sankeyData} />}
        <ValuesEditor data={state.values} dataSolved={dataSolved} onChange={(values) => setState((s) => ({ ...s, values }))} />
        <button onClick={() => setState(EXAMPLE_STATE)}>Load example</button>
      </main>
    </div>
  );
}

export default App;

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

const EMPTY_STATE = {
  title: 'Click to change title',
  description: 'Click to change description',
  values: {},
  flows: {},
};

const EXAMPLE_STATE = {
  title: 'Simplified sleeper model',
  description: 'Lorem ipsum',
  values: {
    seats: 350,
    occupancy: 0.7,
    avg_ticket_price: 137.38,
    tickets: 'avg_ticket_price * seats * occupancy',
    subsidy: 32200,
    rdc_profit: '(per_km_cost + fixed_cost) * 0.1',
    distance: 1380,
    per_km_cost: 'distance * 28',
    coaches: 10,
    fixed_cost: 'coaches * 1000',
  },
  flows: {
    tickets: { to: 'revenue' },
    subsidy: { to: 'revenue' },
    sbb_profit: { from: 'revenue' },
    cost: { from: 'revenue', to: 'cost' },
    rdc_profit: { from: 'cost' },
    per_km_cost: { from: 'cost' },
    fixed_cost: { from: 'cost' },
  },
};
