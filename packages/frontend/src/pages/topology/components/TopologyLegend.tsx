interface Props {
  hasEnvironment: boolean;
}

export default function TopologyLegend({ hasEnvironment }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: 6,
        padding: '5px 14px',
        fontSize: 11,
        fontWeight: 600,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        whiteSpace: 'nowrap',
        ...(!hasEnvironment
          ? { background: 'rgba(250,173,20,0.95)', color: '#000' }
          : { background: 'rgba(30,30,30,0.82)', color: '#fff' }),
      }}
    >
      {!hasEnvironment ? (
        <>⚠ Chọn môi trường để xem kết nối FirewallRule (ALLOW / DENY)</>
      ) : (
        <>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 22, height: 2, background: '#389e0d', borderRadius: 1 }} />
            ALLOW
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 22, height: 2, background: '#cf1322', borderRadius: 1, borderTop: '2px dashed #cf1322' }} />
            DENY
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 22, height: 2, background: '#d9d9d9', borderRadius: 1 }} />
            App Connection
          </span>
        </>
      )}
    </div>
  );
}
