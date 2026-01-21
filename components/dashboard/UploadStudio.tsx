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
          min-h-[300px] md:min-h-[400px] w-full rounded-3xl 
          border-2 border-dashed transition-all duration-200
          ${isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50'
                    }
        `}
            >
                <div className="flex flex-col items-center text-center space-y-4 max-w-md p-6">
                    <div className={`
            p-4 rounded-full mb-2 transition-transform duration-300
            ${isDragging ? 'scale-110 bg-blue-100 text-blue-600' : 'bg-white dark:bg-gray-800 text-gray-400 shadow-sm'}
          `}>
                        <Upload className="size-8 md:size-10" />
                    </div>

                    {!showUrlInput ? (
                        <>
                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    첫 영상을 올려 작업을 시작하세요
                                </h3>
                                <p className="text-sm md:text-base text-gray-500 max-w-sm mx-auto leading-relaxed">
                                    여러 영상을 한 번에 업로드하고,<br className="hidden md:block" />
                                    선택해서 큐에 담아 일괄 처리할 수 있어요.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <FileVideo className="size-5" />
                                    파일 선택
                                </button>
                                <button
                                    onClick={() => setShowUrlInput(true)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    <Plus className="size-5 text-blue-500" />
                                    URL 추가
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
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResolving || !url}
                                        className="flex-[2] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isResolving ? '확인 중...' : '영상 추가하기'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Step Guide - Only visible on desktop/large screens maybe? Keeping consistent for now */}
                <div className="hidden lg:flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm md:col-span-1">
                    <div className="flex items-center gap-3">
                        <span className="size-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">1</span>
                        <span className="text-gray-600 dark:text-gray-400">업로드</span>
                    </div>
                    <div className="h-px w-8 bg-gray-200"></div>
                    <div className="flex items-center gap-3">
                        <span className="size-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold text-xs">2</span>
                        <span className="text-gray-600 dark:text-gray-400">선택</span>
                    </div>
                    <div className="h-px w-8 bg-gray-200"></div>
                    <div className="flex items-center gap-3">
                        <span className="size-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold text-xs">3</span>
                        <span className="text-gray-600 dark:text-gray-400">큐 실행</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                        onClick={onCreateQueue}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 group-hover:scale-110 transition-transform">
                            <Plus className="size-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">새 큐 만들기</span>
                    </button>

                    <button
                        onClick={onOpenDrafts}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all group"
                    >
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 group-hover:scale-110 transition-transform">
                            <BookOpen className="size-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">드래프트 큐</span>
                    </button>

                    {/* Placeholder for Glossaries or Config */}
                    <button
                        onClick={() => { }}
                        className="hidden sm:flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
                    >
                        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 group-hover:scale-110 transition-transform">
                            <Zap className="size-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">설정 가져오기</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
