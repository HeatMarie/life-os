"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PenTool,
  Plus,
  FileText,
  Clock,
  Star,
  Sparkles,
  Folder,
  Target,
  Loader2,
  BookOpen,
  Newspaper,
} from "lucide-react";

interface WritingPiece {
  id: string;
  title: string;
  type: "STORY" | "BLOG_POST" | "ARTICLE" | "POETRY" | "OTHER";
  status: "IDEA" | "OUTLINING" | "DRAFTING" | "EDITING" | "PUBLISHED" | "ABANDONED";
  wordCount: number;
  targetWords: number;
  createdAt: string;
  updatedAt: string;
  area?: {
    id: string;
    displayName: string;
    color: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
}

const TYPE_ICONS = {
  STORY: BookOpen,
  BLOG_POST: FileText,
  ARTICLE: Newspaper,
  POETRY: PenTool,
  OTHER: Folder,
};

const TYPE_COLORS = {
  STORY: "text-purple-400",
  BLOG_POST: "text-cyan-400",
  ARTICLE: "text-yellow-500",
  POETRY: "text-pink-400",
  OTHER: "text-green-400",
};

const STATUS_COLORS = {
  IDEA: "bg-muted text-muted-foreground",
  OUTLINING: "bg-purple-500/20 text-purple-400",
  DRAFTING: "bg-yellow-500/20 text-yellow-500",
  EDITING: "bg-cyan-500/20 text-cyan-400",
  PUBLISHED: "bg-green-500/20 text-green-400",
  ABANDONED: "bg-red-500/20 text-red-400",
};

export default function WritingPage() {
  const [writings, setWritings] = useState<WritingPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWritings() {
      try {
        const res = await fetch("/api/writings");
        if (res.ok) {
          const data = await res.json();
          setWritings(data);
        }
      } catch (error) {
        console.error("Error fetching writings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWritings();
  }, []);

  const filteredWritings =
    filter === "all"
      ? writings
      : writings.filter((w) => w.type === filter);

  const totalWords = writings.reduce((sum, w) => sum + w.wordCount, 0);
  const publishedCount = writings.filter(
    (w) => w.status === "PUBLISHED"
  ).length;
  const draftsCount = writings.filter((w) => w.status === "DRAFTING" || w.status === "OUTLINING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-widest text-pink-400 neon-glow-pink flex items-center gap-3">
            <PenTool size={24} /> CHRONICLE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Document your journey, capture your thoughts
          </p>
        </div>
        <Button variant="neon" size="sm">
          <Plus size={14} className="mr-2" />
          New Writing
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <FileText size={24} className="text-pink-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{writings.length}</div>
              <div className="text-xs text-muted-foreground">Total Pieces</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Target size={24} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Words Written</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Star size={24} className="text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{publishedCount}</div>
              <div className="text-xs text-muted-foreground">Published</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <PenTool size={24} className="text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{draftsCount}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "STORY" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("STORY")}
          className="text-purple-400"
        >
          Stories
        </Button>
        <Button
          variant={filter === "BLOG_POST" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("BLOG_POST")}
          className="text-cyan-400"
        >
          Blog Posts
        </Button>
        <Button
          variant={filter === "ARTICLE" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("ARTICLE")}
          className="text-yellow-500"
        >
          Articles
        </Button>
        <Button
          variant={filter === "POETRY" ? "neon" : "ghost"}
          size="sm"
          onClick={() => setFilter("POETRY")}
          className="text-pink-400"
        >
          Poetry
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Writing List */}
        <div className="col-span-2 space-y-4">
          {filteredWritings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold mb-2">No writings yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start capturing your thoughts and ideas
                </p>
              </CardContent>
            </Card>
          ) : (
          filteredWritings.map((piece) => {
            const Icon = TYPE_ICONS[piece.type as keyof typeof TYPE_ICONS] || FileText;
            const progress = piece.targetWords > 0 ? (piece.wordCount / piece.targetWords) * 100 : 0;

            return (
              <Card
                key={piece.id}
                className={`cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedPiece === piece.id ? "border-pink-400" : ""
                }`}
                onClick={() => setSelectedPiece(piece.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${
                        TYPE_COLORS[piece.type as keyof typeof TYPE_COLORS]
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{piece.title}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded ${
                            STATUS_COLORS[piece.status as keyof typeof STATUS_COLORS]
                          }`}
                        >
                          {piece.status}
                        </span>
                      </div>
                      {piece.project && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {piece.project.name}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">Word Count</span>
                            <span>
                              {piece.wordCount} / {piece.targetWords}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {new Date(piece.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {piece.area && (
                        <div className="flex gap-2 mt-3">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {piece.area.displayName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm flex items-center gap-2">
                <Sparkles size={14} /> QUICK START
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <PenTool size={14} className="mr-2" />
                Daily Journal Entry
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <FileText size={14} className="mr-2" />
                New Blog Post
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Sparkles size={14} className="mr-2" />
                Capture Idea
              </Button>
            </CardContent>
          </Card>

          {/* Writing Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm flex items-center gap-2">
                <Target size={14} /> DAILY GOAL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold font-mono text-cyan-400">500</div>
                <div className="text-xs text-muted-foreground">words today</div>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span>Progress</span>
                <span>0 / 500</span>
              </div>
              <Progress value={0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Write 500 words to earn <span className="text-yellow-500">+50 XP</span>
              </p>
            </CardContent>
          </Card>

          {/* AI Writing Assistant */}
          <Card className="border-pink-400/40">
            <CardHeader>
              <CardTitle className="font-mono text-sm flex items-center gap-2 text-pink-400">
                <Sparkles size={14} /> AI ASSISTANT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Help me brainstorm
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Improve my writing
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Generate outline
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Fix grammar & style
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
