import { useState, useEffect, useCallback } from "react";
import { Mail, Save, Loader2, Building, IdCard } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import {
    Form,
    Input,
    Button,
    Checkbox,
    Card,
    message,
    Spin,
    Row,
    Col,
    Typography,
    Alert,
    Tooltip,
    Select,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const INITIAL_USER_DATA = {
    full_name: "",
    email: "",
    code: "",
    company_id: '',
    service_id: null,
    roles: [],
};

export default function UpdateUser() {
    const [userData, setUserData] = useState(INITIAL_USER_DATA);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [services, setServices] = useState([]);
    const { id } = useParams();

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await api.get("companies");
            setCompanies(
                (response?.data?.data || []).map((c) => ({
                    label: c.name,
                    value: c.id,
                }))
            );
        } catch (error) {
            console.error(error);
            message.error(
                error?.response?.data?.message || "Une erreur s'est produite"
            );
        }
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const response = await api.get("services");
            setServices(
                (response?.data?.data || []).map((s) => ({
                    label: s.name,
                    value: s.id,
                }))
            );
        } catch (error) {
            console.error(error);
            message.error(
                error?.response?.data?.message || "Une erreur s'est produite"
            );
        }
    }, []);

    const fetchUserData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await api.get(`users/${id}`);
            const user = response.data?.data || response.data;

            const assignedRoleNames = Array.isArray(user?.roles)
                ? user.roles.map((role) => role.name)
                : [];

            setUserData({
                full_name: user?.full_name || "",
                email: user?.email || "",
                code: user?.code || "",
                company_id: user.company_id ? Number(user.company_id) : null,
                service_id:
                    user?.service_id !== null && user?.service_id !== undefined
                        ? Number(user.service_id)
                        : null,
                roles: assignedRoleNames,
            });
        } catch (err) {
            console.error(err);
            setAlert({
                type: "error",
                message: "Impossible de charger les données du profil",
                description:
                    err?.response?.data?.message || "Une erreur s'est produite",
            });
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await api.get("roles");
            setUserRoles(response?.data?.data || response?.data || []);
        } catch (error) {
            console.error(error);
            message.error(
                error?.response?.data?.message || "Une erreur s'est produite"
            );
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
        fetchServices();
        fetchRoles();
        fetchUserData();
    }, [fetchCompanies, fetchServices, fetchRoles, fetchUserData]);

    const validate = () => {
        if (!userData.full_name.trim()) {
            message.error("Le nom complet est requis");
            return false;
        }
        if (!userData.email.trim()) {
            message.error("L'email est requis");
            return false;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(userData.email)) {
            message.error("Veuillez saisir une adresse email valide");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setSaving(true);
            await api.put(`users/${id || ""}`, userData);
            message.success("Profil mis à jour avec succès !");
            setAlert(null);
        } catch (err) {
            console.error(err);
            message.error(
                err?.response?.data?.message || "Une erreur s'est produite"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin indicator={<Loader2 className="animate-spin text-blue-500" />} />
                <span className="ml-2 text-gray-600">Chargement du profil...</span>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 py-2" > 
            <div className="max-w-5xl mx-auto">
                <Card size="small" className="p-0 m-0">
                    <Title level={5} className="p-0 m-0">Profil de {userData.full_name || "l'utilisateur"}</Title>
                    <Text type="secondary">
                        Gérer les informations personnelles et préférences
                    </Text>
                </Card>
                <div className="my-3" />

                {alert && (
                    <Alert
                        message={alert.message}
                        description={alert.description}
                        type={alert.type}
                        showIcon
                        className="mb-4"
                    />
                )}

                <Card size="small">
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item label="Nom complet" required>
                                    <Input
                                        name="full_name"
                                        value={userData.full_name}
                                        onChange={(e) =>
                                            setUserData({ ...userData, full_name: e.target.value })
                                        }
                                        placeholder="Ex. Bonnie Green"
                                    />
                                </Form.Item>

                                <Form.Item label="Service">
                                    <Select
                                        options={services}
                                        value={userData.service_id}
                                        onChange={(value) =>
                                            setUserData({ ...userData, service_id: value })
                                        }
                                        placeholder="Sélectionnez un service"
                                        suffixIcon={<Building size={16} />}
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Email" required>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={userData.email}
                                        onChange={(e) =>
                                            setUserData({ ...userData, email: e.target.value })
                                        }
                                        prefix={<Mail size={16} />}
                                        placeholder="nom@exemple.com"
                                    />
                                </Form.Item>

                                <Form.Item label="Société">
                                    <Select
                                        options={companies}
                                        value={userData.company_id}
                                        onChange={(value) =>
                                            setUserData({ ...userData, company_id: value })
                                        }
                                        placeholder="Sélectionnez une société"
                                        suffixIcon={<Building size={16} />}
                                        allowClear
                                    />
                                </Form.Item>

                                <Form.Item label="Matricule" tooltip="Matricule du collaborateur sur Sage">
                                    <Input
                                        name="code"
                                        type="text"
                                        value={userData.code}
                                        onChange={(e) =>
                                            setUserData({ ...userData, code: e.target.value })
                                        }
                                        prefix={<IdCard size={16} />}
                                        placeholder=""
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Title level={5} className="!mb-0">
                                        Rôles utilisateur
                                    </Title>
                                    <Tooltip title="Sélectionnez un ou plusieurs rôles à attribuer à cet utilisateur">
                                        <InfoCircleOutlined className="text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
                                    </Tooltip>
                                </div>
                                {userData.roles?.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {userData.roles.length} rôle{userData.roles.length > 1 ? "s" : ""} sélectionné{userData.roles.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

             <Checkbox.Group
                value={userData.roles}
                onChange={(checkedValues) =>
                  setUserData({ ...userData, roles: checkedValues })
                }
                className="w-full"
              >
                <Row gutter={[12, 12]}>
                  {userRoles.map((role) => {
                    const isChecked = userData.roles?.includes(role.name);
                    return (
                      <Col key={role.id} xs={24} sm={12} md={8}>
                        <div
                          className={`rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                            isChecked
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Checkbox value={role.name} className="w-full">
                            <span className="text-sm font-medium">{role.name}</span>
                            {role.description && (
                              <div className="text-xs text-gray-500">{role.description}</div>
                            )}
                          </Checkbox>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Checkbox.Group>

                            {userRoles.length === 0 && (
                                <div className="text-sm text-gray-400 italic py-2">
                                    Aucun rôle disponible
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-6 border-t mt-8">
                            <Button
                               type="primary"
                                htmlType="submit"
                                icon={!saving && <Save size={16} />}
                                loading={saving}
                                className="px-6"
                            >
                                {saving ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}