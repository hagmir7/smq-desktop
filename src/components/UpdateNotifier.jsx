import React, { useEffect, useState } from 'react';
import { notification, Progress, Button, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';

// Talks to electron/preload.js -> electron/main.js -> electron-updater.
// Renders nothing visible except toast notifications, so it can sit
// anywhere in the tree (mounted once, near the app root).
export default function UpdateNotifier() {
  const [api, contextHolder] = notification.useNotification();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!window.updater) return; // not running inside Electron (e.g. plain browser preview)

    const offAvailable = window.updater.onUpdateAvailable((info) => {
      api.info({
        key: 'update-available',
        message: 'Update available',
        description: `Version ${info?.version ?? ''} is downloading in the background.`,
        icon: <DownloadOutlined style={{ color: '#1677ff' }} />,
        duration: 4
      });
    });

    const offProgress = window.updater.onDownloadProgress((data) => {
      setProgress(Math.round(data.percent));
    });

    const offDownloaded = window.updater.onUpdateDownloaded((info) => {
      setProgress(null);
      api.success({
        key: 'update-downloaded',
        message: 'Update ready to install',
        description: (
          <Space direction="vertical">
            <span>Version {info?.version ?? ''} has been downloaded.</span>
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => window.updater.quitAndInstall()}
            >
              Restart and install
            </Button>
          </Space>
        ),
        duration: 0
      });
    });

    const offError = window.updater.onUpdateError((message) => {
      console.error('Auto-update error:', message);
    });

    return () => {
      offAvailable?.();
      offProgress?.();
      offDownloaded?.();
      offError?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {contextHolder}
      {progress !== null && (
        <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg bg-white p-3 shadow-lg border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Downloading update…</div>
          <Progress percent={progress} size="small" />
        </div>
      )}
    </>
  );
}
