"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
    BookOpen,
    Search,
    Plus,
    Edit2,
    Trash2,
    ChevronDown,
    Languages,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";

// Mock glossary data
const mockGlossary = [
    {
        id: "1",
        source: "machine learning",
        target: "기계 학습",
        category: "기술",
        notes: "ML로 축약",
    },
    {
        id: "2",
        source: "artificial intelligence",
        target: "인공지능",
        category: "기술",
        notes: "AI로 축약 가능",
    },
    {
        id: "3",
        source: "subscribe",
        target: "구독하기",
        category: "YouTube",
        notes: "",
    },
    {
        id: "4",
        source: "like and share",
        target: "좋아요와 공유",
        category: "YouTube",
        notes: "자막 맥락에 따라 조정",
    },
    {
        id: "5",
        source: "quarterly report",
        target: "분기 보고서",
        category: "비즈니스",
        notes: "",
    },
];

const categories = ["전체", "기술", "YouTube", "비즈니스", "일반"];

export default function GlossaryPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("전체");

    const filteredGlossary = mockGlossary.filter((item) => {
        const matchesSearch =
            item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.target.includes(searchQuery);
        const matchesCategory =
            selectedCategory === "전체" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <PageContainer className="gap-8 py-8">
            {/* Header */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        용어집
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        번역 용어집
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        일관된 번역을 위해 용어를 등록하고 관리합니다.
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                    <Plus className="size-4" />
                    용어 추가
                </button>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <BookOpen className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">등록된 용어</p>
                            <p className="text-xl font-semibold">{mockGlossary.length}개</p>
                        </div>
                    </div>
                </article>
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Languages className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">카테고리</p>
                            <p className="text-xl font-semibold">{categories.length - 1}개</p>
                        </div>
                    </div>
                </article>
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-2">
                            <BookOpen className="size-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">적용된 번역</p>
                            <p className="text-xl font-semibold">128회</p>
                        </div>
                    </div>
                </article>
            </section>

            {/* Search & Filter */}
            <section className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="용어 검색..."
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-primary/20 transition focus:ring-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select
                        className="appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm outline-none ring-primary/20 transition focus:ring-2"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
            </section>

            {/* Glossary Table */}
            <section className="rounded-2xl border bg-card/70 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-5 py-4 font-medium">원문 (영어)</th>
                                <th className="px-5 py-4 font-medium">번역 (한국어)</th>
                                <th className="px-5 py-4 font-medium">카테고리</th>
                                <th className="px-5 py-4 font-medium">메모</th>
                                <th className="px-5 py-4 font-medium">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredGlossary.map((item) => (
                                <tr key={item.id} className="hover:bg-secondary/30">
                                    <td className="px-5 py-4 font-medium">{item.source}</td>
                                    <td className="px-5 py-4">{item.target}</td>
                                    <td className="px-5 py-4">
                                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-muted-foreground">
                                        {item.notes || "-"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                                aria-label="수정"
                                            >
                                                <Edit2 className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                                                aria-label="삭제"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredGlossary.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                        <BookOpen className="size-8 text-muted-foreground" />
                        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                    </div>
                )}
            </section>
        </PageContainer>
    );
}
