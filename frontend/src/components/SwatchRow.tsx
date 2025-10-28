type Swatch = { id: string; name: string; hex: string; price: number };

export default function SwatchRow({
  title, swatches, value, onChange
}: {
  title: string; swatches: Swatch[]; value: string; onChange: (hex: string) => void;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {swatches.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.hex)}
            title={`${s.name} (${s.id})`}
            style={{
              width: 28, height: 28, borderRadius: 4,
              border: value.toLowerCase() === s.hex.toLowerCase() ? "2px solid #111" : "1px solid #ccc",
              background: s.hex, cursor: "pointer"
            }}
          />
        ))}
      </div>
    </div>
  );
}
