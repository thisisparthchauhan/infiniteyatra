import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Download, Phone, Mail, MessageCircle,
    Clock, CheckCircle, XCircle, AlertCircle, ArrowUpDown,
    ChevronDown, Eye, UserPlus, TrendingUp, Users, Zap,
    Calendar, MapPin, RefreshCw, X
} from 'lucide-react';
import { db } from '../../../firebase';
import {
    collection, onSnapshot, doc, updateDoc, orderBy, query, serverTimestamp, Timestamp
} from 'firebase/firestore';

// Lead status configuration
const LEAD_STATUSES = {
    new: { label: 'New', color: 'bg-blue-500', textColor: 'text-blue-400', bgLight: 'bg-blue-500/10', icon: Zap },
    contacted: { label: 'Contacted', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgLight: 'bg-yellow-500/10', icon: Phone },
    'follow-up': { label: 'Follow Up', color: 'bg-orange-500', textColor: 'text-orange-400', bgLight: 'bg-orange-500/10', icon: Clock },
    converted: { label: 'Converted', color: 'bg-green-500', textColor: 'text-green-400', bgLight: 'bg-green-500/10', icon: CheckCircle },
    lost: { label: 'Lost', color: 'bg-red-500', textColor: 'text-red-400', bgLight: 'bg-red-500/10', icon: XCircle }
};

// Lead source labels
const SOURCE_LABELS = {
    enquiry_popup: 'Enquiry Popup',
    whatsapp_click: 'WhatsApp Click',
    contact_form: 'Contact Form',
    booking_inquiry: 'Booking Inquiry',
    unknown: 'Direct'
};

const AdminLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedLead, setSelectedLead] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [noteText, setNoteText] = useState('');

    // Real-time leads listener
    useEffect(() => {
        const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLeads(leadsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching leads:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filtered & sorted leads
    const filteredLeads = useMemo(() => {
        let result = [...leads];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(lead =>
                (lead.name || '').toLowerCase().includes(q) ||
                (lead.firstName || '').toLowerCase().includes(q) ||
                (lead.lastName || '').toLowerCase().includes(q) ||
                (lead.email || '').toLowerCase().includes(q) ||
                (lead.phone || lead.mobile || '').includes(q) ||
                (lead.packageName || '').toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(lead => (lead.status || 'new') === statusFilter);
        }

        // Source filter
        if (sourceFilter !== 'all') {
            result = result.filter(lead => (lead.source_type || 'unknown') === sourceFilter);
        }

        // Sort
        if (sortBy === 'newest') {
            result.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return aTime - bTime;
            });
        }

        return result;
    }, [leads, searchQuery, statusFilter, sourceFilter, sortBy]);

    // Stats
    const stats = useMemo(() => {
        const total = leads.length;
        const newLeads = leads.filter(l => (l.status || 'new') === 'new').length;
        const contacted = leads.filter(l => l.status === 'contacted').length;
        const converted = leads.filter(l => l.status === 'converted').length;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

        // Leads from last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const thisWeek = leads.filter(l => {
            const time = l.createdAt?.toMillis?.() || 0;
            return time > weekAgo;
        }).length;

        return { total, newLeads, contacted, converted, conversionRate, thisWeek };
    }, [leads]);

    // Update lead status
    const updateLeadStatus = async (leadId, newStatus) => {
        try {
            await updateDoc(doc(db, 'leads', leadId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating lead:', error);
        }
    };

    // Add note to lead
    const addNote = async (leadId) => {
        if (!noteText.trim()) return;
        try {
            const lead = leads.find(l => l.id === leadId);
            const existingNotes = lead?.notes || [];
            await updateDoc(doc(db, 'leads', leadId), {
                notes: [...existingNotes, {
                    text: noteText,
                    addedAt: new Date().toISOString(),
                    addedBy: 'Admin'
                }],
                updatedAt: serverTimestamp()
            });
            setNoteText('');
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    // Export leads to CSV
    const exportCSV = () => {
        const headers = ['Name', 'Phone', 'Email', 'Source', 'Package', 'Status', 'Date', 'Page'];
        const rows = filteredLeads.map(lead => [
            lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
            lead.phone || lead.mobile || lead.fullMobile || '',
            lead.email || '',
            SOURCE_LABELS[lead.source_type] || lead.source_type || 'Direct',
            lead.packageName || '',
            lead.status || 'new',
            lead.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '',
            lead.sourcePage || lead.source || ''
        ]);

        const csv = [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infinite-yatra-leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // WhatsApp follow-up
    const openWhatsApp = (lead) => {
        const phone = (lead.phone || lead.mobile || lead.fullMobile || '').replace(/\D/g, '');
        const name = lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
        const pkg = lead.packageName ? ` about *${lead.packageName}*` : '';
        const message = encodeURIComponent(
            `Hi ${name}! This is Infinite Yatra. Thank you for your interest${pkg}. How can we help you plan your trip?`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '-';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getLeadName = (lead) => {
        return lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';
    };

    const getLeadPhone = (lead) => {
        return lead.phone || lead.mobile || lead.fullMobile || '-';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <RefreshCw size={32} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Leads', value: stats.total, icon: Users, color: 'from-blue-600 to-blue-400' },
                    { label: 'New (Unread)', value: stats.newLeads, icon: Zap, color: 'from-yellow-600 to-yellow-400' },
                    { label: 'Contacted', value: stats.contacted, icon: Phone, color: 'from-purple-600 to-purple-400' },
                    { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'from-green-600 to-green-400' },
                    { label: 'This Week', value: stats.thisWeek, icon: Calendar, color: 'from-cyan-600 to-cyan-400' },
                    { label: 'Conv. Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'from-emerald-600 to-emerald-400' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={16} className="text-white" />
                            </div>
                            <span className="text-xs text-slate-400">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, email, package..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="all" className="bg-[#111]">All Status</option>
                            {Object.entries(LEAD_STATUSES).map(([key, val]) => (
                                <option key={key} value={key} className="bg-[#111]">{val.label}</option>
                            ))}
                        </select>

                        {/* Source Filter */}
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="all" className="bg-[#111]">All Sources</option>
                            {Object.entries(SOURCE_LABELS).map(([key, val]) => (
                                <option key={key} value={key} className="bg-[#111]">{val}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <button
                            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowUpDown size={14} />
                            {sortBy === 'newest' ? 'Newest' : 'Oldest'}
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white font-medium transition-colors"
                        >
                            <Download size={14} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Quick status filters */}
                <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        All ({stats.total})
                    </button>
                    {Object.entries(LEAD_STATUSES).map(([key, val]) => {
                        const count = leads.filter(l => (l.status || 'new') === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${statusFilter === key ? `${val.bgLight} ${val.textColor}` : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${val.color}`} />
                                {val.label} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {filteredLeads.length === 0 ? (
                    <div className="py-20 text-center">
                        <UserPlus size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400 text-lg">No leads found</p>
                        <p className="text-slate-600 text-sm mt-1">
                            {leads.length === 0 ? 'Leads will appear here when visitors submit inquiries or click WhatsApp' : 'Try adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Lead</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Contact</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Source</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Package</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Status</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Time</th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead, i) => {
                                        const status = LEAD_STATUSES[lead.status || 'new'];
                                        const StatusIcon = status.icon;
                                        return (
                                            <motion.tr
                                                key={lead.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                                            >
                                                {/* Name */}
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{getLeadName(lead)}</p>
                                                        {lead.sourcePage && (
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <MapPin size={10} />
                                                                {lead.sourcePage}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-4 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-slate-300 flex items-center gap-1.5">
                                                            <Phone size={10} className="text-slate-500" />
                                                            {getLeadPhone(lead)}
                                                        </p>
                                                        {lead.email && (
                                                            <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                                <Mail size={10} className="text-slate-500" />
                                                                {lead.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Source */}
                                                <td className="px-4 py-4">
                                                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                                                        {SOURCE_LABELS[lead.source_type] || 'Direct'}
                                                    </span>
                                                </td>

                                                {/* Package */}
                                                <td className="px-4 py-4">
                                                    <p className="text-xs text-slate-300 max-w-[150px] truncate">
                                                        {lead.packageName || '-'}
                                                    </p>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={lead.status || 'new'}
                                                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${status.bgLight} ${status.textColor} border-white/10`}
                                                        style={{ backgroundColor: 'transparent' }}
                                                    >
                                                        {Object.entries(LEAD_STATUSES).map(([key, val]) => (
                                                            <option key={key} value={key} className="bg-[#111] text-white">{val.label}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Time */}
                                                <td className="px-4 py-4">
                                                    <p className="text-xs text-slate-400">{formatTime(lead.createdAt)}</p>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openWhatsApp(lead)}
                                                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                                            title="WhatsApp Follow-up"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLead(lead);
                                                                setIsDetailOpen(true);
                                                            }}
                                                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {filteredLeads.map((lead, i) => {
                                const status = LEAD_STATUSES[lead.status || 'new'];
                                return (
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="p-4 hover:bg-white/[0.03] transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{getLeadName(lead)}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{getLeadPhone(lead)}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full ${status.bgLight} ${status.textColor} font-medium`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                            <span>{SOURCE_LABELS[lead.source_type] || 'Direct'}</span>
                                            <span>-</span>
                                            <span>{formatTime(lead.createdAt)}</span>
                                            {lead.packageName && (
                                                <>
                                                    <span>-</span>
                                                    <span className="truncate max-w-[120px]">{lead.packageName}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openWhatsApp(lead)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                                            >
                                                <MessageCircle size={12} /> WhatsApp
                                            </button>
                                            <select
                                                value={lead.status || 'new'}
                                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                                            >
                                                {Object.entries(LEAD_STATUSES).map(([key, val]) => (
                                                    <option key={key} value={key} className="bg-[#111]">{val.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    setSelectedLead(lead);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="px-3 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-colors"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Lead Detail Modal */}
            <AnimatePresence>
                {isDetailOpen && selectedLead && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{getLeadName(selectedLead)}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{formatTime(selectedLead.createdAt)}</p>
                                </div>
                                <button onClick={() => setIsDetailOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="p-6 space-y-4">
                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Information</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                            <Phone size={16} className="text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Phone</p>
                                                <p className="text-sm text-white">{getLeadPhone(selectedLead)}</p>
                                            </div>
                                        </div>
                                        {selectedLead.email && (
                                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                                <Mail size={16} className="text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Email</p>
                                                    <p className="text-sm text-white">{selectedLead.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lead Info */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-xs text-slate-500">Source</p>
                                            <p className="text-sm text-white">{SOURCE_LABELS[selectedLead.source_type] || 'Direct'}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-xs text-slate-500">Status</p>
                                            <select
                                                value={selectedLead.status || 'new'}
                                                onChange={(e) => {
                                                    updateLeadStatus(selectedLead.id, e.target.value);
                                                    setSelectedLead(prev => ({ ...prev, status: e.target.value }));
                                                }}
                                                className="text-sm text-white bg-transparent focus:outline-none cursor-pointer"
                                            >
                                                {Object.entries(LEAD_STATUSES).map(([key, val]) => (
                                                    <option key={key} value={key} className="bg-[#111]">{val.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedLead.packageName && (
                                            <div className="p-3 bg-white/5 rounded-xl col-span-2">
                                                <p className="text-xs text-slate-500">Interested In</p>
                                                <p className="text-sm text-white">{selectedLead.packageName}</p>
                                            </div>
                                        )}
                                        {(selectedLead.sourcePage || selectedLead.source) && (
                                            <div className="p-3 bg-white/5 rounded-xl col-span-2">
                                                <p className="text-xs text-slate-500">From Page</p>
                                                <p className="text-sm text-white">{selectedLead.sourcePage || selectedLead.source}</p>
                                            </div>
                                        )}
                                        {selectedLead.numberOfPeople && (
                                            <div className="p-3 bg-white/5 rounded-xl">
                                                <p className="text-xs text-slate-500">People</p>
                                                <p className="text-sm text-white">{selectedLead.numberOfPeople}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</h4>
                                    {(selectedLead.notes || []).length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedLead.notes.map((note, i) => (
                                                <div key={i} className="p-3 bg-white/5 rounded-xl">
                                                    <p className="text-sm text-white">{note.text}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{note.addedBy} - {new Date(note.addedAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500">No notes yet</p>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addNote(selectedLead.id)}
                                            placeholder="Add a note..."
                                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                        />
                                        <button
                                            onClick={() => addNote(selectedLead.id)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white font-medium transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => openWhatsApp(selectedLead)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                                    >
                                        <MessageCircle size={16} /> WhatsApp Follow-up
                                    </button>
                                    {selectedLead.email && (
                                        <a
                                            href={`mailto:${selectedLead.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
                                        >
                                            <Mail size={16} /> Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminLeads;
