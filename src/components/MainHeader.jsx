import React from 'react'
import { Layout } from 'antd';
import DropMenu from './DropMenu';

const { Header } = Layout;

export default function MainHeader({appVersion}) {
    return (
        <Header className="titlebar-drag flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 leading-none shadow-sm relative z-10">
            <span className="titlebar-no-drag font-semibold text-gray-700" id='title'>
                Tableau de bord
            </span>
            <span className="titlebar-no-drag">
                <DropMenu appVersion={appVersion}/>
            </span>
        </Header>
    )
}
