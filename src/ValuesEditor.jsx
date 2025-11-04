import _ from 'lodash';

export default function ValuesEditor({ data, onChange }) {
  const entries = Object.entries(data);

  const handleKeyChange = (oldKey, newKey) => {
    if (oldKey === newKey) return;

    const newData = { ...data };
    const value = newData[oldKey];
    delete newData[oldKey];
    newData[newKey] = value;
    onChange(newData);
  };

  const handleValueChange = (key, newValue) => {
    onChange({
      ...data,
      [key]: newValue,
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            let newKey = 'new_variable';
            let counter = 1;

            while (data[newKey]) {
              newKey = `new_variable_${counter}`;
              counter++;
            }

            onChange({
              ...data,
              [newKey]: '',
            });
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Add Variable
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {entries.map(([key, value]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <input
              type="text"
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              style={{
                padding: '6px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '200px',
                fontFamily: 'monospace',
              }}
            />
            <span style={{ fontSize: '16px', color: '#666' }}>=</span>
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              style={{
                padding: '6px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                flex: 1,
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={() => onChange(_.omit(data, key))}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No variables defined. Click "Add Variable" to create one.</div>
      )}
    </div>
  );
}
