// app/page.tsx
const BLUE = '#1035AC';     // brand blue
const BURGUNDY = '#800020'; // accent (not used on text here, logo uses it)

export default function HomePage() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '70dvh' }}>
      <div style={{ textAlign: 'center' }}>
        {/* Stacked wordmark: "Integrity" over "Streaming" in blue.
            The first I touches the T using a tiny negative margin. */}
        <div style={{ color: BLUE, fontWeight: 800, lineHeight: 1.0 }}>
          <div style={{ fontSize: 42, letterSpacing: 0 }}>
            <span style={{ display: 'inline-block', marginRight: -6 /* I touches T below */ }}>
              I
            </span>
            ntegrity
          </div>
          <div style={{ fontSize: 42, letterSpacing: 0, marginTop: -2 }}>
            Streaming
          </div>
        </div>

        {/* TV logo underneath */}
        <img
          src="/logo.svg"
          alt="Integrity Streaming TV logo"
          width={180}
          height={180}
          style={{ display: 'block', margin: '18px auto 0' }}
        />

        {/* Helper text so you know it worked */}
        <p style={{ marginTop: 16, opacity: 0.85 }}>
          Brand mark loaded. You can change sizes/colors later.
        </p>
      </div>
    </main>
  );
}
