import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Plus, Database, Settings2, Copy, Trash2, Loader2, ChevronRight, Layers } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const MAX_COLLECTIONS = 2;

export default function CollectionsOverviewPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(null); // collection_name currently in action

  useEffect(() => {
    fetchSchemas();
  }, [agentId]);

  const fetchSchemas = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/schemas`, { withCredentials: true });
      setSchemas(data || []);
      // If no schemas, redirect to Schema Builder
      if (!data || data.length === 0) {
        navigate(`/agent/${agentId}/schema-builder`, { replace: true });
        return;
      }
    } catch (err) {
      console.error("Failed to fetch schemas", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (collection_name) => {
    if (schemas.length >= MAX_COLLECTIONS) {
      alert(`Maximum of ${MAX_COLLECTIONS} collections per agent reached. Delete one first.`);
      return;
    }
    setBusyAction(collection_name);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/schemas/${collection_name}/duplicate`,
        {},
        { withCredentials: true }
      );
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to duplicate collection");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async (collection_name, display_name, item_count) => {
    const msg = item_count > 0
      ? `Delete "${display_name}" and ALL ${item_count} items? This cannot be undone.`
      : `Delete "${display_name}"? This cannot be undone.`;
    if (!confirm(msg)) return;

    setBusyAction(collection_name);
    try {
      await axios.delete(`${API}/api/agents/${agentId}/schemas/${collection_name}`, { withCredentials: true });
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete collection");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#57534E]" />
      </div>
    );
  }

  const atLimit = schemas.length >= MAX_COLLECTIONS;

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="collections-overview-page">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">Collections</h1>
            <p className="text-sm text-[#57534E] mt-1">
              All data collections for this agent — {schemas.length}/{MAX_COLLECTIONS} used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/agent/${agentId}/schema-builder`}
              className="h-10 px-4 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2"
              data-testid="go-to-schema-builder"
            >
              <Settings2 className="w-4 h-4" />
              Manage Schemas
            </Link>
            <Link
              to={`/agent/${agentId}/schema-builder`}
              className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 ${
                atLimit
                  ? "bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed pointer-events-none"
                  : "bg-[#0C0A09] text-white hover:bg-[#1C1917]"
              }`}
              data-testid="new-collection-btn"
              title={atLimit ? `Max ${MAX_COLLECTIONS} collections reached` : "New collection"}
            >
              <Plus className="w-4 h-4" />
              New Collection
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemas.map((schema) => (
            <div
              key={schema.collection_name}
              className="bg-white border border-[#E7E5E4] rounded-xl p-6 hover:shadow-sm transition-shadow group"
              data-testid={`collection-card-${schema.collection_name}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F0EB] flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-[#1C1917]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[#0C0A09] truncate">{schema.display_name}</h3>
                    <p className="text-xs text-[#A8A29E] font-mono truncate">{schema.collection_name}</p>
                  </div>
                </div>
                {schema.is_default && (
                  <span className="text-[10px] font-medium text-[#78716C] bg-[#F5F5F4] rounded-full px-2 py-0.5 shrink-0">
                    DEFAULT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#FAFAFA] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#A8A29E]">Items</p>
                  <p className="text-lg font-semibold text-[#0C0A09]">{schema.item_count ?? 0}</p>
                </div>
                <div className="bg-[#FAFAFA] rounded-lg px-3 py-2">
                  <p className="text-xs text-[#A8A29E]">Fields</p>
                  <p className="text-lg font-semibold text-[#0C0A09]">{schema.fields?.length ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/agent/${agentId}/collection/${schema.collection_name}`}
                  className="flex-1 h-9 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center justify-center gap-2"
                  data-testid={`view-collection-${schema.collection_name}`}
                >
                  View Data
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDuplicate(schema.collection_name)}
                  disabled={busyAction === schema.collection_name || atLimit}
                  className="h-9 w-9 border border-[#E7E5E4] rounded-lg flex items-center justify-center hover:bg-[#FAFAFA] text-[#57534E] disabled:opacity-40"
                  title={atLimit ? "Limit reached" : "Duplicate"}
                  data-testid={`duplicate-collection-${schema.collection_name}`}
                >
                  {busyAction === schema.collection_name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(schema.collection_name, schema.display_name, schema.item_count || 0)}
                  disabled={busyAction === schema.collection_name}
                  className="h-9 w-9 border border-[#E7E5E4] rounded-lg flex items-center justify-center hover:bg-[#FEF2F2] hover:border-[#FECACA] text-[#DC2626] disabled:opacity-40"
                  title="Delete"
                  data-testid={`delete-collection-${schema.collection_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty slot card */}
          {!atLimit && (
            <Link
              to={`/agent/${agentId}/schema-builder`}
              className="border-2 border-dashed border-[#D6D3D1] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white hover:border-[#A8A29E] transition-colors min-h-[220px]"
              data-testid="add-collection-card"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-[#57534E]" />
              </div>
              <p className="text-sm font-medium text-[#0C0A09]">Add Collection</p>
              <p className="text-xs text-[#A8A29E] mt-1">
                {MAX_COLLECTIONS - schemas.length} slot{MAX_COLLECTIONS - schemas.length === 1 ? "" : "s"} remaining
              </p>
            </Link>
          )}
        </div>

        {atLimit && (
          <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FDE047] rounded-lg flex items-start gap-3">
            <Database className="w-5 h-5 text-[#CA8A04] shrink-0 mt-0.5" />
            <div className="text-xs text-[#78350F]">
              <p className="font-medium mb-0.5">Collection limit reached ({MAX_COLLECTIONS}/{MAX_COLLECTIONS})</p>
              <p>Delete an existing collection to add a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
