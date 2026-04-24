import { Breadcrumb, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import HelpGuide from './HelpGuide';

const { Title } = Typography;

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  helpKey?: string;
}

export default function PageHeader({ title, subtitle, breadcrumbs, extra, helpKey }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumbs.map((b) => ({
            title: b.path ? <Link to={b.path}>{b.label}</Link> : b.label,
          }))}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>{title}</Title>
            {helpKey && <HelpGuide moduleKey={helpKey} />}
          </Space>
          {subtitle && <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  );
}
