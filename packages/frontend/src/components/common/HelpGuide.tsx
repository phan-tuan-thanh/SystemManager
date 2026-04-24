import React, { useState } from 'react';
import { Drawer, Button, Spin, Empty, Typography, Space } from 'antd';
import { QuestionCircleOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useHelp } from '../../hooks/useHelp';

const { Title, Text } = Typography;

interface HelpGuideProps {
  moduleKey: string;
}

export default function HelpGuide({ moduleKey }: HelpGuideProps) {
  const [visible, setVisible] = useState(false);
  const { data, isLoading, isError } = useHelp(moduleKey);

  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  return (
    <>
      <Button
        type="text"
        icon={<QuestionCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
        onClick={showDrawer}
        title="Hướng dẫn sử dụng"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
      <Drawer
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>Hướng dẫn sử dụng</span>
          </Space>
        }
        placement="right"
        width={500}
        onClose={onClose}
        open={visible}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: '24px' } }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#8c8c8c' }}>Đang tải hướng dẫn...</div>
          </div>
        ) : isError || !data ? (
          <Empty
            description={
              <Text type="secondary">
                Không tìm thấy nội dung hướng dẫn cho chức năng này.
              </Text>
            }
          />
        ) : (
          <div className="help-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data}
            </ReactMarkdown>
            <style>{`
              .help-content h1 { font-size: 24px; margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; color: #1f1f1f; }
              .help-content h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #1f1f1f; }
              .help-content h3 { font-size: 16px; margin-top: 16px; margin-bottom: 8px; color: #434343; }
              .help-content p { line-height: 1.6; margin-bottom: 12px; color: #595959; }
              .help-content ul, .help-content ol { padding-left: 24px; margin-bottom: 16px; }
              .help-content li { margin-bottom: 8px; color: #595959; }
              .help-content blockquote { 
                margin: 16px 0; padding: 12px 16px; 
                background: #f9f9f9; border-left: 4px solid #1677ff; 
                border-radius: 4px;
              }
              .help-content blockquote p { margin-bottom: 0; font-style: italic; }
              .help-content code { 
                background: #f5f5f5; padding: 2px 4px; 
                border-radius: 4px; font-family: monospace; font-size: 13px;
                color: #eb2f96;
              }
              /* Support GitHub-style alerts in markdown if they use specific syntax */
              .help-content .alert { padding: 12px; margin-bottom: 16px; border-radius: 6px; border-left: 4px solid; }
            `}</style>
          </div>
        )}
      </Drawer>
    </>
  );
}
