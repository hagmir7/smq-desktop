import React, { useState } from "react";
import {
  Modal,
  Avatar,
  Input,
  Button,
  Space,
  Typography,
  message
} from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from "@ant-design/icons";
import { api } from "../utils/api";

const { Text } = Typography;

const UpdatePasswordModal = ({ open, user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.password = "Le nouveau mot de passe est requis";
    } else if (newPassword.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!confirmPassword) {
      newErrors.password_confirmation = "Veuillez confirmer le mot de passe";
    } else if (newPassword !== confirmPassword) {
      newErrors.password_confirmation = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.patch(`users/${user.id}/update-password`, {
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      message.success(`Mot de passe mis à jour pour ${user.name}`);
      resetForm();
    } catch (error) {
      message.error(error?.response?.data?.message || "Une erreur réseau s'est produite");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      open={open}
      onCancel={resetForm}
      footer={null}
      width={480}
      className="top-20"
      title={
        <div className="flex items-center gap-2">
          <Avatar src={user.avatar} size={40} className="bg-blue-500">
            {user.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nouveau mot de passe
          </label>
          <Input.Password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            prefix={<LockOutlined />}
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            status={errors.password ? "error" : ""}
          />
          {errors.password && (
            <Text type="danger" className="text-sm">
              {errors.password}
            </Text>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirmer le mot de passe
          </label>
          <Input.Password
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            prefix={<LockOutlined />}
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            status={errors.password_confirmation ? "error" : ""}
          />
          {errors.password_confirmation && (
            <Text type="danger" className="text-sm">
              {errors.password_confirmation}
            </Text>
          )}
        </div>

        <Space className="w-full justify-end pt-4">
          <Button onClick={resetForm}>Annuler</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className=" border-0"
          >
            Mettre à jour
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default UpdatePasswordModal;
