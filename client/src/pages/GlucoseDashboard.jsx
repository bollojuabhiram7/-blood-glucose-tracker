import "../dashboard.css";
import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  HeartPulse,
  Droplets,
  Plus,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Pencil,
  Trash2,
  LogOut,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Menu,
} from "lucide-react";

import api from "../api/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "../dashboard.css";

const TIME_SLOTS = [
  { value: "MORNING", label: "Morning (Fasting)" },
  { value: "AFTER_BREAKFAST", label: "After Breakfast" },
  { value: "AFTER_LUNCH", label: "After Lunch" },
  { value: "AFTER_DINNER", label: "After Dinner" },
];

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSlot = (slot) => {
  return (
    TIME_SLOTS.find((item) => item.value === slot)?.label || slot
  );
};

const emptyForm = {
  date: today(),
  timeSlot: "MORNING",
  value: "",
};

function GlucoseDashboard({ onLogout }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [reportType, setReportType] = useState("daily");

  const [summary, setSummary] = useState({
    highest: null,
    lowest: null,
    average: null,
    count: 0,
  });

  const [readings, setReadings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = `/reports/${reportType}`;

      const response = await api.get(endpoint, {
        params: {
          date: selectedDate,
        },
      });

      const data = response.data;

      setSummary(
        data.summary || {
          highest: null,
          lowest: null,
          average: null,
          count: 0,
        }
      );

      setReadings(data.readings || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load glucose report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Open Add Reading modal
  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      ...emptyForm,
      date: selectedDate,
    });

    setError("");
    setMessage("");
    setShowModal(true);
  };

  // Open Edit Reading modal
  const openEditModal = (reading) => {
    setEditingId(reading.id);

    setFormData({
      date: reading.date.slice(0, 10),
      timeSlot: reading.timeSlot,
      value: String(reading.value),
    });

    setError("");
    setMessage("");
    setShowModal(true);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add or update reading
  const handleSaveReading = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const glucoseValue = Number(formData.value);

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      setError("Enter a whole number between 40 and 600 mg/dL.");
      return;
    }

    if (!formData.date || formData.date > today()) {
      setError("Please select a valid date that is not in the future.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        date: formData.date,
        timeSlot: formData.timeSlot,
        value: glucoseValue,
      };

      if (editingId) {
        await api.put(`/readings/${editingId}`, payload);
        setMessage("Reading updated successfully.");
      } else {
        await api.post("/readings", payload);
        setMessage("Reading added successfully.");
      }

      setShowModal(false);

      // Refresh current report
      await fetchReport();

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save reading. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete reading
  const handleDeleteReading = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this glucose reading?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/readings/${id}`);

      setMessage("Reading deleted successfully.");

      await fetchReport();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete reading."
      );
    }
  };

  // Reading status indicator
  const getReadingStatus = (value) => {
    if (value < 70) {
      return {
        label: "Low",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (value > 180) {
      return {
        label: "High",
        className: "bg-red-100 text-red-700",
      };
    }

    return {
      label: "Recorded",
      className: "bg-green-100 text-green-700",
    };
  };

  const reportLabels = {
    daily: "Daily Report",
    "month-to-date": "Month to Date",
    "previous-month": "Previous Month",
  };

  // Chart data is derived from the currently selected report.
  const chartData = readings.map((reading) => {
    const dateText = String(reading.date).slice(0, 10);
    const [, month, day] = dateText.split("-");
    const slotLabels = {
      MORNING: "Morning",
      AFTER_BREAKFAST: "After breakfast",
      AFTER_LUNCH: "After lunch",
      AFTER_DINNER: "After dinner",
    };

    return {
      label: `${day}/${month}`,
      slot: slotLabels[reading.timeSlot] || reading.timeSlot,
      value: Number(reading.value),
      dateText,
    };
  });

  return (
    <div className="dashboard-shell min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="dashboard-header sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="bg-teal-700 text-white p-2 rounded-xl">
              <HeartPulse size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Sweety
              </h1>

              <p className="text-xs text-slate-500">
                Blood Glucose Tracker
              </p>
            </div>

          </div>

          <div className="hidden md:flex items-center gap-4">

            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.name || "User"}
              </p>

              <p className="text-xs text-slate-500">
                {user.email || ""}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>

          <button
            className="md:hidden text-slate-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>

        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 p-4 flex justify-between items-center">

            <span className="text-sm font-medium text-slate-700">
              {user.name || "User"}
            </span>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>
        )}

      </header>

      {/* MAIN CONTENT */}

      <main className="dashboard-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* PAGE TITLE */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Dashboard
            </h2>

            <p className="text-slate-500 mt-1">
              Monitor your blood glucose levels and health trends.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-3 rounded-xl font-semibold shadow-sm transition"
          >
            <Plus size={20} />
            Add Reading
          </button>

        </div>

        {/* NOTIFICATIONS */}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
            <CheckCircle2 size={18} />
            {message}

            <button
              className="ml-auto"
              onClick={() => setMessage("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            <AlertCircle size={18} />
            {error}

            <button
              className="ml-auto"
              onClick={() => setError("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* REPORT FILTERS */}

        <section className="dashboard-report bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <h3 className="font-bold text-slate-900">
                Glucose Reports
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Choose a reporting period to view your readings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600"
              >

                <option value="daily">Daily Report</option>

                <option value="month-to-date">
                  Month to Date
                </option>

                <option value="previous-month">
                  Previous Month
                </option>

              </select>

              <div className="relative">

                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={selectedDate}
                  max={today()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600 w-full"
                />

              </div>

              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-slate-700 text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

            </div>

          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
            Showing:{" "}
            <span className="font-semibold text-teal-700">
              {reportLabels[reportType]}
            </span>
            {" "} · Selected date: {formatDate(selectedDate)}
          </div>

        </section>

        {/* SUMMARY CARDS */}

        <section className="dashboard-stats grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {/* Highest */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Highest Reading
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                  {loading ? "..." : summary.highest ?? "--"}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    mg/dL
                  </span>
                </h3>
              </div>

              <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                <TrendingUp size={23} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Maximum recorded glucose
            </p>

          </div>

          {/* Lowest */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Lowest Reading
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                  {loading ? "..." : summary.lowest ?? "--"}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    mg/dL
                  </span>
                </h3>
              </div>

              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <TrendingDown size={23} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Minimum recorded glucose
            </p>

          </div>

          {/* Average */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Average Reading
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                  {loading ? "..." : summary.average ?? "--"}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    mg/dL
                  </span>
                </h3>
              </div>

              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                <Activity size={23} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Average glucose level
            </p>

          </div>

          {/* Total */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Readings
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-3">
                  {loading ? "..." : summary.count}
                </h3>
              </div>

              <div className="bg-teal-50 text-teal-700 p-3 rounded-xl">
                <BarChart3 size={23} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Total readings in this period
            </p>

          </div>

        </section>

        {/* MONTHLY GLUCOSE TREND CHART */}

        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              Monthly Glucose Trend
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Glucose readings across the selected reporting period (mg/dL).
            </p>
          </div>

          {reportType === "daily" ? (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-500">
              Select <strong>Month to Date</strong> or <strong>Previous Month</strong> to view the monthly trend.
            </div>
          ) : loading ? (
            <div className="h-72 flex items-center justify-center text-sm text-slate-500">
              Loading glucose trend...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
              No readings available for this period.
            </div>
          ) : (
            <div className="h-72 w-full" role="img" aria-label="Line chart showing glucose readings over the selected month">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    minTickGap={18}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    label={{ value: "mg/dL", angle: -90, position: "insideLeft", fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
                    formatter={(value) => [`${value} mg/dL`, "Glucose"]}
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload;
                      return point ? `${point.dateText} · ${point.slot}` : label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Glucose"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#0f766e", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* READING HISTORY */}

        <section className="dashboard-history bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Reading History
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Your recorded glucose measurements.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={17} />
              {readings.length} readings
            </div>

          </div>

          {loading ? (

            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="animate-spin mx-auto mb-3" size={25} />
              Loading readings...
            </div>

          ) : readings.length === 0 ? (

            <div className="p-12 text-center">

              <div className="bg-teal-50 text-teal-700 p-4 rounded-full w-fit mx-auto mb-4">
                <Droplets size={30} />
              </div>

              <h4 className="text-lg font-semibold text-slate-800">
                No readings found
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                There are no glucose readings for this reporting period.
              </p>

              <button
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <Plus size={18} />
                Add Your First Reading
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">

                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Time Slot</th>
                    <th className="px-6 py-4 font-semibold">Glucose Level</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {readings.map((reading) => {
                    const status = getReadingStatus(reading.value);

                    return (

                      <tr
                        key={reading.id}
                        className="hover:bg-slate-50 transition"
                      >

                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {formatDate(reading.date)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {formatSlot(reading.timeSlot)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <span className="text-lg font-bold text-slate-900">
                            {reading.value}
                          </span>

                          <span className="text-xs text-slate-400 ml-2">
                            mg/dL
                          </span>

                        </td>

                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.className}`}>
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              onClick={() => openEditModal(reading)}
                              title="Edit reading"
                              className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => handleDeleteReading(reading.id)}
                              title="Delete reading"
                              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* FOOTER */}

        <footer className="text-center text-xs text-slate-400 mt-8 pb-4">
          © 2026 Sweety Blood Glucose Tracker. Your health, your data.
        </footer>

      </main>

      {/* ADD / EDIT MODAL */}

      {showModal && (

        <div className="dashboard-modal fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

            {/* Modal Header */}

            <div className="flex items-center justify-between p-6 border-b border-slate-100">

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Reading" : "Add Glucose Reading"}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Enter your blood glucose measurement.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2"
              >
                <X size={22} />
              </button>

            </div>

            {/* Modal Form */}

            <form
              onSubmit={handleSaveReading}
              className="p-6 space-y-5"
            >

              {/* Date */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reading Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  max={today()}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />

              </div>

              {/* Time Slot */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time Slot
                </label>

                <select
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >

                  {TIME_SLOTS.map((slot) => (
                    <option
                      key={slot.value}
                      value={slot.value}
                    >
                      {slot.label}
                    </option>
                  ))}

                </select>

              </div>

              {/* Glucose Value */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Glucose Level (mg/dL)
                </label>

                <input
                  type="number"
                  name="value"
                  min="40"
                  max="600"
                  step="1"
                  placeholder="Enter value (40 - 600)"
                  value={formData.value}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />

                <p className="text-xs text-slate-400 mt-2">
                  Enter a whole number between 40 and 600.
                </p>

              </div>

              {/* Modal Error */}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Buttons */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-3 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Reading"
                      : "Save Reading"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default GlucoseDashboard;