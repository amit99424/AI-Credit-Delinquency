"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
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

export default function AnalyticsPage() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const data = await getPredictions();
                setPredictions(data.predictions);
            } catch {
                setError("Failed to load analytics.");
            } finally {
                setLoading(false);
            }
        }

        loadAnalytics();
    }, []);

    const totalPredictions = predictions.length;

    const highRisk = predictions.filter(
        (item) => item.risk_level === "HIGH RISK"
    ).length;

    const mediumRisk = predictions.filter(
        (item) => item.risk_level === "MEDIUM RISK"
    ).length;

    const lowRisk = predictions.filter(
        (item) => item.risk_level === "LOW RISK"
    ).length;

    const averageProbability =
        totalPredictions > 0
            ? (
                predictions.reduce(
                    (sum, item) => sum + item.default_probability,
                    0
                ) / totalPredictions
            ).toFixed(1)
            : "0";

    function getPercentage(value: number) {
        if (totalPredictions === 0) {
            return 0;
        }

        return (value / totalPredictions) * 100;
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Risk Analytics
                </h1>

                <p className="mt-2 text-slate-500">
                    Analyze AI credit delinquency prediction trends.
                </p>
            </div>

            {loading ? (
                <p className="text-slate-500">
                    Loading analytics...
                </p>
            ) : error ? (
                <p className="text-red-600">
                    {error}
                </p>
            ) : (
                <>
                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Predictions"
                            value={totalPredictions}
                            subtitle="Total AI assessments"
                        />

                        <StatCard
                            title="High Risk"
                            value={highRisk}
                            subtitle="High delinquency risk"
                        />

                        <StatCard
                            title="Low Risk"
                            value={lowRisk}
                            subtitle="Low delinquency risk"
                        />

                        <StatCard
                            title="Average Default Risk"
                            value={`${averageProbability}%`}
                            subtitle="Across all predictions"
                        />
                    </div>

                    {/* Risk Distribution */}
                    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Risk Distribution
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Distribution of customers across AI risk categories.
                            </p>
                        </div>

                        <div className="space-y-7">
                            {/* High Risk */}
                            <div>
                                <div className="mb-2 flex justify-between">
                                    <span className="font-medium text-slate-700">
                                        High Risk
                                    </span>

                                    <span className="text-sm text-slate-500">
                                        {highRisk} ({getPercentage(highRisk).toFixed(1)}%)
                                    </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-red-500"
                                        style={{
                                            width: `${getPercentage(highRisk)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Medium Risk */}
                            <div>
                                <div className="mb-2 flex justify-between">
                                    <span className="font-medium text-slate-700">
                                        Medium Risk
                                    </span>

                                    <span className="text-sm text-slate-500">
                                        {mediumRisk} ({getPercentage(mediumRisk).toFixed(1)}%)
                                    </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-yellow-500"
                                        style={{
                                            width: `${getPercentage(mediumRisk)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Low Risk */}
                            <div>
                                <div className="mb-2 flex justify-between">
                                    <span className="font-medium text-slate-700">
                                        Low Risk
                                    </span>

                                    <span className="text-sm text-slate-500">
                                        {lowRisk} ({getPercentage(lowRisk).toFixed(1)}%)
                                    </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{
                                            width: `${getPercentage(lowRisk)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-xl border border-red-100 bg-red-50 p-6">
                            <p className="text-sm font-medium text-red-600">
                                High Risk Rate
                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-700">
                                {getPercentage(highRisk).toFixed(1)}%
                            </p>
                        </div>

                        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-6">
                            <p className="text-sm font-medium text-yellow-700">
                                Medium Risk Rate
                            </p>

                            <p className="mt-2 text-3xl font-bold text-yellow-700">
                                {getPercentage(mediumRisk).toFixed(1)}%
                            </p>
                        </div>

                        <div className="rounded-xl border border-green-100 bg-green-50 p-6">
                            <p className="text-sm font-medium text-green-700">
                                Low Risk Rate
                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-700">
                                {getPercentage(lowRisk).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}