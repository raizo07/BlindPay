import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useWallet } from '../../hooks/useWallet';
import { Key, RotateCw, Copy, Check, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Settings = () => {
    const { address, isConnected, signMessage } = useWallet();

    const [apiKey, setApiKey] = useState<string | null>(null);
    const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
    const [merchantInfo, setMerchantInfo] = useState<any>(null);
    const [businessName, setBusinessName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [storedApiKey, setStoredApiKey] = useState<string | null>(null);

    // Check if merchant is registered on load
    useEffect(() => {
        if (!address) return;
        const saved = localStorage.getItem(`bp_api_key_${address.toLowerCase()}`);
        if (saved) {
            setStoredApiKey(saved);
            setIsRegistered(true);
            fetchMerchantInfo(saved);
        }
    }, [address]);

    const fetchMerchantInfo = async (key: string) => {
        try {
            const res = await fetch(`${API_URL}/v1/merchants/me`, {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMerchantInfo(data);
                setBusinessName(data.business_name || '');
                setWebhookUrl(data.webhook_url || '');
            } else {
                // Key might be invalid
                localStorage.removeItem(`bp_api_key_${address?.toLowerCase()}`);
                setIsRegistered(false);
                setStoredApiKey(null);
            }
        } catch {
            // Backend unavailable
        }
    };

    const handleRegister = async () => {
        if (!address) return;
        setLoading(true);
        setError(null);

        try {
            const message = `Register BlindPay merchant account for ${address}\nTimestamp: ${Date.now()}`;
            const signature = await signMessage(message);

            const res = await fetch(`${API_URL}/merchants/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: address,
                    business_name: businessName || undefined,
                    signature,
                    message,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Registration failed');
            }

            const data = await res.json();
            setApiKey(data.api_key);
            setWebhookSecret(data.webhook_secret);
            setMerchantInfo(data.merchant);
            setIsRegistered(true);

            // Store API key locally
            localStorage.setItem(`bp_api_key_${address.toLowerCase()}`, data.api_key);
            setStoredApiKey(data.api_key);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRotateKey = async () => {
        if (!storedApiKey) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/merchants/api-keys/rotate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${storedApiKey}` },
            });

            if (!res.ok) throw new Error('Failed to rotate API key');

            const data = await res.json();
            setApiKey(data.api_key);
            localStorage.setItem(`bp_api_key_${address!.toLowerCase()}`, data.api_key);
            setStoredApiKey(data.api_key);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        if (!storedApiKey) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/v1/merchants/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${storedApiKey}`,
                },
                body: JSON.stringify({
                    business_name: businessName || undefined,
                    webhook_url: webhookUrl || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to update settings');
            const data = await res.json();
            setMerchantInfo(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!isConnected) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                <GlassCard className="p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
                    <p className="text-gray-400">Connect your wallet to manage merchant settings and API keys.</p>
                </GlassCard>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Merchant Settings</h1>
                <p className="text-gray-400">Manage your API keys, webhooks, and merchant profile.</p>
            </div>

            {error && (
                <GlassCard className="p-4 border-red-500/30">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                </GlassCard>
            )}

            {!isRegistered ? (
                <GlassCard className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Key className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Register as Merchant</h2>
                    </div>
                    <p className="text-gray-400 mb-6">
                        Sign a message with your wallet to register and receive your API key.
                    </p>
                    <Input
                        label="Business Name (optional)"
                        placeholder="Your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                    />
                    <div className="mt-6">
                        <Button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Signing...' : 'Register & Get API Key'}
                        </Button>
                    </div>
                </GlassCard>
            ) : (
                <>
                    {/* API Key Section */}
                    <GlassCard className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Key className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">API Key</h2>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleRotateKey}
                                disabled={loading}
                            >
                                <RotateCw className="w-4 h-4" />
                                Rotate
                            </Button>
                        </div>

                        {apiKey && (
                            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 text-sm mb-2 font-medium">
                                    New API key generated. Save it now — it won't be shown again.
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm text-white bg-black/30 rounded-lg p-3 font-mono break-all">
                                        {showKey ? apiKey : apiKey.substring(0, 16) + '••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(apiKey, 'apiKey')}
                                        className="p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {copied === 'apiKey' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {webhookSecret && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-blue-400 text-sm mb-2 font-medium">Webhook Secret</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm text-white bg-black/30 rounded-lg p-3 font-mono break-all">
                                        {webhookSecret}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(webhookSecret, 'secret')}
                                        className="p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {copied === 'secret' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {merchantInfo && !apiKey && (
                            <div className="text-sm text-gray-400">
                                <p>Key prefix: <code className="text-white">{merchantInfo.api_key_prefix}...</code></p>
                                <p className="mt-1">Registered: {new Date(merchantInfo.created_at).toLocaleDateString()}</p>
                            </div>
                        )}
                    </GlassCard>

                    {/* Webhook & Profile Settings */}
                    <GlassCard className="p-8">
                        <h2 className="text-xl font-bold text-white mb-6">Merchant Profile</h2>
                        <div className="space-y-4">
                            <Input
                                label="Business Name"
                                placeholder="Your business name"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                            />
                            <Input
                                label="Webhook URL"
                                placeholder="https://your-server.com/webhooks/blindpay"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                            />
                            <Button
                                variant="secondary"
                                onClick={handleUpdateSettings}
                                disabled={loading}
                                className="w-full mt-4"
                            >
                                {loading ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Usage Example */}
                    <GlassCard className="p-8">
                        <h2 className="text-xl font-bold text-white mb-4">Quick Start</h2>
                        <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                            <pre>{`npm install @blindpay/node

import { BlindPay } from '@blindpay/node';
const bp = new BlindPay('${storedApiKey ? storedApiKey.substring(0, 16) + '...' : 'bp_live_xxx'}');

const session = await bp.checkout.sessions.create({
  amount: 50,
  token: 'usdc',
  memo: 'Order #123'
});
// session.url → payment link`}</pre>
                        </div>
                    </GlassCard>
                </>
            )}
        </motion.div>
    );
};

export default Settings;
