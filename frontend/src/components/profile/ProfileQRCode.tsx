import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ProfileQRCodeProps {
    slug: string;
    size?: number;
}

const ProfileQRCode: React.FC<ProfileQRCodeProps> = ({ slug, size = 200 }) => {
    const donateUrl = `${window.location.origin}/donate/${slug}`;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG
                    value={donateUrl}
                    size={size}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                />
            </div>
            <p className="text-xs text-gray-500 font-mono break-all text-center max-w-[260px]">
                {donateUrl}
            </p>
        </div>
    );
};

export default ProfileQRCode;
