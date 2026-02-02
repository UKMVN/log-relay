import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountSettings() {
    const navigate = useNavigate();
    const logId = localStorage.getItem('logId');
    const username = localStorage.getItem('username');

    const [logIdCustom, setLogIdCustom] = useState('');
    const [logRetentionDays, setLogRetentionDays] = useState(30);
    const [status, setStatus] = useState('');
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!logId) {
            navigate('/');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/users/me?logId=${logId}`);
                const data = await res.json();
                if (data.success) {
                    setLogIdCustom(data.data.logIdCustom || '');
                    setLogRetentionDays(data.data.logRetentionDays ?? 30);
                } else {
                    setError(data.error || 'Failed to load user');
                }
            } catch (err) {
                setError('Connection failed. Is the server running?');
            }
        };

        fetchUser();
    }, [logId, navigate]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleUpdateLogIdCustom = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setLoading(true);
        try {
            const res = await fetch('/api/users/editLogIdCustom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId, logIdCustom })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('Updated logIdCustom successfully');
                setToast('Updated logIdCustom successfully');
                setLogIdCustom(data.data.logIdCustom || '');
            } else {
                setError(data.error || 'Failed to update logIdCustom');
                setToast(data.error || 'Failed to update logIdCustom');
            }
        } catch (err) {
            setError('Connection failed. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRetention = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setLoading(true);
        try {
            const res = await fetch('/api/users/updateSettings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId, logRetentionDays })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('Updated log retention successfully');
                setToast('Updated log retention successfully');
                setLogRetentionDays(data.data.logRetentionDays ?? 30);
            } else {
                setError(data.error || 'Failed to update retention');
                setToast(data.error || 'Failed to update retention');
            }
        } catch (err) {
            setError('Connection failed. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {toast ? (
                <div
                    className={`fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow-lg text-white ${
                        error ? 'bg-red-600' : 'bg-green-600'
                    }`}
                >
                    {toast}
                </div>
            ) : null}
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Account Settings</h1>
                        <p className="text-sm text-gray-500">Manage log access and retention</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/logs')}>
                        Back to Logs
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Username and IDs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500">Username</label>
                            <Input value={username || ''} readOnly />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Log ID</label>
                            <Input value={logId || ''} readOnly />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Custom Log ID</CardTitle>
                        <CardDescription>Use this ID when sending logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateLogIdCustom} className="space-y-3">
                            <Input
                                type="text"
                                placeholder="my-service-123"
                                value={logIdCustom}
                                onChange={(e) => setLogIdCustom(e.target.value)}
                            />
                            <Button type="submit" disabled={loading}>
                                Save Custom Log ID
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Log Retention</CardTitle>
                        <CardDescription>Auto-delete logs after N days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateRetention} className="space-y-3">
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                value={logRetentionDays}
                                onChange={(e) => setLogRetentionDays(Number(e.target.value))}
                            />
                            <p className="text-xs text-gray-500">Set 0 to disable auto delete</p>
                            <Button type="submit" disabled={loading}>
                                Save Retention
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    );
}
