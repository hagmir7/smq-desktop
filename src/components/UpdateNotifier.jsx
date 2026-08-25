import React, { useEffect, useState } from 'react';

import { notification, Progress, Button, Space } from 'antd';

import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';

// Communique avec electron/preload.js -> electron/main.js -> electron-updater.
// N'affiche rien de visible, à l'exception des notifications toast.
// Le composant peut donc être placé n'importe où dans l'arbre React
// (idéalement monté une seule fois, près de la racine de l'application).

export default function UpdateNotifier() {
  const [api, contextHolder] = notification.useNotification();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!window.updater) return; // Pas exécuté dans Electron (ex. aperçu dans un navigateur)

    const offAvailable = window.updater.onUpdateAvailable((info) => {
      api.info({
        key: 'update-available',
        message: 'Mise à jour disponible',
        description: `La version ${info?.version ?? ''} est en cours de téléchargement en arrière-plan.`,
        icon: <DownloadOutlined style={{ color: '#1677ff' }} />,
        duration: 4,
      });
    });

    const offProgress = window.updater.onDownloadProgress((data) => {
      setProgress(Math.round(data.percent));
    });

    const offDownloaded = window.updater.onUpdateDownloaded((info) => {
      setProgress(null);

      api.success({
        key: 'update-downloaded',
        message: 'Mise à jour prête à être installée',
        description: (
          <Space direction="vertical">
            <span>
              La version {info?.version ?? ''} a été téléchargée.
            </span>

            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => window.updater.quitAndInstall()}
            >
              Redémarrer et installer
            </Button>
          </Space>
        ),
        duration: 0,
      });
    });

    const offError = window.updater.onUpdateError((message) => {
      console.error('Erreur de mise à jour automatique :', message);
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
          <div className="text-xs text-gray-500 mb-1">
            Téléchargement de la mise à jour…
          </div>

          <Progress percent={progress} size="small" />
        </div>
      )}
    </>
  );
}