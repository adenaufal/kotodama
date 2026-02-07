import React from 'react';
import { motion } from 'framer-motion';
import { Copy, CornerDownRight, Check } from 'lucide-react';
import { Button } from '../Shared/Button';

interface ResultCardProps {
    content: string;
    index: number;
    onInsert: (content: string) => void;
    onCopy: (content: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
    content,
    index,
    onInsert,
    onCopy
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        onCopy(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
        >
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {content}
            </div>

            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                <Button
                    variant="primary"
                    onClick={() => onInsert(content)}
                    className="flex-1 py-2 text-sm"
                    icon={<CornerDownRight className="w-4 h-4" />}
                >
                    Insert
                </Button>

                <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                    title="Copy to clipboard"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
};
