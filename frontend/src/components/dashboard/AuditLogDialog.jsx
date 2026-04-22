import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, LogIn, PlusCircle, Pencil, Trash2, Upload, Save, KeyRound } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const actionConfig = {
  login: { icon: LogIn, accent: "text-blue-700", bg: "bg-blue-100" },
  create: { icon: PlusCircle, accent: "text-emerald-700", bg: "bg-emerald-100" },
  update: { icon: Pencil, accent: "text-amber-700", bg: "bg-amber-100" },
  delete: { icon: Trash2, accent: "text-red-700", bg: "bg-red-100" },
  import: { icon: Upload, accent: "text-violet-700", bg: "bg-violet-100" },
  save: { icon: Save, accent: "text-[#231F20]", bg: "bg-[#FFF1BF]" },
  security: { icon: KeyRound, accent: "text-fuchsia-700", bg: "bg-fuchsia-100" },
};

const formatTimestamp = (value) => {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AuditLogDialog({ open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadAuditLogs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_BASE_URL}/audit-logs/`, {
          params: { limit: 100 },
          headers: getAuthHeaders(),
        });
        setLogs(Array.isArray(response.data) ? response.data : response.data.results || []);
      } catch (loadError) {
        console.error("Failed to load audit logs:", loadError);
        setError(loadError.response?.data?.detail || "Failed to load audit logs.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAuditLogs();
  }, [open]);

  const timelineItems = useMemo(() => {
    return logs.map((log) => {
      const config = actionConfig[log.action] || {
        icon: ShieldCheck,
        accent: "text-[#231F20]",
        bg: "bg-[#F3F4F6]",
      };

      return {
        ...log,
        ...config,
      };
    });
  }, [logs]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit Log</DialogTitle>
          <DialogDescription>
            Timeline of recent actions across accounts. New entries appear here as users work in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FFC20E]" />
              <p className="mt-4 text-sm text-[#6B6B6B]">Loading recent actions...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : timelineItems.length > 0 ? (
            <div className="space-y-4">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative pl-14">
                  <div className="absolute left-5 top-10 h-[calc(100%+1rem)] w-px bg-[#E5E7EB] last:hidden" />
                  <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.accent}`} />
                  </div>

                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#231F20]">
                          {item.actor_name || "Unknown user"}
                          <span className="ml-2 text-xs font-medium uppercase tracking-wide text-[#6B6B6B]">
                            {item.actor_role || "unknown role"}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-[#231F20]">{item.description}</p>
                        <p className="mt-1 text-xs text-[#6B6B6B]">
                          {item.target_type} • {item.target_name}
                        </p>
                      </div>
                      <span className="text-xs text-[#6B6B6B] whitespace-nowrap">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-[#A5A8AB]" />
              <p className="mt-3 text-sm font-medium text-[#231F20]">No audit entries yet</p>
              <p className="mt-1 text-xs text-[#6B6B6B]">
                Activity will appear here after users start making changes in the system.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
