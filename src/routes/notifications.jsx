import React, { useEffect, useState } from 'react';
import { List, Tabs, Button, Empty, Spin, Typography, Popconfirm, Dropdown, Layout, Space } from 'antd';
import { CheckCheck, MoreVertical, Trash2, MailOpen, Mail, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Content, Header } = Layout

const NOTIFICATION_ROUTES = {
    'App\\Notifications\\CorrectiveActionCreated': (data) => `/reclamations?reclamation_id=${data.reclamation_id}`,
};

export default function Notifications() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('all');
    const {
        notifications,
        unreadCount,
        pagination,
        loading,
        fetchNotifications,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        remove,
    } = useNotifications({ poll: false });

    const loadPage = (page = 1, statusFilter = status) => {
        fetchNotifications({
            page,
            per_page: 15,
            ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        });
    };

    useEffect(() => {
        loadPage(1, status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handleOpen = async (notification) => {
        if (!notification.read_at) {
            await markAsRead(notification.id);
        }
        const resolveRoute = NOTIFICATION_ROUTES[notification.type];
        if (resolveRoute) {
            navigate(resolveRoute(notification.data));
        }
    };

    return (

        <Layout className="min-h-full bg-slate-100">
            <Header
                className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200"
                style={{ height: 64, lineHeight: '64px' }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
                        <BellRing size={18} />
                    </div>
                    <div className="leading-tight">
                        <div className="text-base font-semibold text-slate-900">Notifications</div>
                        <div className="text-xs text-slate-500">Gestionnaire de notifications</div>
                    </div>
                </div>

                <Space>
                    {unreadCount > 0 && (
                        <Button icon={<CheckCheck size={16} />} onClick={markAllAsRead}>
                            Tout marquer comme lu ({unreadCount})
                        </Button>
                    )}
                </Space>
            </Header>

            <Content>
                <div className="p-4">
                    <div className='bg-white rounded-lg'>
                        <Tabs
                            size='small'
                            activeKey={status}
                            onChange={setStatus}
                            className="bg-white rounded-md px-2"
                            items={[
                                { key: 'all', label: 'Toutes' },
                                { key: 'unread', label: `Non lues${unreadCount ? ` (${unreadCount})` : ''}` },
                                { key: 'read', label: 'Lues' },
                            ]}
                        />

                        <Spin spinning={loading}>
                            {notifications.length === 0 && !loading ? (
                                <div className="bg-white rounded-b-md rounded-t-none py-12">
                                    <Empty description="Aucune notification" />
                                </div>
                            ) : (
                                <List
                                    className="bg-white rounded-md px-2 pb-2"
                                    size='small'
                                    dataSource={notifications}
                                    pagination={{
                                        current: pagination.current_page,
                                        total: pagination.total,
                                        pageSize: 15,
                                        onChange: (page) => loadPage(page),
                                        size: 'small',
                                        showSizeChanger: false,
                                    }}
                                    renderItem={(notification) => (
                                        <List.Item
                                            className={`rounded-lg px-4 mb-2 border ${!notification.read_at ? 'bg-green-50 border-green-100' : 'border-gray-100'
                                                }`}
                                            actions={[
                                                <Dropdown
                                                    key="actions"
                                                    menu={{
                                                        items: [
                                                            notification.read_at
                                                                ? {
                                                                    key: 'unread',
                                                                    icon: <Mail size={14} />,
                                                                    label: 'Marquer non lu',
                                                                    onClick: () => markAsUnread(notification.id),
                                                                }
                                                                : {
                                                                    key: 'read',
                                                                    icon: <MailOpen size={14} />,
                                                                    label: 'Marquer comme lu',
                                                                    onClick: () => markAsRead(notification.id),
                                                                },
                                                            {
                                                                key: 'delete',
                                                                danger: true,
                                                                icon: <Trash2 size={14} />,
                                                                label: (
                                                                    <Popconfirm
                                                                        title="Supprimer cette notification ?"
                                                                        onConfirm={() => remove(notification.id)}
                                                                        okText="Supprimer"
                                                                        cancelText="Annuler"
                                                                    >
                                                                        Supprimer
                                                                    </Popconfirm>
                                                                ),
                                                            },
                                                        ],
                                                    }}
                                                    trigger={['click']}
                                                >
                                                    <Button type="text" icon={<MoreVertical size={16} />} />
                                                </Dropdown>,
                                            ]}
                                        >
                                            <div
                                                className="flex items-start gap-3 cursor-pointer w-full"
                                                onClick={() => handleOpen(notification)}
                                            >
                                                {!notification.read_at && (
                                                    <span className="mt-2 w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
                                                )}
                                                <div className={!notification.read_at ? '' : 'ml-5'}>
                                                    <Text className={!notification.read_at ? 'font-medium' : ''}>
                                                        {notification.data?.message}
                                                    </Text>
                                                    <div>
                                                        <Text type="secondary" className="text-xs">
                                                            {dayjs(notification.created_at).fromNow()}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Spin>
                    </div>
                </div>
            </Content>
        </Layout>
    );
}