import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { useNetworkConfigList, useDeleteNetworkConfig } from '../../hooks/useNetworkConfigs';
import type { NetworkConfig } from '../../types/server';

const ENV_COLOR: Record<string, string> = { DEV: 'blue', UAT: 'orange', PROD: 'red' };

export default function NetworkListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<string | undefined>();
  const [ipFilter, setIpFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { data, isLoading } = useNetworkConfigList({
    page,
    limit,
    environment: envFilter,
    search: search || undefined,
    ip: ipFilter || undefined,
  });
  const deleteNetwork = useDeleteNetworkConfig();

  const handleDelete = async (id: string) => {
    try {
      await deleteNetwork.mutateAsync(id);
      message.success('Đã xoá network config');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message ?? 'Không thể xoá network config');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteNetwork.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Đã xoá ${succeeded} network config`);
    if (failed > 0) message.error(`${failed} config không thể xoá (server đang có deployment)`);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<NetworkConfig> = [
    {
      title: 'Server',
      key: 'server',
      render: (_: unknown, r: NetworkConfig) => r.server ? (
        <a onClick={() => navigate(`/servers/${r.server!.id}`)}>{r.server.name}</a>
      ) : '—',
    },
    {
      title: 'Môi trường',
      key: 'env',
      width: 100,
      render: (_: unknown, r: NetworkConfig) => r.server ? (
        <Tag color={ENV_COLOR[r.server.environment]}>{r.server.environment}</Tag>
      ) : '—',
    },
    { title: 'Interface', dataIndex: 'interface', key: 'interface', width: 80 },
    {
      title: 'Private IP',
      dataIndex: 'private_ip',
      key: 'private_ip',
      render: (ip: string) => ip ? <Tag color="blue">{ip}</Tag> : '—',
    },
    {
      title: 'Public IP',
      dataIndex: 'public_ip',
      key: 'public_ip',
      render: (ip: string) => ip ? <Tag color="green">{ip}</Tag> : '—',
    },
    {
      title: 'NAT IP',
      dataIndex: 'nat_ip',
      key: 'nat_ip',
      render: (ip: string) => ip || '—',
    },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', ellipsis: true },
    { title: 'Subnet', dataIndex: 'subnet', key: 'subnet' },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_: unknown, record: NetworkConfig) => (
        <Popconfirm
          title="Xoá network config này?"
          description="Chỉ xoá được nếu server không có ứng dụng đang chạy."
          onConfirm={() => handleDelete(record.id)}
          okText="Xoá"
          cancelText="Huỷ"
          okType="danger"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <App>
      <PageHeader
        title="Network Configs"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Networks' }]}
        helpKey="network"
        extra={
          selectedRowKeys.length > 0 ? (
            <Popconfirm
              title={`Xoá ${selectedRowKeys.length} network config đã chọn?`}
              onConfirm={handleBulkDelete}
              okText="Xoá"
              cancelText="Huỷ"
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />}>
                Xoá {selectedRowKeys.length} mục
              </Button>
            </Popconfirm>
          ) : undefined
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo domain..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 220 }}
        />
        <Input
          placeholder="Lọc theo IP..."
          value={ipFilter}
          onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 160 }}
        />
        <Select
          placeholder="Môi trường"
          value={envFilter}
          onChange={(v) => { setEnvFilter(v); setPage(1); }}
          allowClear
          style={{ width: 130 }}
        >
          <Select.Option value="DEV">DEV</Select.Option>
          <Select.Option value="UAT">UAT</Select.Option>
          <Select.Option value="PROD">PROD</Select.Option>
        </Select>
      </Space>

      <DataTable<NetworkConfig>
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        total={data?.total}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        onRow={(r) => ({ onDoubleClick: () => r.server && navigate(`/servers/${r.server.id}`) })}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />
    </App>
  );
}
