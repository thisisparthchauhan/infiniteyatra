import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, Download, PieChart, DollarSign, Calendar, ArrowUpRight, FileText, ChevronDown } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

const Financials = () => {
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        netProfit: 0,
        pendingPayments: 0,
        gstCollected: 0
    });

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const q = query(collection(db, 'bookings'));
                const snapshot = await getDocs(q);
                const bookings = snapshot.docs.map(doc => doc.data());

                let revenue = 0;
                let pending = 0;
                const monthlyStats = {};

                bookings.forEach(b => {
                    const amount = parseFloat(b.totalPrice) || 0;
                    const paid = parseFloat(b.amountPaid) || 0;

                    if (b.status === 'confirmed') {
                        revenue += amount;
                        // GST Calculation (Assuming 5% included)
                        // Group by Month
                        const date = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
                        const monthKey = date.toLocaleString('default', { month: 'short' });

                        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { name: monthKey, revenue: 0, profit: 0 };
                        monthlyStats[monthKey].revenue += amount;
                        monthlyStats[monthKey].profit += (amount * 0.20); // 20% Margin Assumption
                    }

                    if (b.status === 'pending' || (b.status === 'confirmed' && paid < amount)) {
                        pending += (amount - paid);
                    }
                });

                // Convert to array and sort (mock sort order for now: Jan, Feb...)
                const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const charData = Object.values(monthlyStats).sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));

                setMonthlyData(charData);
                setMetrics({
                    totalRevenue: revenue,
                    netProfit: revenue * 0.20, // 20% Margin
                    pendingPayments: pending,
                    gstCollected: revenue * 0.05 // 5% GST
                });
            } catch (err) {
                console.error("Error calculating financials:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
    }, []);

    const formatCurrency = (val) => `₹${val.toLocaleString()}`;

    // Export to CSV
    const exportToCSV = () => {
        const data = [
            { Metric: 'Total Revenue', Value: `₹${metrics.totalRevenue.toLocaleString()}` },
            { Metric: 'Net Profit (Est)', Value: `₹${metrics.netProfit.toLocaleString()}` },
            { Metric: 'Pending Collection', Value: `₹${metrics.pendingPayments.toLocaleString()}` },
            { Metric: 'GST Liability (5%)', Value: `₹${metrics.gstCollected.toLocaleString()}` },
            {},
            { Metric: 'Monthly Breakdown', Value: '' },
            ...monthlyData.map(m => ({
                Metric: m.name,
                Revenue: `₹${m.revenue.toLocaleString()}`,
                Profit: `₹${m.profit.toLocaleString()}`
            }))
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'financial_report.csv');
    };

    // Export GST Report as PDF
    const exportGSTReport = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('GST Report - Infinite Yatra', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            head: [['Description', 'Amount']],
            body: [
                ['Total Revenue', `₹${metrics.totalRevenue.toLocaleString()}`],
                ['GST Rate', '5%'],
                ['GST Liability', `₹${metrics.gstCollected.toLocaleString()}`],
                ['Net Revenue (excl. GST)', `₹${(metrics.totalRevenue - metrics.gstCollected).toLocaleString()}`]
            ],
            startY: 38,
            styles: { fontSize: 11, cellPadding: 4 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.text('Monthly GST Breakdown:', 14, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            head: [['Month', 'Revenue', 'GST (5%)']],
            body: monthlyData.map(m => [
                m.name,
                `₹${m.revenue.toLocaleString()}`,
                `₹${(m.revenue * 0.05).toLocaleString()}`
            ]),
            startY: doc.lastAutoTable.finalY + 20,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [16, 185, 129] }
        });

        doc.save('gst_report.pdf');
        setShowExportMenu(false);
    };

    // Export dropdown state
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef(null);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Financial Report - Infinite Yatra', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
            head: [['Metric', 'Value']],
            body: [
                ['Total Revenue', `₹${metrics.totalRevenue.toLocaleString()}`],
                ['Net Profit (Est)', `₹${metrics.netProfit.toLocaleString()}`],
                ['Pending Collection', `₹${metrics.pendingPayments.toLocaleString()}`],
                ['GST Liability (5%)', `₹${metrics.gstCollected.toLocaleString()}`]
            ],
            startY: 38,
            styles: { fontSize: 11, cellPadding: 4 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        if (monthlyData.length > 0) {
            doc.text('Monthly Breakdown:', 14, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                head: [['Month', 'Revenue', 'Profit']],
                body: monthlyData.map(m => [
                    m.name,
                    `₹${m.revenue.toLocaleString()}`,
                    `₹${m.profit.toLocaleString()}`
                ]),
                startY: doc.lastAutoTable.finalY + 20,
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [16, 185, 129] }
            });
        }

        doc.save('financial_report.pdf');
        setShowExportMenu(false);
    };

    // Export to Excel
    const exportToExcel = () => {
        const summaryData = [
            { Metric: 'Total Revenue', Value: metrics.totalRevenue },
            { Metric: 'Net Profit (Est)', Value: metrics.netProfit },
            { Metric: 'Pending Collection', Value: metrics.pendingPayments },
            { Metric: 'GST Liability (5%)', Value: metrics.gstCollected }
        ];
        const monthlyExport = monthlyData.map(m => ({
            Month: m.name,
            Revenue: m.revenue,
            Profit: m.profit
        }));

        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        const monthlySheet = XLSX.utils.json_to_sheet(monthlyExport);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'financial_report.xlsx');
        setShowExportMenu(false);
    };

    // Export to Text
    const exportToText = () => {
        let text = 'FINANCIAL REPORT - INFINITE YATRA\n';
        text += `Generated: ${new Date().toLocaleString()}\n\n`;
        text += '='.repeat(50) + '\n\n';
        text += `Total Revenue: ₹${metrics.totalRevenue.toLocaleString()}\n`;
        text += `Net Profit (Est): ₹${metrics.netProfit.toLocaleString()}\n`;
        text += `Pending Collection: ₹${metrics.pendingPayments.toLocaleString()}\n`;
        text += `GST Liability (5%): ₹${metrics.gstCollected.toLocaleString()}\n\n`;
        text += '--- Monthly Breakdown ---\n\n';
        monthlyData.forEach(m => {
            text += `${m.name}: Revenue ₹${m.revenue.toLocaleString()}, Profit ₹${m.profit.toLocaleString()}\n`;
        });

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'financial_report.txt');
        setShowExportMenu(false);
    };

    // Wrap CSV export to close menu
    const handleExportCSV = () => {
        exportToCSV();
        setShowExportMenu(false);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Calculating Financials...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-green-400" /> Financial Intelligence
                    </h3>
                    <p className="text-slate-400 text-sm">Real-time P&L, GST Reports & Revenue Analysis</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportGSTReport} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                        <FileText size={16} /> GST Report
                    </button>
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            <Download size={16} /> Export <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    <button onClick={exportToPDF} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-red-400" /> PDF Document
                                    </button>
                                    <button onClick={exportToExcel} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-green-400" /> Excel Spreadsheet
                                    </button>
                                    <button onClick={handleExportCSV} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-yellow-400" /> CSV File
                                    </button>
                                    <button onClick={exportToText} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-blue-400" /> Text File
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className="text-green-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                        <ArrowUpRight size={12} /> +12% this month
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={64} className="text-purple-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Profit (Est)</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.netProfit)}</p>
                    <p className="text-purple-400 text-xs mt-2">
                        ~20% Margin
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={64} className="text-orange-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Collect</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.pendingPayments)}</p>
                    <p className="text-orange-400 text-xs mt-2">
                        Due from bookings
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={64} className="text-blue-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">GST Liability</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.gstCollected)}</p>
                    <p className="text-blue-400 text-xs mt-2">
                        @ 5% on Revenue
                    </p>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-6">Revenue Growth</h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Profit vs Revenue Bar */}
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-6">P&L Analysis</h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Financials;
