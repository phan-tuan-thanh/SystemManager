import { useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import { useCreateDeployment, useUpdateDeployment } from '../../../hooks/useDeployments';
import { useApplicationList } from '../../../hooks/useApplications';
import { useServerList } from '../../../hooks/useServers';
import type { AppDeployment } from '../../../types/deployment';

interface Props {
  open: boolean;
  deployment: AppDeployment | null;
  onClose: () => void;
}

export default function DeploymentForm({ open, deployment, onClose }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const create = useCreateDeployment();
  const update = useUpdateDeployment();
  const { data: apps } = useApplicationList({ limit: 200 });
  const { data: servers } = useServerList({ limit: 200 });

  useEffect(() => {
    if (open) {
      if (deployment) {
        form.setFieldsValue({
          ...deployment,
          deployed_at: deployment.deployed_at ? dayjs(deployment.deployed_at) : null,
          planned_at: deployment.planned_at ? dayjs(deployment.planned_at) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'RUNNING', environment: 'DEV' });
      }
    }
  }, [open, deployment, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const dto = {
      ...values,
      deployed_at: values.deployed_at ? values.deployed_at.toISOString() : undefined,
      planned_at: values.planned_at ? values.planned_at.toISOString() : undefined,
    };
    try {
      if (deployment) {
        await update.mutateAsync({ id: deployment.id, ...dto });
        message.success('Đã cập nhật deployment');
      } else {
        await create.mutateAsync(dto);
        message.success('Đã tạo deployment');
      }
      form.resetFields();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  };

  return (
    <Drawer
      title={deployment ? 'Sửa deployment' : 'Tạo deployment mới'}
      open={open}
      onClose={() => { form.resetFields(); onClose(); }}
      width={520}
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { form.resetFields(); onClose(); }}>Huỷ</button>
          <button onClick={handleOk}>{deployment ? 'Lưu' : 'Tạo'}</button>
        </div>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {!deployment && (
          <>
            <Form.Item label="Ứng dụng" name="application_id" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Chọn ứng dụng"
                filterOption={(input, option) =>
                  (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={(apps?.items ?? []).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))}
              />
            </Form.Item>
            <Form.Item label="Server" name="server_id" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Chọn server"
                filterOption={(input, option) =>
                  (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={(servers?.items ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name} (${s.environment})` }))}
              />
            </Form.Item>
            <Form.Item label="Môi trường" name="environment" rules={[{ required: true }]}>
              <Select options={[
                { value: 'DEV', label: 'DEV' },
                { value: 'UAT', label: 'UAT' },
                { value: 'PROD', label: 'PROD' },
              ]} />
            </Form.Item>
          </>
        )}
        <Form.Item label="Version" name="version" rules={[{ required: true }, { max: 50 }]}>
          <Input placeholder="VD: 2.1.0" />
        </Form.Item>
        <Form.Item label="Tiêu đề" name="title">
          <Input placeholder="VD: Core Banking v2.1.0 PROD" />
        </Form.Item>
        <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
          <Select options={[
            { value: 'RUNNING', label: 'Running' },
            { value: 'STOPPED', label: 'Stopped' },
            { value: 'DEPRECATED', label: 'Deprecated' },
          ]} />
        </Form.Item>
        <Form.Item label="CMC Name" name="cmc_name">
          <Input placeholder="VD: CMC-20260501-001" />
        </Form.Item>
        <Form.Item label="Deployer" name="deployer">
          <Input placeholder="Tên người deploy" />
        </Form.Item>
        <Form.Item label="Ngày triển khai" name="deployed_at">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Ngày kế hoạch" name="planned_at">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
