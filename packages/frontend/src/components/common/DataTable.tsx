import { Table, TableProps } from 'antd';

interface DataTableProps<T> extends TableProps<T> {
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export default function DataTable<T extends object>({
  total,
  page,
  pageSize = 20,
  onPageChange,
  ...tableProps
}: DataTableProps<T>) {
  return (
    <Table<T>
      {...tableProps}
      size="middle"
      pagination={
        total !== undefined
          ? {
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} bản ghi`,
              onChange: onPageChange,
            }
          : false
      }
    />
  );
}
