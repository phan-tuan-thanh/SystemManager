import { Modal, Input, Button, message } from 'antd';

interface Props {
  open: boolean;
  onCancel: () => void;
  mermaidCode: string;
}

export default function MermaidExportModal({ open, onCancel, mermaidCode }: Props) {
  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode);
    message.success('Đã copy mã Mermaid vào Clipboard!');
  };

  return (
    <Modal
      title="Export Firewall Topology (Mermaid)"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>Đóng</Button>,
        <Button key="copy" type="primary" onClick={handleCopy}>Copy to Clipboard</Button>
      ]}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        Bạn có thể copy đoạn mã bên dưới và dán vào các công cụ hỗ trợ Markdown (như GitHub, Confluence) hoặc xem trước trên <a href="https://mermaid.live" target="_blank" rel="noreferrer">Mermaid Live Editor</a>.
      </div>
      <Input.TextArea
        value={mermaidCode}
        readOnly
        autoSize={{ minRows: 10, maxRows: 25 }}
        style={{ fontFamily: 'monospace', fontSize: 13, background: '#f5f5f5' }}
      />
    </Modal>
  );
}
