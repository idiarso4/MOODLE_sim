import React, { useState, useEffect } from 'react';
import { Table, Input, DatePicker, Select, Space, Button, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import { AuditLog } from '../types/auditLog';
import { auditLogService } from '../services/auditLog';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterParams {
  startDate?: string;
  endDate?: string;
  action?: string;
  resource?: string;
  userId?: string;
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterParams>({});

  const fetchLogs = async (params: FilterParams = {}) => {
    try {
      setLoading(true);
      const response = await auditLogService.getLogs(params);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDateChange = (dates: any) => {
    if (!dates) {
      const { startDate, endDate, ...rest } = filters;
      setFilters(rest);
      return;
    }

    setFilters({
      ...filters,
      startDate: dates[0].toISOString(),
      endDate: dates[1].toISOString(),
    });
  };

  const handleActionChange = (value: string) => {
    if (!value) {
      const { action, ...rest } = filters;
      setFilters(rest);
      return;
    }

    setFilters({
      ...filters,
      action: value,
    });
  };

  const handleResourceChange = (value: string) => {
    if (!value) {
      const { resource, ...rest } = filters;
      setFilters(rest);
      return;
    }

    setFilters({
      ...filters,
      resource: value,
    });
  };

  const handleSearch = () => {
    fetchLogs(filters);
  };

  const handleReset = () => {
    setFilters({});
    fetchLogs();
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: AuditLog, b: AuditLog) => moment(a.timestamp).unix() - moment(b.timestamp).unix(),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag color={text.includes('ERROR') ? 'error' : 'processing'}>{text}</Tag>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Audit Logs</h1>
      <Space style={{ marginBottom: '16px' }} size="middle">
        <RangePicker
          onChange={handleDateChange}
          value={filters.startDate && filters.endDate ? [
            moment(filters.startDate),
            moment(filters.endDate),
          ] : undefined}
        />
        <Select
          style={{ width: 200 }}
          placeholder="Select Action"
          allowClear
          onChange={handleActionChange}
          value={filters.action}
        >
          <Option value="LOGIN">LOGIN</Option>
          <Option value="LOGOUT">LOGOUT</Option>
          <Option value="CREATE">CREATE</Option>
          <Option value="UPDATE">UPDATE</Option>
          <Option value="DELETE">DELETE</Option>
          <Option value="ERROR">ERROR</Option>
        </Select>
        <Select
          style={{ width: 200 }}
          placeholder="Select Resource"
          allowClear
          onChange={handleResourceChange}
          value={filters.resource}
        >
          <Option value="user">User</Option>
          <Option value="attendance">Attendance</Option>
          <Option value="class">Class</Option>
          <Option value="schedule">Schedule</Option>
        </Select>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          Search
        </Button>
        <Button onClick={handleReset}>Reset</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{
          total: logs.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
};

export default AuditLogPage;
