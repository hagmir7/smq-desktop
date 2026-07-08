import React from "react";
import { Dropdown, Menu } from "antd";

/**
 * Reusable RightClickMenu component
 * @param {React.ReactNode} children - Element to right-click on
 * @param {Array} menuItems - Array of menu items [{ label: string, key: string, id?: string }]
 * @param {Function} onItemClick - Callback when an item is clicked (receives key and id)
 */
const RightClickMenu = ({ children, menuItems, onItemClick }) => {
  // Transform menu items to include id in key if provided
  const transformedItems = menuItems.map(item => ({
    ...item,
    key: item.id ? `${item.key}-${item.id}` : item.key
  }));

  const menu = (
    <Menu
      onClick={({ key }) => {
        const [itemKey, id] = key.split("-");
        onItemClick(itemKey, id); // id could be undefined
      }}
      items={transformedItems}
    />
  );

  return (
    <Dropdown overlay={menu} trigger={["contextMenu"]}>
      {children}
    </Dropdown>
  );
};

export default RightClickMenu;
