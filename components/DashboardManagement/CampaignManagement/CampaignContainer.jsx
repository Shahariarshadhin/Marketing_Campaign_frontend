
"use client"

import { useState, useEffect } from 'react';
import CreateCampaign from './CreateCampaign';
import ManageFields from './ManageCustomFields';
import CampaignList from './CampaignList';


const API_URL = 'http://localhost:5000/api/campaigns';

export default function CampaignManager() {
    const [currentView, setCurrentView] = useState('list');
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [customFields, setCustomFields] = useState([]);
    const [showColumnManager, setShowColumnManager] = useState(false);

    // Default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        checkbox: true,
        toggle: true,
        campaign: true,
        delivery: true,
        actions: true,
        results: true,
        costPerResult: true,
        budget: true,
        amountSpent: true,
        impressions: true,
        reach: true,
        ends: true,
        actionButtons: true
    });

    const [formData, setFormData] = useState({
        name: '',
        objective: 'awareness',
        status: 'draft',
        delivery: 'In draft',
        actions: '',
        results: '',
        costPerResult: '',
        bidStrategy: 'lowest_cost',
        budgetType: 'daily',
        dailyBudget: '',
        lifetimeBudget: '',
        budget: '',
        amountSpent: '',
        impressions: '',
        reach: '',
        startDate: '',
        endDate: '',
        targetAudience: '',
        placement: 'automatic',
        active: false,
        customFieldsData: {}
    });

    // Fetch all campaigns on mount
    useEffect(() => {
        fetchCampaigns();
        fetchCustomFields();
    }, []);

    // Update visible columns when custom fields change
    useEffect(() => {
        if (customFields.length > 0) {
            const customFieldColumns = {};
            customFields.forEach(field => {
                if (!visibleColumns.hasOwnProperty(`custom_${field.name}`)) {
                    customFieldColumns[`custom_${field.name}`] = true;
                }
            });
            if (Object.keys(customFieldColumns).length > 0) {
                setVisibleColumns(prev => ({ ...prev, ...customFieldColumns }));
            }
        }
    }, [customFields]);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server is not responding with JSON. Make sure backend is running on port 5000");
            }

            const data = await response.json();

            if (data.success) {
                setCampaigns(data.data);
            } else {
                setError('Failed to fetch campaigns');
            }
        } catch (err) {
            if (err.message.includes('Failed to fetch')) {
                setError('Cannot connect to backend. Please ensure the server is running on http://localhost:5000');
            } else {
                setError('Error: ' + err.message);
            }
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomFields = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/custom-fields');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCustomFields(data.data);
                }
            }
        } catch (err) {
            console.error('Error fetching custom fields:', err);
        }
    };

    const toggleCampaign = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setCampaigns(campaigns.map(camp =>
                    camp._id === id ? data.data : camp
                ));
            }
        } catch (err) {
            console.error('Toggle error:', err);
            alert('Failed to toggle campaign status: ' + err.message);
        }
    };

    const deleteCampaign = async (id) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setCampaigns(campaigns.filter(camp => camp._id !== id));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete campaign: ' + err.message);
        }
    };

    const duplicateCampaign = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setCampaigns([...campaigns, data.data]);
            }
        } catch (err) {
            console.error('Duplicate error:', err);
            alert('Failed to duplicate campaign: ' + err.message);
        }
    };

    const editCampaign = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            delivery: campaign.delivery,
            actions: campaign.actions,
            results: campaign.results,
            costPerResult: campaign.costPerResult,
            bidStrategy: campaign.bidStrategy,
            budgetType: campaign.dailyBudget ? 'daily' : 'lifetime',
            dailyBudget: campaign.dailyBudget,
            lifetimeBudget: campaign.lifetimeBudget,
            budget: campaign.budget,
            amountSpent: campaign.amountSpent,
            impressions: campaign.impressions,
            reach: campaign.reach,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            targetAudience: campaign.targetAudience,
            placement: campaign.placement,
            active: campaign.active,
            customFieldsData: campaign.customFields || {}
        });
        setCurrentView('create');
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert('Please enter a campaign name');
            return;
        }

        try {
            setLoading(true);

            const budget = formData.budgetType === 'daily'
                ? `$${formData.dailyBudget}/day`
                : `$${formData.lifetimeBudget} lifetime`;

            const campaignData = {
                name: formData.name,
                status: formData.status,
                delivery: formData.delivery || (formData.status === 'active' ? 'Active' : formData.status === 'draft' ? 'In draft' : 'Scheduled'),
                actions: formData.actions || '',
                results: formData.results || '—',
                costPerResult: formData.costPerResult || '—',
                budget: formData.budget || budget,
                amountSpent: formData.amountSpent || '$0.00',
                impressions: formData.impressions || '—',
                reach: formData.reach || '—',
                endDate: formData.endDate || 'Ongoing',
                active: formData.active,
                objective: formData.objective,
                bidStrategy: formData.bidStrategy,
                dailyBudget: formData.dailyBudget,
                lifetimeBudget: formData.lifetimeBudget,
                startDate: formData.startDate,
                targetAudience: formData.targetAudience,
                placement: formData.placement,
                customFields: formData.customFieldsData
            };

            let response;

            if (editingCampaign) {
                response = await fetch(`${API_URL}/${editingCampaign._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaignData)
                });
            } else {
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaignData)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                if (editingCampaign) {
                    setCampaigns(campaigns.map(camp =>
                        camp._id === editingCampaign._id ? data.data : camp
                    ));
                } else {
                    setCampaigns([...campaigns, data.data]);
                }

                resetForm();
                setCurrentView('list');
            } else {
                alert(`Failed to ${editingCampaign ? 'update' : 'create'} campaign: ` + data.message);
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert(`Failed to ${editingCampaign ? 'update' : 'create'} campaign`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCurrentView('list');
        resetForm();
    };

    const resetForm = () => {
        setEditingCampaign(null);
        setFormData({
            name: '',
            objective: 'awareness',
            status: 'draft',
            delivery: 'In draft',
            actions: '',
            results: '',
            costPerResult: '',
            bidStrategy: 'lowest_cost',
            budgetType: 'daily',
            dailyBudget: '',
            lifetimeBudget: '',
            budget: '',
            amountSpent: '',
            impressions: '',
            reach: '',
            startDate: '',
            endDate: '',
            targetAudience: '',
            placement: 'automatic',
            active: false,
            customFieldsData: {}
        });
    };

    const addCustomField = async (fieldData) => {
        try {
            const response = await fetch('http://localhost:5000/api/custom-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fieldData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCustomFields([...customFields, data.data]);
                }
            }
        } catch (err) {
            console.error('Error adding field:', err);
            alert('Failed to add custom field');
        }
    };

    const deleteCustomField = async (id) => {
        if (!confirm('Are you sure you want to delete this field?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/custom-fields/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCustomFields(customFields.filter(field => field._id !== id));
            }
        } catch (err) {
            console.error('Error deleting field:', err);
            alert('Failed to delete custom field');
        }
    };

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const showAllColumns = () => {
        const allVisible = {};
        Object.keys(visibleColumns).forEach(key => {
            allVisible[key] = true;
        });
        setVisibleColumns(allVisible);
    };

    const hideAllColumns = () => {
        const allHidden = {};
        Object.keys(visibleColumns).forEach(key => {
            allHidden[key] = key === 'campaign' || key === 'actionButtons';
        });
        setVisibleColumns(allHidden);
    };

    // Render current view
    if (currentView === 'create') {
        return (
            <CreateCampaign
                formData={formData}
                setFormData={setFormData}
                customFields={customFields}
                editingCampaign={editingCampaign}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
            />
        );
    }

    if (currentView === 'manage-fields') {
        return (
            <ManageFields
                customFields={customFields}
                onAddField={addCustomField}
                onDeleteField={deleteCustomField}
                onBack={() => setCurrentView('list')}
            />
        );
    }

    return (
        <CampaignList
            campaigns={campaigns}
            customFields={customFields}
            loading={loading}
            error={error}
            visibleColumns={visibleColumns}
            showColumnManager={showColumnManager}
            setShowColumnManager={setShowColumnManager}
            toggleColumn={toggleColumn}
            showAllColumns={showAllColumns}
            hideAllColumns={hideAllColumns}
            onCreateClick={() => setCurrentView('create')}
            onManageFieldsClick={() => setCurrentView('manage-fields')}
            onEdit={editCampaign}
            onToggle={toggleCampaign}
            onDuplicate={duplicateCampaign}
            onDelete={deleteCampaign}
        />
    );
}