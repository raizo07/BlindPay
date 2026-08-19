import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import ProfileQRCode from '../../components/profile/ProfileQRCode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProfileData {
    slug: string;
    display_name: string | null;
    description: string | null;
    default_token_type: number;
    wallet_address: string;
    business_name: string | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const DonationPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/profiles/${slug}`);
                if (!res.ok) {
                    setError(res.status === 404 ? 'Profile not found' : 'Failed to load profile');
                    return;
                }
                const data = await res.json();
                setProfile(data);
            } catch {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <GlassCard className="p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Not Found</h2>
                    <p className="text-gray-400">{error || 'This donation page does not exist.'}</p>
                    <Link
                        to="/"
                        className="inline-block mt-6 px-6 py-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                    >
                        Go Home
                    </Link>
                </GlassCard>
            </div>
        );
    }

    const displayName = profile.display_name || profile.business_name || slug;

    return (
        <div className="page-container relative min-h-screen">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-lg mx-auto pt-10 relative z-10 pb-20"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter text-white">
                        {displayName}
                    </h1>
                    {profile.description && (
                        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                            {profile.description}
                        </p>
                    )}
                </motion.div>

                {/* QR Code Card */}
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-8 flex flex-col items-center gap-6">
                        <ProfileQRCode slug={slug!} size={220} />

                        <div className="w-full border-t border-white/10 pt-6 flex flex-col items-center gap-4">
                            <p className="text-gray-400 text-xs text-center">
                                Scan the QR code or click below to send a private payment
                            </p>

                            <Link
                                to={`/create?merchant=${profile.wallet_address}&token=${profile.default_token_type}`}
                                className="w-full"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 px-6 rounded-2xl bg-white text-black font-semibold text-sm
                                             hover:bg-gray-100 transition-colors"
                                >
                                    Donate
                                </motion.button>
                            </Link>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Footer info */}
                <motion.div variants={itemVariants} className="text-center mt-8">
                    <p className="text-gray-600 text-xs">
                        Powered by{' '}
                        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                            BlindPay
                        </Link>
                        {' '}&mdash; Private payments with STRK20
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default DonationPage;
