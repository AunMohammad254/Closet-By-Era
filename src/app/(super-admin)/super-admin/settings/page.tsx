'use client';

import { useState } from 'react';
import { Settings, Save, Loader2, Database, Shield, Bell, Globe, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SystemSettingsPage() {
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,
        maxLoginAttempts: 5,
        sessionTimeout: 24,
    });

    const handleSave = async () => {
        setSaving(true);
        // TODO: Implement Supabase persistence for settings
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        toast('Settings preview only - persistence coming soon', { icon: '⚠️' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-purple-400" />
                    System Settings
                </h1>
                <p className="text-slate-400 mt-1">Configure system-wide settings</p>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">General</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                            <div>
                                <p className="text-white font-medium">Maintenance Mode</p>
                                <p className="text-sm text-slate-400">Disable site access for non-admins</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`relative w-14 h-7 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-600'
                                    }`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'left-8' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-green-400" />
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                            <div>
                                <p className="text-white font-medium">Allow New Registrations</p>
                                <p className="text-sm text-slate-400">Enable new user sign-ups</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
                                className={`relative w-14 h-7 rounded-full transition-colors ${settings.allowNewRegistrations ? 'bg-green-500' : 'bg-slate-600'
                                    }`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.allowNewRegistrations ? 'left-8' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                            <div>
                                <p className="text-white font-medium">Require Email Verification</p>
                                <p className="text-sm text-slate-400">Users must verify email before access</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                                className={`relative w-14 h-7 rounded-full transition-colors ${settings.requireEmailVerification ? 'bg-green-500' : 'bg-slate-600'
                                    }`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.requireEmailVerification ? 'left-8' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-white font-medium">Max Login Attempts</p>
                                    <p className="text-sm text-slate-400">Before temporary lockout</p>
                                </div>
                                <input
                                    type="number"
                                    min={3}
                                    max={10}
                                    value={settings.maxLoginAttempts}
                                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-white font-medium">Session Timeout (hours)</p>
                                    <p className="text-sm text-slate-400">Auto-logout after inactivity</p>
                                </div>
                                <input
                                    type="number"
                                    min={1}
                                    max={168}
                                    value={settings.sessionTimeout}
                                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Info */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Database</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                            <p className="text-slate-400 text-sm">Provider</p>
                            <p className="text-white font-medium">Supabase</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                            <p className="text-slate-400 text-sm">Region</p>
                            <p className="text-white font-medium">Southeast Asia</p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Email notification settings are managed in Supabase Dashboard.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    Save Settings
                </button>
            </div>
        </div>
    );
}
