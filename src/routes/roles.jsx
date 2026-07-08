import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Layout,
  List,
  Input,
  Empty,
  Spin,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Checkbox,
  Typography,
  Alert,
  Space,
  Divider,
  Modal,
} from 'antd';
import { SearchOutlined, SafetyCertificateOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { Edit, ShieldCheck, Trash } from 'lucide-react';
import { api } from '../utils/api';
import RightClickMenu from '../components/ui/RightClickMenu';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

// Context menu items shown when right-clicking a role in the sidebar list
const ROLE_MENU_ITEMS = [
  { label: 'Renommer', key: 'edit', icon: <Edit size={15} /> },
  { label: 'Supprimer', key: 'delete', danger: true, icon: <Trash size={15} /> },
];

/**
 * Roles
 * -----------------
 * Left: Ant Design List of roles (searchable, right-click to rename/delete).
 * Right: Permissions panel for whichever role is selected.
 */
function Roles() {
  // ----- Roles (left sidebar) -----
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // ----- Permissions (right panel) -----
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  // ----- Rename modal state -----
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');

  // ----- Delete state -----
  const [deletingId, setDeletingId] = useState(null);

  // ----- Create role modal state -----
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createValue, setCreateValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const capitalizeFirst = useCallback((str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }, []);

  // Fetch the list of roles once, on mount (and whenever we need a refresh)
  const fetchRoles = useCallback(async (preferredSelection) => {
    setRolesLoading(true);
    try {
      const res = await api.get('roles');
      const list = res.data || [];
      setRoles(list);

      setSelectedRoleId((prevSelected) => {
        const target = preferredSelection !== undefined ? preferredSelection : prevSelected;
        const stillExists = target && list.some((r) => r.name === target);
        if (stillExists) return target;
        return list.length > 0 ? list[0].name : null;
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch permissions + role detail whenever the selected role changes
  const fetchRoleData = useCallback(async (name) => {
    if (!name) {
      setRole(null);
      setSelectedPermissions([]);
      return;
    }
    setPermsLoading(true);
    setSaveMessage({ text: '', type: '' });
    try {
      const [permissionsResponse, roleResponse] = await Promise.all([
        api.get('permissions'),
        api.get(`roles/${name}`),
      ]);

      setPermissions(permissionsResponse.data || []);

      if (roleResponse.data) {
        setRole(roleResponse.data);
        const rolePerms =
          roleResponse.data.permissions?.map((p) => p.name || p) || [];
        setSelectedPermissions(rolePerms);
      }
    } catch (error) {
      console.error('Error fetching role data:', error);
      setSaveMessage({
        text: 'Échec du chargement des données. Veuillez actualiser la page.',
        type: 'error',
      });
    } finally {
      setPermsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoleData(selectedRoleId);
  }, [selectedRoleId, fetchRoleData]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const category = permission.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const totalPermissionsCount = useMemo(
    () => Object.values(groupedPermissions).flat().length,
    [groupedPermissions]
  );

  const allPermissionsSelected = useMemo(() => {
    const allPerms = Object.values(groupedPermissions).flat().map((p) => p.name);
    return allPerms.length > 0 && allPerms.every((p) => selectedPermissions.includes(p));
  }, [selectedPermissions, groupedPermissions]);

  const isPermissionSelected = useCallback(
    (permissionName) => selectedPermissions.includes(permissionName),
    [selectedPermissions]
  );

  const togglePermission = useCallback((permissionName) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  }, []);

  const toggleAllPermissions = useCallback(() => {
    const allPerms = Object.values(groupedPermissions).flat().map((p) => p.name);
    setSelectedPermissions((prev) => (prev.length === allPerms.length ? [] : allPerms));
  }, [groupedPermissions]);

  const savePermissions = useCallback(async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setSaveMessage({ text: '', type: '' });

    try {
      await api.put(`roles/${selectedRoleId}/permissions`, {
        permissions: selectedPermissions,
      });

      setSaveMessage({ text: 'Autorisations mises à jour avec succès.', type: 'success' });
      await fetchRoleData(selectedRoleId);
    } catch (error) {
      console.error('Error saving permissions:', error);
      setSaveMessage({
        text: error.response?.data?.message || 'Échec de la mise à jour des autorisations. Veuillez réessayer.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [selectedRoleId, selectedPermissions, fetchRoleData]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.trim().toLowerCase();
    return roles.filter((r) => (r.name || '').toLowerCase().includes(q));
  }, [roles, roleSearch]);

  // ----- Rename (update) handlers -----
  const openRenameModal = useCallback(
    (id) => {
      const target = roles.find((r) => r.name === id);
      setRenameTargetId(id);
      setRenameValue(target ? target.name : id);
      setRenameError('');
      setRenameModalOpen(true);
    },
    [roles]
  );

  const closeRenameModal = useCallback(() => {
    if (renaming) return;
    setRenameModalOpen(false);
    setRenameTargetId(null);
    setRenameValue('');
    setRenameError('');
  }, [renaming]);

  const submitRename = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('Le nom du rôle ne peut pas être vide.');
      return;
    }
    if (!renameTargetId) return;

    setRenaming(true);
    setRenameError('');
    try {
      await api.put(`roles/${renameTargetId}`, { name: trimmed });
      const wasSelected = selectedRoleId === renameTargetId;
      await fetchRoles(wasSelected ? trimmed : undefined);
      setRenameModalOpen(false);
      setRenameTargetId(null);
      setRenameValue('');
    } catch (error) {
      console.error('Error renaming role:', error);
      setRenameError(error.response?.data?.message || 'Échec du renommage du rôle. Veuillez réessayer.');
    } finally {
      setRenaming(false);
    }
  }, [renameValue, renameTargetId, selectedRoleId, fetchRoles]);

  // ----- Delete handlers -----
  const confirmDeleteRole = useCallback(
    (id) => {
      const target = roles.find((r) => r.name === id);
      const displayName = capitalizeFirst(target ? target.name : id);

      Modal.confirm({
        title: `Supprimer le rôle « ${displayName} » ?`,
        content: "Cette action supprimera définitivement le rôle et ses autorisations associées. Cette action est irréversible.",
        okText: 'Supprimer',
        okButtonProps: { danger: true },
        cancelText: 'Annuler',
        onOk: async () => {
          setDeletingId(id);
          try {
            await api.delete(`roles/${id}`);
            const wasSelected = selectedRoleId === id;
            await fetchRoles(wasSelected ? null : undefined);
          } catch (error) {
            console.error('Error deleting role:', error);
            Modal.error({
              title: 'Échec de la suppression du rôle',
              content: error.response?.data?.message || 'Veuillez réessayer.',
            });
          } finally {
            setDeletingId(null);
          }
        },
      });
    },
    [roles, selectedRoleId, fetchRoles, capitalizeFirst]
  );

  // ----- Create (add) handlers -----
  const openCreateModal = useCallback(() => {
    setCreateValue('');
    setCreateError('');
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    if (creating) return;
    setCreateModalOpen(false);
    setCreateValue('');
    setCreateError('');
  }, [creating]);

  const submitCreate = useCallback(async () => {
    const trimmed = createValue.trim();
    if (!trimmed) {
      setCreateError('Le nom du rôle ne peut pas être vide.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      await api.post('roles', { name: trimmed });
      await fetchRoles(trimmed);
      setCreateModalOpen(false);
      setCreateValue('');
    } catch (error) {
      console.error('Error creating role:', error);
      setCreateError(error.response?.data?.message || 'Échec de la création du rôle. Veuillez réessayer.');
    } finally {
      setCreating(false);
    }
  }, [createValue, fetchRoles]);

  // Single handler passed to every RightClickMenu instance
  const handleRoleMenuClick = useCallback(
    (key, id) => {
      if (key === 'edit') {
        openRenameModal(id);
      } else if (key === 'delete') {
        confirmDeleteRole(id);
      }
    },
    [openRenameModal, confirmDeleteRole]
  );

  return (
    <Layout style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
      {/* ---------------- Left: Roles sidebar ---------------- */}
      <Sider
        width={288}
        breakpoint="md"
        collapsedWidth={0}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined />
            Rôles
          </Title>
          <Space.Compact style={{ width: '100%', marginTop: 12 }}>
            <Input
              placeholder="Rechercher un rôle..."
              prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.35)' }} />}
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              allowClear
            />
            <Button
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              title="Ajouter un rôle"
              aria-label="Ajouter un rôle"
            />
          </Space.Compact>
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {rolesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="small" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div style={{ padding: '32px 16px' }}>
              <Empty description="Aucun rôle trouvé" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredRoles}
              renderItem={(r) => {
                const active = r.name === selectedRoleId;
                const isDeleting = deletingId === r.name;
                return (
                  <RightClickMenu
                    key={r.name}
                    menuItems={ROLE_MENU_ITEMS}
                    onItemClick={(key, id) => handleRoleMenuClick(key, id || r.name)}
                  >
                    <List.Item
                      onClick={() => setSelectedRoleId(r.name)}
                      style={{
                        padding: '12px 16px',
                        margin: 0,
                        cursor: 'pointer',
                        opacity: isDeleting ? 0.5 : 1,
                        borderLeft: `2px solid ${active ? '#52c41a' : 'transparent'}`,
                        background: active ? '#f6ffed' : 'transparent',
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: 500, color: active ? '#389e0d' : undefined }}>
                          {capitalizeFirst(r.name)}
                        </Text>
                        {typeof r.permissions?.length === 'number' && (
                          <Tag color={active ? 'green' : 'default'} style={{ margin: 0 }}>
                            {r.permissions.length}
                          </Tag>
                        )}
                      </Space>
                    </List.Item>
                  </RightClickMenu>
                );
              }}
            />
          )}
        </div>
      </Sider>

      {/* ---------------- Right: Permissions panel ---------------- */}
      <Content style={{ minWidth: 0, background: '#fff' }}>
        {permsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
            <Spin size="large" />
          </div>
        ) : !role ? (
          <Empty
            image={<LockOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
            description={
              <div>
                <Text strong>Sélectionnez un rôle</Text>
                <div>
                  <Text type="secondary">Choisissez un rôle dans la liste pour gérer ses autorisations.</Text>
                </div>
              </div>
            }
            style={{ padding: '48px 0' }}
          />
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: '8px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div>
                <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} />
                  Autorisations : {capitalizeFirst(role.role)}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Gérer les contrôles d'accès pour ce rôle
                </Text>
              </div>

              <Button type="primary" loading={saving} disabled={saving || permsLoading} onClick={savePermissions}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status message */}
              {saveMessage.text && (
                <Alert
                  type={saveMessage.type === 'success' ? 'success' : 'error'}
                  message={saveMessage.text}
                  showIcon
                  closable
                  onClose={() => setSaveMessage({ text: '', type: '' })}
                />
              )}

              {/* Role information */}
              <Card size="small" style={{ background: '#fafafa' }} bodyStyle={{ padding: 12 }}>
                <Space wrap size={12}>
                  <Tag color="default" style={{ padding: '4px 10px', fontSize: 13, fontWeight: 500 }}>
                    {capitalizeFirst(role.role)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <Text strong>{selectedPermissions.length}</Text> autorisation(s) sur{' '}
                    <Text strong>{totalPermissionsCount}</Text> sélectionnée(s)
                  </Text>
                </Space>
              </Card>

              {/* Permissions section */}
              <div>
                {Object.keys(groupedPermissions).length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <Button type="link" onClick={toggleAllPermissions} disabled={permsLoading} style={{ paddingRight: 0 }}>
                      {allPermissionsSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                  </div>
                )}

                {Object.keys(groupedPermissions).length === 0 ? (
                  <Empty
                    image={<SafetyCertificateOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
                    description={<Text type="secondary">Aucune autorisation disponible</Text>}
                    style={{ padding: '32px 0' }}
                  />
                ) : (
                  Object.entries(groupedPermissions).map(([category, perms]) => {
                    const selectedCount = perms.filter((p) => isPermissionSelected(p.name)).length;
                    return (
                      <div key={category} style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                          }}
                        >
                          <Title level={5} style={{ margin: 0 }}>
                            {category}
                          </Title>
                          <Tag color={selectedCount === perms.length ? 'green' : 'default'}>
                            {selectedCount}/{perms.length} sélectionnée(s)
                          </Tag>
                        </div>

                        <Row gutter={[16, 16]}>
                          {perms.map((permission) => {
                            const isSelected = isPermissionSelected(permission.name);
                            return (
                              <Col xs={24} md={12} lg={8} key={permission.id}>
                                <Card
                                  hoverable
                                  size="small"
                                  onClick={() => togglePermission(permission.name)}
                                  role="checkbox"
                                  aria-checked={isSelected}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') togglePermission(permission.name);
                                  }}
                                  style={{
                                    borderColor: isSelected ? '#b7eb8f' : undefined,
                                    backgroundColor: isSelected ? '#f6ffed' : undefined,
                                    cursor: 'pointer',
                                  }}
                                  bodyStyle={{ padding: 12 }}
                                >
                                  <Space align="start" size={12}>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => togglePermission(permission.name)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                      <Text strong style={{ fontSize: 14 }}>
                                        {permission.name}
                                      </Text>
                                      {permission.description && (
                                        <div>
                                          <Text type="secondary" style={{ fontSize: 12 }}>
                                            {permission.description}
                                          </Text>
                                        </div>
                                      )}
                                    </div>
                                  </Space>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                        <Divider style={{ margin: '16px 0 0' }} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </Content>

      {/* ---------------- Rename role modal ---------------- */}
      <Modal
        title="Renommer le rôle"
        open={renameModalOpen}
        onOk={submitRename}
        onCancel={closeRenameModal}
        confirmLoading={renaming}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={submitRename}
          placeholder="Nom du rôle"
          autoFocus
        />
        {renameError && (
          <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {renameError}
          </Text>
        )}
      </Modal>

      {/* ---------------- Create role modal ---------------- */}
      <Modal
        title="Ajouter un rôle"
        open={createModalOpen}
        onOk={submitCreate}
        onCancel={closeCreateModal}
        confirmLoading={creating}
        okText="Créer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Input
          value={createValue}
          onChange={(e) => setCreateValue(e.target.value)}
          onPressEnter={submitCreate}
          placeholder="Nom du nouveau rôle"
          autoFocus
        />
        {createError && (
          <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            {createError}
          </Text>
        )}
      </Modal>
    </Layout>
  );
}

export default Roles;