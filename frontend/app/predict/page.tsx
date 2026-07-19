"use client";

import { FormEvent, useEffect, useState } from "react";
import Papa from "papaparse";
import DashboardLayout from "../../components/DashboardLayout";
import {
    createPrediction,
    getCustomers,
} from "../../services/api";

type Customer = {
    id: number;
    name: string;
    email: string;
};

type PredictionResult = {
    prediction_id: number;
    default_probability: number;
    risk_level: string;
    prediction: string;
};

const initialForm = {
    customer_id: "",
    LIMIT_BAL: "",
    SEX: "",
    EDUCATION: "",
    MARRIAGE: "",
    AGE: "",

    PAY_0: "",
    PAY_2: "",
    PAY_3: "",
    PAY_4: "",
    PAY_5: "",
    PAY_6: "",

    BILL_AMT1: "",
    BILL_AMT2: "",
    BILL_AMT3: "",
    BILL_AMT4: "",
    BILL_AMT5: "",
    BILL_AMT6: "",

    PAY_AMT1: "",
    PAY_AMT2: "",
    PAY_AMT3: "",
    PAY_AMT4: "",
    PAY_AMT5: "",
    PAY_AMT6: "",
};

const paymentStatusFields = [
    { name: "PAY_0", label: "Latest Payment Status" },
    { name: "PAY_2", label: "Payment Status - 2 Months Ago" },
    { name: "PAY_3", label: "Payment Status - 3 Months Ago" },
    { name: "PAY_4", label: "Payment Status - 4 Months Ago" },
    { name: "PAY_5", label: "Payment Status - 5 Months Ago" },
    { name: "PAY_6", label: "Payment Status - 6 Months Ago" },
];

const billFields = [
    { name: "BILL_AMT1", label: "Latest Bill Amount" },
    { name: "BILL_AMT2", label: "Bill Amount - 2 Months Ago" },
    { name: "BILL_AMT3", label: "Bill Amount - 3 Months Ago" },
    { name: "BILL_AMT4", label: "Bill Amount - 4 Months Ago" },
    { name: "BILL_AMT5", label: "Bill Amount - 5 Months Ago" },
    { name: "BILL_AMT6", label: "Bill Amount - 6 Months Ago" },
];

const paymentAmountFields = [
    { name: "PAY_AMT1", label: "Latest Payment Amount" },
    { name: "PAY_AMT2", label: "Payment Amount - 2 Months Ago" },
    { name: "PAY_AMT3", label: "Payment Amount - 3 Months Ago" },
    { name: "PAY_AMT4", label: "Payment Amount - 4 Months Ago" },
    { name: "PAY_AMT5", label: "Payment Amount - 5 Months Ago" },
    { name: "PAY_AMT6", label: "Payment Amount - 6 Months Ago" },
];

export default function PredictionPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [form, setForm] = useState(initialForm);

    const [result, setResult] =
        useState<PredictionResult | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // Load Customers
    // ==========================================

    useEffect(() => {
        async function loadCustomers() {
            try {
                const data = await getCustomers();
                setCustomers(data.customers);
            } catch {
                setError("Failed to load customers.");
            }
        }

        loadCustomers();
    }, []);

    // ==========================================
    // Handle Input Changes
    // ==========================================

    function handleChange(
        event:
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLSelectElement>
    ) {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    }

    // ==========================================
    // Submit Prediction
    // ==========================================

    const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            complete: (results) => {
                const rows = results.data as Record<string, string>[];

                if (!rows.length) {
                    alert("CSV file is empty.");
                    return;
                }

                // First customer/row from CSV
                const row = rows[0];

                const updatedForm: typeof initialForm = {
                    ...initialForm,
                };

                Object.keys(initialForm).forEach((key) => {
                    const typedKey = key as keyof typeof initialForm;

                    if (row[key] !== undefined) {
                        updatedForm[typedKey] = String(row[key]).trim();
                    }
                });

                setForm(updatedForm);

                alert("CSV data loaded successfully!");
            },

            error: (error) => {
                console.error("CSV Error:", error);
                alert("Failed to read CSV file.");
            },
        });
    };

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const numericData = Object.fromEntries(
                Object.entries(form).map(([key, value]) => [
                    key,
                    Number(value),
                ])
            );

            const data = await createPrediction(numericData);

            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Prediction failed."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout>
            {/* ======================================
            Header
        ====================================== */}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    New Credit Risk Prediction
                </h1>

                <p className="mt-2 text-slate-500">
                    Analyze customer financial and payment history using
                    the AI delinquency prediction model.
                </p>
            </div>

            {/* ======================================
            Prediction Form
        ====================================== */}

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
                <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Upload Customer Data
                    </h2>

                    <p className="mt-1 mb-4 text-sm text-slate-600">
                        Upload a CSV file to automatically fill the customer credit information.
                    </p>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="block w-full max-w-md rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700
        file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2
        file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                    />

                    <p className="mt-3 text-xs text-slate-500">
                        The first customer record from the CSV will be loaded into the form.
                    </p>
                </div>
                {/* ======================================
              Customer Selection
          ====================================== */}

                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Customer
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Select the customer you want to analyze.
                    </p>

                    <select
                        name="customer_id"
                        required
                        value={form.customer_id}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                    >
                        <option value="">
                            Select Customer
                        </option>

                        {customers.map((customer) => (
                            <option
                                key={customer.id}
                                value={customer.id}
                            >
                                {customer.name} ({customer.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* ======================================
              Personal Information
          ====================================== */}

                <div className="mb-8 border-t border-slate-200 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Personal Information
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Basic demographic information used by the model.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {/* Gender */}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">
                                Gender
                            </label>

                            <select
                                name="SEX"
                                required
                                value={form.SEX}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select Gender
                                </option>

                                <option value="1">
                                    Male
                                </option>

                                <option value="2">
                                    Female
                                </option>
                            </select>
                        </div>

                        {/* Education */}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">
                                Education
                            </label>

                            <select
                                name="EDUCATION"
                                required
                                value={form.EDUCATION}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select Education
                                </option>

                                <option value="1">
                                    Graduate School
                                </option>

                                <option value="2">
                                    University
                                </option>

                                <option value="3">
                                    High School
                                </option>

                                <option value="4">
                                    Other
                                </option>
                            </select>
                        </div>

                        {/* Marriage */}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">
                                Marital Status
                            </label>

                            <select
                                name="MARRIAGE"
                                required
                                value={form.MARRIAGE}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select Status
                                </option>

                                <option value="1">
                                    Married
                                </option>

                                <option value="2">
                                    Single
                                </option>

                                <option value="3">
                                    Other
                                </option>
                            </select>
                        </div>

                        {/* Age */}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">
                                Age
                            </label>

                            <input
                                type="number"
                                name="AGE"
                                required
                                min="18"
                                value={form.AGE}
                                onChange={handleChange}
                                placeholder="Enter age"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* ======================================
              Credit Information
          ====================================== */}

                <div className="mb-8 border-t border-slate-200 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Credit Information
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Enter the customer's approved credit limit.
                    </p>

                    <div className="max-w-md">
                        <label className="mb-2 block text-sm font-medium text-slate-600">
                            Credit Limit
                        </label>

                        <input
                            type="number"
                            name="LIMIT_BAL"
                            required
                            min="0"
                            value={form.LIMIT_BAL}
                            onChange={handleChange}
                            placeholder="Enter credit limit"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* ======================================
              Payment History
          ====================================== */}

                <div className="mb-8 border-t border-slate-200 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Payment History
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Select the repayment status for the previous six
                        months.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paymentStatusFields.map((field) => (
                            <div key={field.name}>
                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    {field.label}
                                </label>

                                <select
                                    name={field.name}
                                    required
                                    value={
                                        form[
                                        field.name as keyof typeof form
                                        ]
                                    }
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select payment status
                                    </option>

                                    <option value="-2">
                                        No consumption
                                    </option>

                                    <option value="-1">
                                        Paid in full
                                    </option>

                                    <option value="0">
                                        Revolving credit / On time
                                    </option>

                                    <option value="1">
                                        1 month delayed
                                    </option>

                                    <option value="2">
                                        2 months delayed
                                    </option>

                                    <option value="3">
                                        3 months delayed
                                    </option>

                                    <option value="4">
                                        4 months delayed
                                    </option>

                                    <option value="5">
                                        5 months delayed
                                    </option>

                                    <option value="6">
                                        6 months delayed
                                    </option>

                                    <option value="7">
                                        7 months delayed
                                    </option>

                                    <option value="8">
                                        8+ months delayed
                                    </option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ======================================
              Monthly Bill Amounts
          ====================================== */}

                <div className="mb-8 border-t border-slate-200 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Monthly Bill Amounts
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Enter the customer's bill statement amounts for the
                        previous six months.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {billFields.map((field) => (
                            <div key={field.name}>
                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    {field.label}
                                </label>

                                <input
                                    type="number"
                                    name={field.name}
                                    required
                                    value={
                                        form[
                                        field.name as keyof typeof form
                                        ]
                                    }
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ======================================
              Monthly Payment Amounts
          ====================================== */}

                <div className="border-t border-slate-200 pt-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Monthly Payment Amounts
                    </h2>

                    <p className="mb-4 mt-1 text-sm text-slate-500">
                        Enter the customer's payment amounts for the previous
                        six months.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paymentAmountFields.map((field) => (
                            <div key={field.name}>
                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    {field.label}
                                </label>

                                <input
                                    type="number"
                                    name={field.name}
                                    required
                                    min="0"
                                    value={
                                        form[
                                        field.name as keyof typeof form
                                        ]
                                    }
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ======================================
              Submit
          ====================================== */}

                <div className="mt-8 border-t border-slate-200 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Analyzing Credit Risk..."
                            : "Predict Credit Risk"}
                    </button>

                    {error && (
                        <p className="mt-4 text-sm font-medium text-red-600">
                            {error}
                        </p>
                    )}
                </div>
            </form>

            {/* ======================================
            Prediction Result
        ====================================== */}

            {result && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900">
                            AI Risk Assessment
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Prediction generated by the Random Forest model.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Probability */}

                        <div className="rounded-xl bg-slate-50 p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Default Probability
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {result.default_probability}%
                            </p>
                        </div>

                        {/* Risk */}

                        <div className="rounded-xl bg-slate-50 p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Risk Level
                            </p>

                            <span
                                className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${result.risk_level === "HIGH RISK"
                                    ? "bg-red-100 text-red-700"
                                    : result.risk_level === "MEDIUM RISK"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                    }`}
                            >
                                {result.risk_level}
                            </span>
                        </div>

                        {/* Prediction */}

                        <div className="rounded-xl bg-slate-50 p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Prediction
                            </p>

                            <p className="mt-2 text-xl font-bold text-slate-900">
                                {result.prediction}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <p className="text-sm text-slate-500">
                            Prediction ID: #{result.prediction_id}
                        </p>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}