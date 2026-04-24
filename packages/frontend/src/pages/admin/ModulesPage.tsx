import { useState } from 'react';
import {
  Card, Switch, Tag, Tooltip, Typography, Row, Col,
  Modal, Alert, List, App, Skeleton,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useModuleConfigList, useToggleModule } from '../../hooks/useModuleConfigs';
import type { ModuleConfig } from '../../types/user';

const { Text, Title } = Typography;

// ─── Dependency Check Modal ────────────────────────────────────────────────────
function DependencyModal({
  module,
  allModules,
  open,
  onConfirm,
  onCancel,
}: {
  module: ModuleConfig | null;
  allModules: ModuleConfig[];
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!module) return null;

  const isEnabling = module.status === 'DISABLED';

  // Find modules that depend on this module (for disable case)
  const dependents = allModules.filter(
    (m) => m.dependencies.includes(module.module_key) && m.status === 'ENABLED',
  );

  // Find disabled dependencies (for enable case)
  const disabledDeps = module.dependencies
    .map((dep) => allModules.find((m) => m.module_key === dep))
    .filter((m): m is ModuleConfig => !!m && m.status === 'DISABLED');

  const hasBlocker = isEnabling ? disabledDeps.length > 0 : false;

  return (
    <Modal
      title={isEnabling ? `Bật module: ${module.display_name}` : `Tắt module: ${module.display_name}`}
      open={open}
      onOk={hasBlocker ? undefined : onConfirm}
      onCancel={onCancel}
      okText={isEnabling ? 'Bật module' : 'Tắt module'}
      okButtonProps={{ danger: !isEnabling, disabled: hasBlocker }}
      cancelText="Huỷ"
    >
      {isEnabling ? (
        <>
          {disabledDeps.length > 0 ? (
            <Alert
              type="error"
              showIcon
              message="Không thể bật module"
              description={
                <>
                  <Text>Các module phụ thuộc chưa được bật:</Text>
                  <List
                    size="small"
                    dataSource={disabledDeps}
                    renderItem={(m) => (
                      <List.Item>
                        <Tag color="red">{m.module_key}</Tag> {m.display_name}
                      </List.Item>
                    )}
                  />
                </>
              }
              style={{ marginBottom: 16 }}
            />
          ) : (
            <Alert type="info" showIcon message={`Bật module "${module.display_name}"?`} style={{ marginBottom: 16 }} />
          )}
          {module.dependencies.length > 0 && (
            <div>
              <Text type="secondary">Phụ thuộc vào:</Text>
              <div style={{ marginTop: 4 }}>
                {module.dependencies.map((dep) => (
                  <Tag key={dep}>{dep}</Tag>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Alert
            type="warning"
            showIcon
            message={`Tắt module "${module.display_name}"?`}
            style={{ marginBottom: 16 }}
          />
          {dependents.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="Các module sau đang phụ thuộc vào module này và sẽ bị ảnh hưởng:"
              description={
                <List
                  size="small"
                  dataSource={dependents}
                  renderItem={(m) => (
                    <List.Item>
                      <Tag color="orange">{m.module_key}</Tag> {m.display_name}
                    </List.Item>
                  )}
                />
              }
            />
          )}
        </>
      )}
    </Modal>
  );
}

// ─── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({
  module,
  allModules,
  onToggleRequest,
}: {
  module: ModuleConfig;
  allModules: ModuleConfig[];
  onToggleRequest: (module: ModuleConfig) => void;
}) {
  const isCore = module.module_type === 'CORE';
  const isEnabled = module.status === 'ENABLED';

  return (
    <Card
      size="small"
      style={{
        border: `1px solid ${isEnabled ? '#b7eb8f' : '#d9d9d9'}`,
        background: isEnabled ? '#f6ffed' : '#fafafa',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>{module.display_name}</Text>
            {isCore && <Tag color="blue" style={{ fontSize: 10 }}>CORE</Tag>}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>{module.module_key}</Text>
          {module.dependencies.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Tooltip title={`Phụ thuộc: ${module.dependencies.join(', ')}`}>
                <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  {module.dependencies.length} phụ thuộc
                </Text>
              </Tooltip>
            </div>
          )}
        </div>
        <Tooltip title={isCore ? 'Module CORE không thể tắt' : (isEnabled ? 'Tắt module' : 'Bật module')}>
          <Switch
            checked={isEnabled}
            disabled={isCore}
            size="small"
            onChange={() => onToggleRequest(module)}
          />
        </Tooltip>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const { data: modules, isLoading } = useModuleConfigList();
  const { mutateAsync: toggle } = useToggleModule();
  const { message } = App.useApp();
  const [pendingModule, setPendingModule] = useState<ModuleConfig | null>(null);

  const coreModules = modules?.filter((m) => m.module_type === 'CORE') ?? [];
  const extModules = modules?.filter((m) => m.module_type === 'EXTENDED') ?? [];

  const handleToggleRequest = (module: ModuleConfig) => {
    if (module.module_type === 'CORE') return;
    setPendingModule(module);
  };

  const handleConfirm = async () => {
    if (!pendingModule) return;
    try {
      await toggle(pendingModule.module_key);
      message.success(
        `Module "${pendingModule.display_name}" đã ${pendingModule.status === 'ENABLED' ? 'tắt' : 'bật'}`,
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể thay đổi trạng thái module');
    } finally {
      setPendingModule(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Cấu hình Module"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Modules' }]}
          helpKey="module_config"
        />
        <Skeleton active />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cấu hình Module"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Modules' }]}
        helpKey="module_config"
      />

      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          Module Core <Tag color="blue">{coreModules.length}</Tag>
        </Title>
        <Row gutter={[12, 12]}>
          {coreModules.map((m) => (
            <Col key={m.module_key} xs={24} sm={12} md={8} lg={6}>
              <ModuleCard module={m} allModules={modules ?? []} onToggleRequest={handleToggleRequest} />
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Module Mở rộng <Tag color="purple">{extModules.length}</Tag>
        </Title>
        <Row gutter={[12, 12]}>
          {extModules.map((m) => (
            <Col key={m.module_key} xs={24} sm={12} md={8} lg={6}>
              <ModuleCard module={m} allModules={modules ?? []} onToggleRequest={handleToggleRequest} />
            </Col>
          ))}
        </Row>
      </div>

      <DependencyModal
        module={pendingModule}
        allModules={modules ?? []}
        open={!!pendingModule}
        onConfirm={handleConfirm}
        onCancel={() => setPendingModule(null)}
      />
    </div>
  );
}
