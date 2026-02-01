import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, LogOut, Activity } from "lucide-react";

export default function LogDashboard() {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('Connecting...');
    const [copyStatus, setCopyStatus] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const navigate = useNavigate();
    const ws = useRef(null);
    const terminalRef = useRef(null);
    const copyTimerRef = useRef(null);

    const logId = localStorage.getItem('logId');
    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!logId) {
            navigate('/');
            return;
        }

        fetchLogs();
        connectWebSocket();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [logId, navigate]);

    useEffect(() => {
        if (viewMode !== 'terminal') return;
        if (!terminalRef.current) return;
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [logs, viewMode]);

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/logs?logId=${logId}`);
            const data = await res.json();
            if (data.success) {
                setLogs(prev => {
                    // Avoid duplicates if WS already added some? 
                    // Ideally we just set new state. 
                    // But if WS sends logs while fetching, we might miss or dup.
                    // For simplicity, just set.
                    return data.data;
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const connectWebSocket = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // When using vite proxy, window.location.host is localhost:5173. 
        // The proxy creates a tunnel. However, for WS proxying in Vite, we typically connect to 
        // `ws://localhost:5173/api/logs` and vite forwards it.

        ws.current = new WebSocket(`${protocol}//${window.location.host}/api/logs`);

        ws.current.onopen = () => {
            setStatus('Live');
            // Authenticate/Subscribe
            ws.current.send(JSON.stringify({ type: 'auth', logId }));
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_log') {
                    // Add new log to top
                    setLogs(prevLogs => [message.data, ...prevLogs].slice(0, 100));
                } else if (message.type === 'status') {
                    console.log('WS Status:', message.message);
                }
            } catch (e) {
                console.error('WS Parse error', e);
            }
        };

        ws.current.onclose = () => {
            setStatus('Disconnected');
            // Reconnect logic could go here
        };

        ws.current.onerror = (err) => {
            console.error("WS Error", err);
            setStatus('Error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('logId');
        localStorage.removeItem('username');
        navigate('/');
    };

    const handleCopyLogId = async () => {
        if (!logId) {
            setCopyStatus('Log ID not found');
            return;
        }

        try {
            await navigator.clipboard.writeText(logId);
            setCopyStatus('Copied');
        } catch (err) {
            setCopyStatus('Copy failed');
        }

        if (copyTimerRef.current) {
            clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = setTimeout(() => {
            setCopyStatus('');
        }, 2000);
    };

    const getLevelBadge = (level) => {
        switch (level) {
            case 'error': return <Badge variant="destructive">ERROR</Badge>;
            case 'warn': return <Badge variant="warning" className="bg-orange-500 hover:bg-orange-600">WARN</Badge>;
            case 'info': return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">INFO</Badge>;
            case 'debug': return <Badge variant="outline">DEBUG</Badge>;
            default: return <Badge>{level}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">Log Dashboard</h1>
                        <span className="text-sm text-gray-500">for {username}</span>
                        <span className="text-sm text-gray-500">Log ID:</span>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded border">
                            {logId || '-'}
                        </span>
                        <Badge variant="outline" className={status === 'Live' ? 'text-green-600 border-green-600' : 'text-red-500'}>
                            <Activity className="w-3 h-3 mr-1" />
                            {status}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                        >
                            Table
                        </Button>
                        <Button
                            variant={viewMode === 'terminal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('terminal')}
                        >
                            Terminal
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchLogs}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyLogId}>
                            Copy Log ID
                        </Button>
                        {copyStatus ? (
                            <span className="text-xs text-gray-500 self-center">
                                {copyStatus}
                            </span>
                        ) : null}
                        <Button variant="destructive" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'table' ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">Timestamp</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="w-[40%]">Message</TableHead>
                                            <TableHead>Meta</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">
                                                    No logs found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log) => (
                                                <TableRow key={log._id || Math.random()}>
                                                    <TableCell className="font-mono text-xs">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                                                    <TableCell className="font-medium">{log.service}</TableCell>
                                                    <TableCell className="max-w-md truncate" title={log.message}>
                                                        {log.message}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-gray-500 truncate max-w-xs">
                                                        {log.meta ? JSON.stringify(log.meta) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div
                                ref={terminalRef}
                                className="h-[520px] overflow-y-auto rounded-md border bg-black text-green-200 font-mono text-xs p-3"
                            >
                                {logs.length === 0 ? (
                                    <div className="text-gray-400">No logs found.</div>
                                ) : (
                                    [...logs]
                                        .slice(0, 500)
                                        .reverse()
                                        .map((log) => (
                                            <div key={log._id || Math.random()} className="whitespace-pre-wrap break-words">
                                                <span className="text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                                {' '}
                                                <span className="text-yellow-300">[{log.level}]</span>
                                                {' '}
                                                <span className="text-cyan-300">{log.service}</span>
                                                {': '}
                                                <span>{log.message}</span>
                                                {log.meta ? (
                                                    <>
                                                        {' '}
                                                        <span className="text-gray-500">
                                                            {JSON.stringify(log.meta)}
                                                        </span>
                                                    </>
                                                ) : null}
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
