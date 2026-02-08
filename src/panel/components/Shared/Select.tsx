import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SelectOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
    group?: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    searchable = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.id === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm",
                    "bg-white border border-slate-200 rounded-lg",
                    "hover:border-slate-300 hover:bg-slate-50 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/20",
                    isOpen && "border-slate-400 ring-2 ring-slate-400/20"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && <span className="text-slate-500">{selectedOption.icon}</span>}
                    <span className={cn("truncate", !selectedOption && "text-slate-400")}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
                    >
                        {/* Search Input */}
                        {searchable && (
                            <div className="p-2 border-b border-slate-100">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-300"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            onChange(option.id);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-2 text-sm text-left rounded-md transition-colors",
                                            "hover:bg-slate-100",
                                            value === option.id && "bg-slate-50 text-blue-600"
                                        )}
                                    >
                                        {option.icon && (
                                            <span className={cn(
                                                "text-slate-400",
                                                value === option.id && "text-blue-500"
                                            )}>
                                                {option.icon}
                                            </span>
                                        )}
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {value === option.id && <Check className="w-3.5 h-3.5 text-blue-500" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-8 text-center text-xs text-slate-400">
                                    No options found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
