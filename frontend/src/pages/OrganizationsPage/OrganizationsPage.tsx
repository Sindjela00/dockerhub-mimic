import { Building2, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import CreateOrganizationModal from "@/components/Modals/CreateOrganizationModal/CreateOrganizationModal";
import InputField from "@/components/InputField/InputField";
import Loader from "@/components/Loader/Loader";
import OrganizationCard from "@/components/Cards/OrganizationCard/OrganizationCard";
import Pagination from "@/components/Pagination/Pagination";
import { useAuth } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/services/organizations/useOrganizations/useOrganizations";

export default function OrganizationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const {
    orgs = [],
    total = 0,
    page = 1,
    pageSize = 12,
    loading = false,
    error = null,
    fetchOrganizations,
  } = useOrganizations(token ?? "");

  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetch = useRef(false);

  useEffect(() => {
    if (initialFetch.current) return;
    initialFetch.current = true;
    fetchOrganizations(1);
  }, [fetchOrganizations]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const clearSearchTimeout = () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  };

  const handleSearchChange = (next: string) => {
    setSearch(next);
    clearSearchTimeout();
    searchTimeout.current = setTimeout(() => {
      fetchOrganizations(1, next.trim() || undefined);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearch("");
    clearSearchTimeout();
    fetchOrganizations(1, undefined);
  };

  const handlePageChange = (newPage: number) => {
    clearSearchTimeout();
    fetchOrganizations(newPage, search.trim() || undefined);
  };

  const handleOrgCreated = useCallback(() => {
    fetchOrganizations(page, search.trim() || undefined);
  }, [fetchOrganizations, page, search]);

  const handleOrgClick = (orgName: string) => {
    navigate(`/organizations/${orgName}`);
  };

  const hasSearch = search.trim().length > 0;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Building2 size={20} className="text-brand" />
            Organizations
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {total} {total === 1 ? "organization" : "organizations"}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={15} /> New organization
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-muted border border-danger/20 text-xs text-danger">
          {error}
        </div>
      )}

      {!error && (
        <>
          <InputField
            value={search}
            onChangeRaw={(e) => handleSearchChange(e.target.value)}
            placeholder="Search organizations..."
            startIcon={<Search size={14} />}
            className="max-w-sm"
          />

          {loading ? (
            <div className="py-16">
              <Loader />
            </div>
          ) : orgs.length === 0 && !hasSearch ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
                <Building2 size={28} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  No organizations yet
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Create your first organization to get started.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={14} /> New organization
              </Button>
            </div>
          ) : orgs.length === 0 && hasSearch ? (
            <div className="flex flex-col items-center py-16 text-center gap-2">
              <p className="text-sm text-text-secondary">
                No organizations match{" "}
                <span className="text-text-primary font-medium">
                  "{search}"
                </span>
              </p>
              <button
                onClick={handleClearSearch}
                className="text-xs text-brand hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {orgs.map((org) => (
                <OrganizationCard
                  key={org.name}
                  org={org}
                  onClick={() => handleOrgClick(org.name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && orgs.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      )}

      <CreateOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleOrgCreated}
      />
    </div>
  );
}
