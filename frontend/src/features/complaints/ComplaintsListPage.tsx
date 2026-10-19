import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Complaint, IssueCategory, ComplaintStatus } from '../../types';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { ComplaintsMap } from '../../components/maps/ComplaintsMap';
import { Button } from '../../components/common/Button';
import { 
  Search, Filter, MapPin, Grid, List as ListIcon, 
  ChevronLeft, ChevronRight, PlusCircle, RotateCcw
} from 'lucide-react';

export const ComplaintsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.listPublicComplaints({
        page,
        page_size: 12,
        category: category || undefined,
        status: status || undefined,
      });
      // Filter client-side for search if public endpoint
      let items = res.items;
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter(
          (c) =>
            c.reference_number.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
      }
      setComplaints(items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Open Civic Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Explore Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search publicly recorded municipal infrastructure problems and track resolution progress across all wards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Map view"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

          <Link to="/report">
            <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Report Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference number (CLN-...), keyword, road, or area..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              <option value="POTHOLE">Pothole / Road Crater</option>
              <option value="GARBAGE">Garbage Accumulation</option>
              <option value="STREETLIGHT">Broken Streetlight</option>
              <option value="DRAINAGE">Open Drain / Sewer</option>
              <option value="ROAD_DAMAGE">Road & Divider Damage</option>
              <option value="DAMAGED_SIGN">Damaged Signage</option>
              <option value="WATER_LEAKAGE">Water Pipeline Leak</option>
              <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CITIZEN_VERIFIED">Citizen Verified</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>

            {(search || category || status) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading civic complaints from database...</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="space-y-3">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between">
            <span>Showing {complaints.length} coordinates plotted on OpenStreetMap. Click any pin to view complaint details.</span>
            <span className="font-bold">Privacy-Generalized</span>
          </div>
          <ComplaintsMap complaints={complaints} height="600px" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Complaints Match Your Filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting different categories, or resetting filters.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Showing page <span className="font-bold text-slate-800">{page}</span> of{' '}
              <span className="font-bold text-slate-800">{Math.max(1, Math.ceil(total / 12))}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 12 >= total}
                onClick={() => setPage((p) => p + 1)}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
