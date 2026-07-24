import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Layout, Table, Input, Button, Space, Tooltip, Modal, Form, Popconfirm, message, Select } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Pyramid, Plus } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const { Header, Content } = Layout

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [responsibles, setResponsibles] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const { permissions } = useAuth()

  const searchDebounce = useRef(null)

  const loadData = useCallback(
    async (page = 1, pageSize = pagination.pageSize, searchValue = search) => {
      setLoading(true)
      try {
        const res = await api.get('services', {
          params: {
            page,
            per_page: pageSize,
            ...(searchValue ? { search: searchValue } : {}),
          },
        })
        const payload = res.data
        setServices(payload.data ?? [])
        setPagination({
          current: payload.current_page ?? 1,
          pageSize: payload.per_page ?? pageSize,
          total: payload.total ?? 0,
        })
      } catch (err) {
        message.error('Impossible de charger la liste des processus.')
      } finally {
        setLoading(false)
      }
    },
    [pagination.pageSize, search]
  )

  const loadResponsibles = useCallback(async () => {
    try {
      const res = await api.get('users')
      setResponsibles(
        res?.data?.data?.map((item) => ({
          label: item.full_name,
          value: item.id,
        })) || []
      )
    } catch (err) {
      message.error('Erreur lors du chargement des données.')
    }
  }, [])

  useEffect(() => {
    loadData(1, pagination.pageSize, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search: reset to page 1 whenever the query changes
  const handleSearchChange = (value) => {
    setSearch(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      loadData(1, pagination.pageSize, value)
    }, 400)
  }

  const handleTableChange = (paginationConfig) => {
    loadData(paginationConfig.current, paginationConfig.pageSize, search)
  }

  // ---- CREATE / UPDATE ----
  const openCreateModal = () => {
    setEditingService(null)
    form.resetFields()
    setModalOpen(true)
    loadResponsibles()
  }

  const openEditModal = (record) => {
    setEditingService(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      responsible_id: record.responsible_id ? Number(record.responsible_id) : undefined,
    })
    setModalOpen(true)
    loadResponsibles()
  }

  const closeModal = () => {
    setModalOpen(false)
    form.resetFields()
    setEditingService(null)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      if (editingService) {
        // PUT /api/services/{id}
        await api.put(`services/${editingService.id}`, values)
        message.success('Process mis à jour avec succès')
      } else {
        // POST /api/services
        await api.post('services', values)
        message.success('Process créé avec succès')
      }

      closeModal()
      loadData(editingService ? pagination.current : 1, pagination.pageSize, search)
    } catch (err) {
      if (err?.errorFields) return // antd form validation error, already shown inline
      message.error(err?.response?.data?.message || "Une erreur est survenue lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // ---- DELETE: DELETE /api/services/{id} ----
  const handleDelete = async (id) => {
    try {
      await api.delete(`services/${id}`)
      message.success('Process supprimé avec succès')
      // If we just deleted the last row on a page beyond page 1, step back a page
      const isLastRowOnPage = services.length === 1 && pagination.current > 1
      loadData(isLastRowOnPage ? pagination.current - 1 : pagination.current, pagination.pageSize, search)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Suppression impossible')
    }
  }

  const columns = [
    { title: 'Matricule', dataIndex: 'code', key: 'code', width: 80 },
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || <span className="text-slate-400">—</span>,
    },
    {
      title: 'Responsable',
      key: 'responsible',
      width: 220,
      render: (_, record) =>
        record.responsible ? (
          <div className="leading-tight">
            <div className="text-slate-800">{record.responsible.full_name}</div>
            <div className="text-xs text-slate-400">{record.responsible.email}</div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button disabled={!permissions("modifier.processus")} size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer ce process ?"
            description="Cette action est irréversible."
            okText="Supprimer"
            okButtonProps={{ danger: true }}
            cancelText="Annuler"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Supprimer">
              <Button disabled={!permissions("supprimer.processus")} size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Layout className="min-h-full bg-slate-100">
      <Header
        className="flex items-center justify-between !bg-white !px-6 border-b border-slate-200"
        style={{ height: 64, lineHeight: '64px' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <Pyramid size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">Processus</div>
            <div className="text-xs text-slate-500">{pagination.total} Process(us) au total</div>
          </div>
        </div>

        <Space>
          <Input
            allowClear
            placeholder="Rechercher (nom, description...)"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-72"
          />
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={() => loadData(pagination.current, pagination.pageSize, search)} />
          </Tooltip>
          <Button type="primary" icon={<Plus size={16} />} disabled={!permissions('creer.processus')} onClick={openCreateModal}>
            Nouvelle
          </Button>
        </Space>
      </Header>

      <Content>
        <div className="p-4">
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            dataSource={services}
            columns={columns}
            onChange={handleTableChange}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `${total} process(us)`,
            }}
            className="bg-white rounded-md"
          />
        </div>
      </Content>

      <Modal
        title={editingService ? 'Modifier le process' : 'Nouveau process'}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={closeModal}
        okText={editingService ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">

          <Form.Item
            name="code"
            label="Matricule"
            rules={[{ required: true, message: 'la process est requis' }]}
          >
            <Input placeholder="Matricule" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nom du process"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input placeholder="Ex: Production" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Ex: Gestion des activités de production." />
          </Form.Item>
          <Form.Item
            name="responsible_id"
            label="Responsable"
            rules={[{ required: true, message: 'Le responsable est requis' }]}
          >
            <Select options={responsibles} placeholder="Sélectionner un responsable" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}