"use client";

import React, { useRef, useState } from 'react';
import { Upload, FileVideo, Plus, Zap, BookOpen } from 'lucide-react';

interface UploadStudioProps {
    onUploadStart: (files: File[]) => void;
    onOpenDrafts?: () => void;
    onCreateQueue?: () => void;
    onUrlUpload?: (url: string) => void;
}

export function UploadStudio({ onUploadStart, onOpenDrafts, onCreateQueue, onUrlUpload }: UploadStudioProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [url, setUrl] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            // Filter for video files if needed, or rely on backend validation
            onUploadStart(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            onUploadStart(files);
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || isResolving) return;

        setIsResolving(true);
        try {
            if (onUrlUpload) {
                await onUrlUpload(url);
                setUrl('');
                setShowUrlInput(false);
            }
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Main Dropzone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center 
          min-h-[250px] md:min-h-[300px] w-full 
          border border-dashed transition-all duration-200
          ${isDragging
                        ? 'border-foreground bg-muted'
                        : 'border-foreground/20 hover:border-foreground/40 bg-background'
                    }
        `}
            >
                <div className="flex flex-col items-center text-center space-y-4 max-w-md p-6">
                    <div className={`
            p-3 mb-2 transition-transform duration-300
            ${isDragging ? 'scale-110 bg-foreground text-background' : 'bg-muted text-muted-foreground'}
          `}>
                        <Upload className="size-6 md:size-8" />
                    </div>

                    {!showUrlInput ? (
                        <>
                            <div className="space-y-1">
                                <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-foreground">
                                    Upload Video To Start
                                </h3>
                                <p className="text-[10px] md:text-xs text-muted-foreground max-w-sm mx-auto uppercase font-medium">
                                    Drop files here or use the buttons below.<br className="hidden md:block" />
                                    Multi-upload and batch processing supported.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full pt-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2 bg-foreground text-background font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    <FileVideo className="size-4" />
                                    Select Files
                                </button>
                                <button
                                    onClick={() => setShowUrlInput(true)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2 border border-foreground/20 hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    <Plus className="size-4" />
                                    Add URL
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    영상 URL 입력
                                </h3>
                                <p className="text-sm text-gray-500">
                                    YouTube 링크 또는 직접 영상 링크를 입력하세요.
                                </p>
                            </div>
                            <form onSubmit={handleUrlSubmit} className="space-y-3">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUrlInput(false)}
                                        className="flex-1 px-4 py-2 border border-foreground/20 text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResolving || !url}
                                        className="flex-[2] px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                                    >
                                        {isResolving ? 'Resolving...' : 'Add Video'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="pt-6 flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-gray-300"></span> MP4, MOV, MKV
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-gray-300"></span> YouTube 지원
                        </span>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="video/*"
                />
            </div>

            {/* Quick Actions & Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Step Guide */}
                <div className="hidden lg:flex items-center justify-between p-3 bg-background border border-foreground/10 text-[10px] font-bold uppercase tracking-widest md:col-span-1">
                    <div className="flex items-center gap-2">
                        <span className="size-5 flex items-center justify-center bg-foreground text-background font-bold">1</span>
                        <span className="text-foreground">Upload</span>
                    </div>
                    <div className="h-px w-6 bg-foreground/10"></div>
                    <div className="flex items-center gap-2">
                        <span className="size-5 flex items-center justify-center bg-muted text-muted-foreground font-bold">2</span>
                        <span className="text-muted-foreground">Select</span>
                    </div>
                    <div className="h-px w-6 bg-foreground/10"></div>
                    <div className="flex items-center gap-2">
                        <span className="size-5 flex items-center justify-center bg-muted text-muted-foreground font-bold">3</span>
                        <span className="text-muted-foreground">Queue</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                        onClick={onCreateQueue}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-background border border-foreground/10 hover:border-foreground transition-all group"
                    >
                        <div className="p-2 bg-muted text-foreground group-hover:scale-110 transition-transform">
                            <Plus className="size-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">New Queue</span>
                    </button>

                    <button
                        onClick={onOpenDrafts}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-background border border-foreground/10 hover:border-foreground transition-all group"
                    >
                        <div className="p-2 bg-muted text-foreground group-hover:scale-110 transition-transform">
                            <BookOpen className="size-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Drafts</span>
                    </button>

                    <button
                        onClick={() => { }}
                        className="hidden sm:flex flex-col items-center justify-center gap-2 p-3 bg-background border border-foreground/10 hover:border-foreground transition-all group"
                    >
                        <div className="p-2 bg-muted text-foreground group-hover:scale-110 transition-transform">
                            <Zap className="size-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
