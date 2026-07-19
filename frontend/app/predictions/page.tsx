"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getPredictions } from "../../services/api";

type Prediction = {
    prediction_id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    default_probability: number;
    risk_level: string;
    prediction: string;
    created_at: string;
};

export default function PredictionsPage() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadPredictions() {
            try {
                const data = await getPredictions();
                setPredictions(data.predictions);
            } catch {
                setError("Failed to load prediction history.");
            } finally {
                setLoading(false);
            }
        }

        loadPredictions();
    }, []);

    function getRiskStyle(riskLevel: string) {
        if (riskLevel === "HIGH RISK") {
            return "bg-red-100 text-red-700";
        }

        if (riskLevel === "MEDIUM RISK") {
            return "bg-yellow-100 text-yellow-700";
        }

        return "bg-green-100 text-green-700";
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Prediction History
                </h1>

                <p className="mt-2 text-slate-500">
                    View all AI credit delinquency risk assessments.
                </p>
            </div>

            {/* Prediction History */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            All Predictions
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Total predictions: {predictions.length}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-slate-500">
                        Loading prediction history...
                    </p>
                ) : error ? (
                    <p className="text-red-600">
                        {error}
                    </p>
                ) : predictions.length === 0 ? (
                    <p className="text-slate-500">
                        No predictions available.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="pb-4">ID</th>
                                    <th className="pb-4">Customer</th>
                                    <th className="pb-4">Email</th>
                                    <th className="pb-4">Probability</th>
                                    <th className="pb-4">Risk Level</th>
                                    <th className="pb-4">Prediction</th>
                                    <th className="pb-4">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {predictions.map((item) => (
                                    <tr
                                        key={item.prediction_id}
                                        className="border-b border-slate-100 text-sm"
                                    >
                                        <td className="py-4 text-slate-500">
                                            #{item.prediction_id}
                                        </td>

                                        <td className="py-4 font-medium text-slate-900">
                                            {item.customer_name}
                                        </td>

                                        <td className="py-4 text-slate-600">
                                            {item.customer_email}
                                        </td>

                                        <td className="py-4 font-medium text-slate-900">
                                            {item.default_probability}%
                                        </td>

                                        <td className="py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskStyle(
                                                    item.risk_level
                                                )}`}
                                            >
                                                {item.risk_level}
                                            </span>
                                        </td>

                                        <td className="py-4 text-slate-600">
                                            {item.prediction}
                                        </td>

                                        <td className="py-4 text-slate-500">
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}