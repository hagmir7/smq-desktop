import { UserOutlined } from '@ant-design/icons';
import { Dropdown, Space, Avatar } from 'antd';
import { ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserAvatar = () => (
    <Space direction='vertical'>
        <Avatar icon={<UserOutlined />} size={40} />
    </Space>
)

const DropMenu = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handelLogout = async () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')

        if (window.electron) {
            await window.electron.logout();
            console.log("Working");

        } else {
            navigate('/login')
        }
    }


    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        const fetchVersion = async () => {
            if (window.electron?.version) {
                const version = await window.electron.version();
                setAppVersion(version);
            }
        };
        fetchVersion();
    }, []);

    const items = [
        {
            key: '1',
            label: user ? user.full_name : "INTERCOCINA",
            disabled: true,
        },
        // {
        //     key: '2',
        //     label: 'Profile',
        //     icon: <User2 />,
        //     extra: '⌘P',
        // },
        {
            key: '3',
            label: `V${appVersion}`,
            disabled: true,
            hidden: !window.electron
        },
        {
            key: '4',
            label: 'Déconnexion',
            icon: <ArrowRightCircle />,
            extra: '⌘S',
            onClick: handelLogout
        },
    ];


    return (
        <Dropdown menu={{ items }}>
            <a onClick={e => e.preventDefault()}>
                <UserAvatar />
            </a>
        </Dropdown>
    );
}

export default DropMenu;