"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface ImportExportButtonsProps {
  entityType?: string; // used for filename fallback / labels
  displayName?: string; // what to show on buttons
  importUrl?: string; // POST endpoint for bulk upload (expects form file)
  exportUrl?: string; // GET endpoint that returns file (pdf/xlsx/etc)
  onImportSuccess?: () => void;
  onExportSuccess?: () => void;
  disabled?: boolean;
  accept?: string; // file input accept string
}

export function ImportExportButtons({
  entityType = "data",
  displayName = "Items",
  importUrl,
  exportUrl,
  onImportSuccess,
  onExportSuccess,
  disabled = false,
  accept = ".xlsx,.xls,.csv",
}: ImportExportButtonsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loadingImport, setLoadingImport] = React.useState(false);
  const [loadingExport, setLoadingExport] = React.useState(false);

  const validateFile = (file: File) => {
    const allowed = [".xlsx", ".xls", ".csv"];
    const name = file.name.toLowerCase();
    const ok = allowed.some((ext) => name.endsWith(ext));
    return {
      isValid: ok,
      error: ok ? undefined : "Only .xlsx, .xls or .csv files are allowed",
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!importUrl) {
      toast.error("Import URL not provided");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setLoadingImport(true);
      const token = localStorage.getItem("token");
      const form = new FormData();
      // API often expects "file" or "files", adjust if your backend expects different key
      form.append("file", file);

      const res = await axios.post(importUrl, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(res?.data?.message || `Imported ${displayName} successfully`);
      onImportSuccess?.();
    } catch (err: any) {
      console.error("Import error:", err);
      const msg = err?.response?.data?.message || "Import failed";
      toast.error(msg);
    } finally {
      setLoadingImport(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getFilenameFromDisposition = (disp?: string, fallback?: string) => {
    if (!disp) return fallback || `${entityType}-export`;
    const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(disp);
    if (match && match[1]) return decodeURIComponent(match[1].replace(/['"]/g, ""));
    return fallback || `${entityType}-export`;
  };

  const handleExportClick = async () => {
    if (!exportUrl) {
      toast.error("Export URL not provided");
      return;
    }

    try {
      setLoadingExport(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(exportUrl, {
        responseType: "blob",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const blob = new Blob([res.data], { type: res.data.type || "application/octet-stream" });
      const disposition = (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) as string | undefined;
      const filename = getFilenameFromDisposition(disposition, `${entityType}.pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename}`);
      onExportSuccess?.();
    } catch (err: any) {
      console.error("Export error:", err);
      const msg = err?.response?.data?.message || "Export failed";
      toast.error(msg);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={disabled || loadingImport}
        className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll"
      >
        <Upload className="h-4 w-4" />
        {loadingImport ? `Importing ${displayName}...` : `Import ${displayName}`}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportClick}
        disabled={disabled || loadingExport}
        className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll"
      >
        <Download className="h-4 w-4" />
        {loadingExport ? `Downloading...` : `Export ${displayName}`}
      </Button>
    </div>
  );
}

export default ImportExportButtons;
