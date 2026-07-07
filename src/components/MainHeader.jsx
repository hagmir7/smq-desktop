import React from 'react'
import { Layout } from 'antd';

const { Header } = Layout;

export default function MainHeader() {
    return (
        <Header className="titlebar-drag flex items-center bg-white border-b border-gray-100 px-4 h-12 leading-none">
             <div className="demo-logo" />
            <span className="titlebar-no-drag font-semibold text-gray-700">
                Electron React App
            </span>
        </Header>
    )
}
