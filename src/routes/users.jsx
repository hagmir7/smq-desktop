import { useEffect, useState } from 'react'
import { Edit, Loader2, Trash, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { message, Popconfirm, Table, Input, Tag, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import UpdatePasswordModal from '../components/UpdatePasswordModal'
import UserCreateModal from '../components/UserCreateModal'
// import UpdatePasswordModal from '../components/UpdatePasswordModal'

export default function Users() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 })
  const { roles = [], permissions } = useAuth()
  const navigate = useNavigate()

  const [selectedUser, setSelectedUser] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    getUsers()
  }, [])

  const getUsers = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('users')
      const payload = response.data
      setUsers(payload.data)
      setFilteredUsers(payload.data)
      setPagination({
        current: payload.current_page,
        pageSize: payload.per_page,
        total: payload.total,
      })
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const query = search.toLowerCase()
    const results = users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(query) ||
        user.code?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    )
    setFilteredUsers(results)
  }, [search, users])

  const handleShow = async (id) => {
    if (!roles('admin')) {
      return
    }
    try {
      const url = `/profile/${id}`
      if (window.electron && typeof window.electron.openShow === 'function') {
        await window.electron.openShow({
          width: 1100,
          height: 750,
          url,
          resizable: true,
        })
      } else {
        navigate(`layout/profile/${id}`)
      }
    } catch (error) {
      console.error('Error navigating :', error)
    }
  }

  const deleteUser = async (user_id) => {
    try {
      await api.delete(`user/${user_id}/destroy`)
      message.success('Utilisateur supprimé avec succès')
      getUsers()
    } catch (error) {
      message.error(error.response?.data?.message || "Erreur de supprimer l'utilisateur")
    }
  }

  const columns = [
    {
      title: 'Nom et prénom',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Matricule',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service) => <Tag>{service.name}</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) =>
        String(is_active) === '1' ? (
          <Tag color='green'>Actif</Tag>
        ) : (
          <Tag color='red'>Inactif</Tag>
        ),
    },
    {
      title: 'Créé le',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, user) => (
        <div className='flex gap-3'>
          <Button
            type='text'
            size='small'
            onClick={() => {
              setSelectedUser(users.find((u) => parseInt(u.id) === parseInt(user.id)))
              setModalVisible(true)
            }}
            icon={<Lock size={16} className='text-blue-600' />}
          />

          {roles('admin') && (
            <Button
              type='text'
              size='small'
              onClick={() => handleShow(user.id)}
              icon={<Edit size={16} className='text-blue-600' />}
            />
          )}

          {roles('admin') && (
            <Popconfirm
              title="Supprimer l'utilisateur"
              description='Êtes-vous sûr de supprimer cet utilisateur ?'
              onConfirm={() => deleteUser(user.id)}
              okText='Supprimer'
              cancelText='Annuler'
            >
              <Button
                type='text'
                size='small'
                danger
                icon={<Trash size={16} className='text-red-600' />}
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className='relative overflow-x-auto'>
      <div className='flex flex-col sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between p-2 bg-gray-200'>
        <UserCreateModal fetchData={getUsers} />
        <div className='relative' />
        

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Rechercher un utilisateur...'
          prefix={<SearchOutlined className='text-gray-400' />}
          className='w-80'
          allowClear
        />
      </div>

      <Table
        size='small'
        rowKey='id'
        columns={columns}
        dataSource={filteredUsers}
        loading={{
          spinning: isLoading,
          indicator: <Loader2 className='animate-spin text-blue-500' size={28} />,
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
        }}
        locale={{ emptyText: 'Aucun utilisateur trouvé.' }}
      />

      <UpdatePasswordModal
        open={modalVisible}
        user={selectedUser}
        onClose={() => {
          setModalVisible(false);
          setSelectedUser(null);
        }}

        
      />

      
    </div>
  )
}