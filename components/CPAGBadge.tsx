/**
 * CPAG attribution badge shown on published pages when enabled in settings.
 */
export default function CPAGBadge() {
  return (
    <a
      href="https://cpag.in"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="This website was built using CPAG."
      style={{
        height: 'auto',
        background: '#050606',
        padding: '10px 12px',
        width: 'auto',
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        zIndex: 9999,
        opacity: 1,
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          alignItems: 'center',
          background: '#FFFFFF',
          borderRadius: '50%',
          color: '#050606',
          display: 'inline-flex',
          fontSize: '9px',
          fontWeight: 800,
          height: '14px',
          justifyContent: 'center',
          letterSpacing: 0,
          width: '14px',
        }}
      >
        C
      </span>
      CPAG
    </a>
  );
}
