import { useState, useMemo } from 'react';
import { Row, Col, Menu, Card, Input, Typography, Empty, Spin, Alert, Breadcrumb, Divider, Space } from 'antd';
import {
  BookOutlined,
  BuildOutlined,
  DeploymentUnitOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageHeader from '../../components/common/PageHeader';
import { useHelp } from '../../hooks/useHelp';

const { Title, Text, Paragraph } = Typography;

export default function GuidePage() {
  const [activeKey, setActiveKey] = useState('guide_infra');
  const [searchText, setSearchText] = useState('');
  const { data: content, isLoading: loading, error } = useHelp(activeKey, 'vi');

  const menuItems = [
    {
      key: 'grp_workflows',
      label: 'QUY TRÌNH NGHIỆP VỤ',
      type: 'group' as const,
      children: [
        { key: 'guide_infra', icon: <BuildOutlined />, label: 'Khai báo hạ tầng' },
        { key: 'guide_changeset', icon: <DeploymentUnitOutlined />, label: 'Quy trình Thay đổi' },
        { key: 'guide_troubleshoot', icon: <SafetyCertificateOutlined />, label: 'Xử lý sự cố' },
        { key: 'guide_compliance', icon: <BookOutlined />, label: 'Quản lý Tuân thủ' },
      ],
    },
    {
      key: 'grp_modules',
      label: 'HƯỚNG DẪN MODULE',
      type: 'group' as const,
      children: [
        { key: 'dashboard', icon: <FileTextOutlined />, label: 'Dashboard' },
        { key: 'infrastructure', icon: <FileTextOutlined />, label: 'Hệ thống hạ tầng' },
        { key: 'server', icon: <FileTextOutlined />, label: 'Quản lý Server' },
        { key: 'network', icon: <FileTextOutlined />, label: 'Quản lý Mạng' },
        { key: 'application', icon: <FileTextOutlined />, label: 'Quản lý Ứng dụng' },
        { key: 'system-software', icon: <FileTextOutlined />, label: 'Phần mềm hệ thống' },
        { key: 'deployment', icon: <FileTextOutlined />, label: 'Triển khai (Deployment)' },
        { key: 'connection', icon: <FileTextOutlined />, label: 'Quản lý Kết nối' },
        { key: 'topology', icon: <FileTextOutlined />, label: 'Sơ đồ Topology' },
        { key: 'changeset', icon: <FileTextOutlined />, label: 'ChangeSets' },
        { key: 'audit', icon: <FileTextOutlined />, label: 'Audit Log' },
      ],
    },
    {
      key: 'grp_admin',
      label: 'QUẢN TRỊ HỆ THỐNG',
      type: 'group' as const,
      children: [
        { key: 'user', icon: <FileTextOutlined />, label: 'Người dùng' },
        { key: 'user_group', icon: <FileTextOutlined />, label: 'Nhóm người dùng' },
        { key: 'module_config', icon: <FileTextOutlined />, label: 'Cấu hình Modules' },
        { key: 'system_config', icon: <FileTextOutlined />, label: 'Cài đặt hệ thống' },
        { key: 'doc_type', icon: <FileTextOutlined />, label: 'Loại tài liệu' },
      ],
    },
  ];

  const filteredMenuItems = useMemo(() => {
    if (!searchText) return menuItems;
    const lowerSearch = searchText.toLowerCase();
    return menuItems.map(group => ({
      ...group,
      children: group.children?.filter(item => 
        item.label.toLowerCase().includes(lowerSearch)
      )
    })).filter(group => group.children && group.children.length > 0);
  }, [searchText]);

  const activeLabel = useMemo(() => {
    for (const group of menuItems) {
      const found = group.children?.find(item => item.key === activeKey);
      if (found) return found.label;
    }
    return '';
  }, [activeKey]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Trung tâm Hướng dẫn"
        subtitle="Tra cứu quy trình vận hành và tài liệu kỹ thuật"
        helpKey="general"
      />

      <Row gutter={24}>
        <Col xs={24} md={7} lg={6}>
          <div style={{ position: 'sticky', top: 24 }}>
            <Card styles={{ body: { padding: '16px 0' } }} bordered={false} className="guide-sidebar-card">
              <div style={{ padding: '0 16px 16px 16px' }}>
                <Input
                  placeholder="Tìm hướng dẫn..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              <Menu
                mode="inline"
                selectedKeys={[activeKey]}
                onClick={({ key }) => setActiveKey(key)}
                items={filteredMenuItems}
                style={{ borderRight: 0 }}
              />
            </Card>
          </div>
        </Col>

        <Col xs={24} md={17} lg={18}>
          <Card bordered={false} style={{ minHeight: '60vh' }}>
            <Breadcrumb style={{ marginBottom: 24 }}>
              <Breadcrumb.Item>Hướng dẫn</Breadcrumb.Item>
              <Breadcrumb.Item>{activeLabel}</Breadcrumb.Item>
            </Breadcrumb>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 12, color: '#8c8c8c' }}>Đang tải...</div>
              </div>
            ) : error ? (
              <Alert
                type="error"
                message="Lỗi"
                description="Không thể tải nội dung hướng dẫn."
                showIcon
              />
            ) : !content ? (
              <Empty description="Nội dung trống" />
            ) : (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
            
            <Divider style={{ marginTop: 48 }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Cần hỗ trợ thêm? <a href="mailto:support@systemmanager.io">Gửi email cho chúng tôi</a></Text>
            </div>
          </Card>
        </Col>
      </Row>

      <style>{`
        .guide-sidebar-card {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }
        .markdown-body {
          color: #262626;
          font-size: 16px;
          line-height: 1.7;
        }
        .markdown-body h1 { font-size: 28px; margin-bottom: 24px; color: #141414; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; }
        .markdown-body h2 { font-size: 20px; margin-top: 32px; margin-bottom: 16px; color: #1677ff; }
        .markdown-body p { margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 20px; padding-left: 20px; }
        .markdown-body li { margin-bottom: 8px; }
        .markdown-body blockquote {
          margin: 20px 0;
          padding: 12px 20px;
          background: #f0f7ff;
          border-left: 4px solid #1677ff;
          border-radius: 4px;
        }
        .markdown-body code {
          background: #f5f5f5;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 90%;
          color: #c41d7f;
        }
      `}</style>
    </div>
  );
}
