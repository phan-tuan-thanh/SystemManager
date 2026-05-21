import { Alert, Button, Space } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';

export interface TemplateItem {
  label: string;
  filename: string;
}

interface TemplateDownloadBarProps {
  templates: TemplateItem[];
  message?: string;
}

export default function TemplateDownloadBar({
  templates,
  message = 'Tải file mẫu (CSV Template)',
}: TemplateDownloadBarProps) {
  return (
    <Alert
      type="info"
      showIcon
      icon={<FileTextOutlined />}
      message={message}
      description={
        <Space wrap size={[8, 4]}>
          {templates.map((t) => (
            <a key={t.filename} href={`/templates/${t.filename}`} download={t.filename}>
              <Button size="small" icon={<DownloadOutlined />}>
                {t.label}
              </Button>
            </a>
          ))}
        </Space>
      }
    />
  );
}
