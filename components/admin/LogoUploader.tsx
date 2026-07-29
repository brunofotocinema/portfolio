"use client";

import { useEffect, useMemo, useState } from "react";

interface LogoUploaderProps {
  label: string;
  required?: boolean;
  onChange: (file: File | null) => void;
}

/**
 * File input with an optional client-side "remove background" step
 * (via @imgly/background-removal, loaded on demand — no server/API involved).
 * The parent only receives a file once the user picks it (and, if they run
 * background removal, once they explicitly confirm the result).
 */
export default function LogoUploader({ label, required, onChange }: LogoUploaderProps) {
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [displayFile, setDisplayFile] = useState<File | Blob | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = useMemo(
    () => (displayFile ? URL.createObjectURL(displayFile) : null),
    [displayFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setRawFile(file);
    setDisplayFile(file);
    setPendingBlob(null);
    setError(null);
    onChange(file);
  }

  async function handleRemoveBackground() {
    if (!rawFile) return;
    setProcessing(true);
    setError(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(rawFile);
      setPendingBlob(blob);
      setDisplayFile(blob);
    } catch {
      setError("Não foi possível remover o fundo dessa imagem. Você pode enviá-la sem tratamento.");
    } finally {
      setProcessing(false);
    }
  }

  function confirmPending() {
    if (!pendingBlob || !rawFile) return;
    const name = rawFile.name.replace(/\.\w+$/, "") + "-sem-fundo.png";
    const file = new File([pendingBlob], name, { type: "image/png" });
    setPendingBlob(null);
    onChange(file);
  }

  function discardPending() {
    setPendingBlob(null);
    setDisplayFile(rawFile);
    onChange(rawFile);
  }

  return (
    <div className="admin-field">
      <label>
        {label}
        {required ? " *" : ""}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileInput} />
      </label>

      {previewUrl && (
        <div className="admin-logo-preview">
          <img src={previewUrl} alt="Pré-visualização" />

          {rawFile && !pendingBlob && (
            <button type="button" onClick={handleRemoveBackground} disabled={processing}>
              {processing ? "Removendo fundo..." : "Remover fundo"}
            </button>
          )}

          {pendingBlob && (
            <div className="admin-logo-preview-actions">
              <span>Resultado da remoção de fundo:</span>
              <button type="button" onClick={confirmPending}>
                Usar esta versão
              </button>
              <button type="button" onClick={discardPending}>
                Descartar
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}
    </div>
  );
}
