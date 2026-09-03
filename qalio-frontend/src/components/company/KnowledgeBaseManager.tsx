"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Globe,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Bot,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";

interface KnowledgeDoc {
  _id: string;
  title: string;
  type: "pdf" | "url" | "text" | "faq";
  fileName?: string;
  sourceUrl?: string;
  uploadedAt: string;
}

export default function KnowledgeBaseManager() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [activeTab, setActiveTab] = useState<"pdf" | "url" | "text">("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = getCookie("jwt");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/knowledge/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching knowledge docs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", pdfFile);
    if (pdfTitle) formData.append("title", pdfTitle);

    try {
      const token = getCookie("jwt");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/knowledge/upload-pdf`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast.success("PDF policy uploaded & indexed into AI Bot!");
      setPdfFile(null);
      setPdfTitle("");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) {
      toast.error("Please enter a valid URL");
      return;
    }

    setUploading(true);
    try {
      const token = getCookie("jwt");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/knowledge/add-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: urlInput, title: urlTitle }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add URL");

      toast.success("URL content indexed into AI Bot!");
      setUrlInput("");
      setUrlTitle("");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to index URL");
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle || !textContent) {
      toast.error("Please enter title and content");
      return;
    }

    setUploading(true);
    try {
      const token = getCookie("jwt");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/knowledge/add-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: textTitle, content: textContent, type: "faq" }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save entry");

      toast.success("FAQ policy entry saved!");
      setTextTitle("");
      setTextContent("");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to save entry");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getCookie("jwt");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/knowledge/documents/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        toast.success("Document removed from AI Bot");
        setDocuments((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-md">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Knowledge Base & RAG Training</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Company Policy & FAQ Assistant
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Upload your company PDF handbooks, benefits policies, or URL links. Your AI Assistant will automatically answer candidate questions during recruitment drives!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <Card className="lg:col-span-1 border-slate-200/80 shadow-xs rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Knowledge Document
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Select ingestion type for AI bot training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tab Selection */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setActiveTab("pdf")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "pdf" ? "bg-white text-indigo-600 font-semibold shadow-xs" : "hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => setActiveTab("url")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "url" ? "bg-white text-indigo-600 font-semibold shadow-xs" : "hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "text" ? "bg-white text-indigo-600 font-semibold shadow-xs" : "hover:text-slate-900"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FAQ</span>
              </button>
            </div>

            {/* PDF Upload */}
            {activeTab === "pdf" && (
              <form onSubmit={handlePdfUpload} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Document Title</label>
                  <Input
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    placeholder="e.g. Employee Handbook 2026"
                    className="mt-1 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">PDF File</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="mt-1 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading || !pdfFile}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {uploading ? "Uploading PDF..." : "Upload & Index PDF"}
                </Button>
              </form>
            )}

            {/* URL Upload */}
            {activeTab === "url" && (
              <form onSubmit={handleUrlSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Link Title</label>
                  <Input
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="e.g. Company Benefits Webpage"
                    className="mt-1 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Website URL</label>
                  <Input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://company.com/careers"
                    className="mt-1 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading || !urlInput}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {uploading ? "Indexing URL..." : "Index URL Link"}
                </Button>
              </form>
            )}

            {/* FAQ Text */}
            {activeTab === "text" && (
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Policy Question / Title</label>
                  <Input
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="e.g. What is the remote work policy?"
                    className="mt-1 h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Policy Details / Answer</label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Provide detailed answer or policy guidelines..."
                    rows={4}
                    className="mt-1 text-xs rounded-xl border-slate-200"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading || !textTitle || !textContent}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {uploading ? "Saving..." : "Save Policy Entry"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Documents List */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-xs rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              Indexed Documents ({documents.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Active knowledge base sources used by Candidate AI Assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No knowledge sources added yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload PDF handbooks or URLs on the left to train your AI Assistant!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        {doc.type === "pdf" ? (
                          <FileText className="w-4 h-4" />
                        ) : doc.type === "url" ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <HelpCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-semibold text-indigo-600">{doc.type}</span>
                          <span>•</span>
                          <span>Added {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDelete(doc._id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
