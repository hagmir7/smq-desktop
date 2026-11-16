import React, { useState } from 'react';
import { Select, Input, Button, message } from 'antd';
import {
    LoadingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { DEFAULT_URL } from '../utils/api';

// Do NOT use BASE_URL here: it may already come from localStorage
const CONNECTIONS = [
    { label: 'Local', value: 'local', url: DEFAULT_URL }, // http://192.168.1.56:30/api/
    { label: 'Online', value: 'online', url: 'https://smq.intercocina.online/api/' },
    { label: 'Développement', value: 'dev', url: 'http://localhost:8000/api/' },
    { label: 'Personnalisée', value: 'custom', url: '' },
];

const urlFromKey = (key) => CONNECTIONS.find((c) => c.value === key)?.url;

// Read storage synchronously so the Select is correct on the first render
const getInitial = () => {
    const savedUrl = localStorage.getItem('connection_url');
    let savedKey = localStorage.getItem('connection_key');

    if (!savedUrl) {
        return { key: 'local', url: urlFromKey('local') };
    }
    if (!savedKey || !CONNECTIONS.some((c) => c.value === savedKey)) {
        savedKey =
            CONNECTIONS.find((c) => c.value !== 'custom' && c.url === savedUrl)
                ?.value ?? 'custom';
    }
    return { key: savedKey, url: savedUrl };
};

export default function Connection() {
    const initial = getInitial();

    const [activeKey, setActiveKey] = useState(initial.key);
    const [selectedKey, setSelectedKey] = useState(initial.key);
    const [customUrl, setCustomUrl] = useState(
        initial.key === 'custom' ? initial.url : ''
    );
    const [testing, setTesting] = useState(false);

    const testUrl = async (url) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal,
            });
            return response.type === 'opaque' || response.ok;
        } catch {
            return false;
        } finally {
            clearTimeout(timer);
        }
    };

    const saveConnection = (key, url) => {
        localStorage.setItem('connection_url', url);
        localStorage.setItem('connection_key', key);
        setActiveKey(key);

        message.success({
            content: 'Connexion enregistrée ✅',
            icon: <CheckCircleOutlined />,
        });

        setTimeout(() => window.location.reload(), 500);
    };

    const testAndSave = async (key, url) => {
        setTesting(true);
        message.loading({ content: 'Test de connexion en cours...', key: 'test', duration: 0 });

        const ok = await testUrl(url);
        setTesting(false);

        if (!ok) {
            message.error({
                content: `Impossible de joindre ${url}`,
                key: 'test',
                duration: 4,
                icon: <CloseCircleOutlined />,
            });
            if (key !== 'custom') setSelectedKey(activeKey); // roll back
            return;
        }

        message.destroy('test');
        saveConnection(key, url);
    };

    const handleSelect = (key) => {
        setSelectedKey(key);
        if (key === 'custom') {
            setCustomUrl('');
            return;
        }
        testAndSave(key, urlFromKey(key));
    };

    const saveCustomUrl = () => {
        const url = customUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
            message.error("L'URL doit commencer par http:// ou https://");
            return;
        }
        testAndSave('custom', url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
            <Select
                placeholder="Type de connexion"
                options={CONNECTIONS.map(({ label, value }) => ({ label, value }))}
                onChange={handleSelect}
                value={selectedKey}
                disabled={testing}
                suffixIcon={testing ? <LoadingOutlined /> : undefined}
            />

            {selectedKey === 'custom' && (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                        placeholder="Entrez votre URL personnalisée"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        disabled={testing}
                        onPressEnter={saveCustomUrl}
                    />
                    <Button type="primary" onClick={saveCustomUrl} loading={testing}>
                        Sauvegarder
                    </Button>
                </div>
            )}
        </div>
    );
}