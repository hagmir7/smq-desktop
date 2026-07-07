import React, { useEffect, useState } from 'react';
import { Select, Input, Button, message } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

export default function Connection() {
    const [connection, setConnection] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [testing, setTesting] = useState(false);
    const [selectedValue, setSelectedValue] = useState(null);

    const connections = [
        { label: 'Local', value: 'http://192.168.1.38/api/' },
        { label: 'Online', value: 'https://intercocina.online/api/' },
        { label: 'Développement', value: 'http://localhost:8000/api/' },
        { label: 'Développement online', value: 'https://dev.intercocina.online/api/' },
        { label: 'Personnalisée', value: 'custom' },
    ];

    useEffect(() => {
        const savedConnection = localStorage.getItem('connection_url');
        if (savedConnection) {
            setConnection(savedConnection);
            setSelectedValue(
                connections.some(c => c.value === savedConnection) ? savedConnection : 'custom'
            );
        }
    }, []);

    const testUrl = async (url) => {
        try {
            const response = await fetch(url, {
                method: 'HEAD', 
                mode: 'no-cors',
                signal: AbortSignal.timeout(5000)
            });

            console.log(response)
            return response.type === 'opaque' || response.ok;
        } catch {
            return false;
        }
    };


    const saveUrl = (url) => {
        setConnection(url);
        localStorage.setItem('connection_url', url);
        message.success({ content: 'Connexion enregistrée ✅', icon: <CheckCircleOutlined /> });
        setTimeout(() => window.location.reload(), 500);
    };

    const handleSelect = async (value) => {
        setSelectedValue(value);

        if (value === 'custom') {
            setConnection('');
            return;
        }

        setTesting(true);
        message.loading({ content: 'Test de connexion en cours...', key: 'test', duration: 0 });

        const ok = await testUrl(value);
        setTesting(false);

        if (!ok) {
            message.error({
                content: `Impossible de joindre ${value} (pas de réponse 200)`,
                key: 'test',
                duration: 4,
                icon: <CloseCircleOutlined />,
            });
            return;
        }

        message.destroy('test');
        saveUrl(value);
    };

    const saveCustomUrl = async () => {
        if (!customUrl.startsWith('http')) {
            message.error("L'URL doit commencer par http ou https");
            return;
        }

        setTesting(true);
        message.loading({ content: 'Test de connexion en cours...', key: 'test', duration: 0 });

        const ok = await testUrl(customUrl);
        setTesting(false);

        if (!ok) {
            message.error({
                content: `Impossible de joindre ${customUrl} (pas de réponse 200)`,
                key: 'test',
                duration: 4,
                icon: <CloseCircleOutlined />,
            });
            return;
        }

        message.destroy('test');
        saveUrl(customUrl);
    };

    const showCustomInput =
        selectedValue === 'custom' ||
        (!selectedValue && (connection === '' || !connections.some(c => c.value === connection)));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
            <Select
                placeholder="Type de connexion"
                options={connections}
                onChange={handleSelect}
                value={selectedValue}
                disabled={testing}
                suffixIcon={testing ? <LoadingOutlined /> : undefined}
            />

            {showCustomInput && (
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