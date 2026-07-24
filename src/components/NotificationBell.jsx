// src/components/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin, Typography, Divider } from 'antd';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ReclamationModalSeps from './ReclamationModalSeps';

dayjs.extend(relativeTime);

const { Text } = Typography;

// Map notification "type" (FQCN from Laravel) to a click destination
const NOTIFICATION_ROUTES = {
  'App\\Notifications\\CorrectiveActionCreated': (data) => `/reclamations?reclamation_id=${data.reclamation_id}`,
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (open) {
      fetchNotifications({ per_page: 8 });
    }
  }, [open, fetchNotifications]);

  const handleItemClick = async (notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    const resolveRoute = NOTIFICATION_ROUTES[notification.type];
    if (resolveRoute) {

      navigate(resolveRoute(notification.data));
    }
    setOpen(false);
  };

  const dropdownContent = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100" style={{ width: 360 }}>
      <div className="flex items-center justify-between px-4 py-3">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckCheck size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>
      <Divider className="m-0" />

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Aucune notification"
            className="py-8"
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                onClick={() => handleItemClick(notification)}
                className={`cursor-pointer px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.read_at ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start gap-2 w-full">
                  {!notification.read_at && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
                  )}
                  <div className={!notification.read_at ? 'ml-0' : 'ml-4'}>
                    <Text className="block text-sm">{notification.data?.message}</Text>
                    <Text type="secondary" className="text-xs">
                      {dayjs(notification.created_at).fromNow()}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>


      <Divider className="m-0" />
      <div className="text-center py-2">
        <Button
          type="link"
          size="small"
          onClick={() => {
            setOpen(false);
            navigate('/notifications');
          }}
        >
          Voir toutes les notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      dropdownRender={() => dropdownContent}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} />
        </button>
      </Badge>
    </Dropdown>
  );
}