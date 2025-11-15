 "use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload } from "lucide-react";
import { handleImport, handleExport, validateFile, ImportExportConfig } from "@/lib/import-export-utils";
import toast from "react-hot-toast";

interface ImportExportButtonsProps {
  entityType: string;
  config: ImportExportConfig;
  onImportSuccess?: () => void;
  onExportSuccess?: () => void;
  disabled?: boolean;
}

export function ImportExportButtons({
  entityType,
  config,
  onImportSuccess,
  onExportSuccess,
  disabled = false,
}: ImportExportButtonsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      await handleImport(file, entityType, onImportSuccess);
    } catch (error) {
      // Error is already handled in the utility function
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportClick = async () => {
    try {
      await handleExport(entityType, onExportSuccess);
    } catch (error) {
      // Error is already handled in the utility function
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={disabled}
        className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll"
      >
        <Upload className="h-4 w-4" />
        Import {config.displayName}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportClick}
        disabled={disabled}
        className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll"
      >
        <Download className="h-4 w-4" />
        Export {config.displayName}
      </Button>
    </div>
  );
}
