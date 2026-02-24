import { useState } from 'react';
import { Check } from 'lucide-react';

export default function CopyableId({ id, ironMan = false, className = '' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(String(id));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <span className={`relative inline-flex items-center ${className}`}>
            <button
                onClick={handleCopy}
                title="Copiar ID"
                className={`text-xs font-mono px-1.5 py-0.5 rounded cursor-pointer select-none transition-colors ${
                    ironMan
                        ? 'bg-[#0B0F14] text-[#94A3B8] border border-cyan-500/20 hover:border-cyan-400/50'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
                #{id}
            </button>
            {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                    <Check className="h-2.5 w-2.5" />
                    Copiado
                </span>
            )}
        </span>
    );
}
