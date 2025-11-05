export default function getAdditionalFormulasBasedOnFlows(flows, valuesDefined = []) {
  // Get list of nodes with incoming and outgoing flows
  const nodes = Object.entries(flows).reduce((acc, [key, flow]) => {
    if (flow.from) {
      acc[flow.from] = acc[flow.from] || { incoming: [], outgoing: [] };
      acc[flow.from].outgoing.push(key);
    }
    if (flow.to) {
      acc[flow.to] = acc[flow.to] || { incoming: [], outgoing: [] };
      acc[flow.to].incoming.push(key);
    }
    return acc;
  }, {});

  const additionalFormulas = {};
  Object.values(nodes).forEach(({ incoming, outgoing }) => {
    if (incoming.every((k) => valuesDefined.includes(k))) {
      const outgoingUndefined = outgoing.find((k) => !valuesDefined.includes(k));
      additionalFormulas[outgoingUndefined] = (d) =>
        incoming.reduce((sum, key) => sum + d[key], 0) -
        outgoing.filter((d) => d !== outgoingUndefined).reduce((sum, key) => sum + d[key], 0);
    } else if (outgoing.every((k) => valuesDefined.includes(k))) {
      const incomingUndefined = incoming.find((k) => !valuesDefined.includes(k));
      additionalFormulas[incomingUndefined] = (d) =>
        outgoing.reduce((sum, key) => sum + d[key], 0) - incoming.filter((d) => d !== incomingUndefined).reduce((sum, k) => sum + d[k], 0);
    }
  });

  return additionalFormulas;
}
