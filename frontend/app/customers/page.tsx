"use client";

import { FormEvent, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
    createCustomer,
    getCustomers,
} from "../../services/api";

type Customer = {
    id: number;
    name: string;
    email: string;
    age: number;
    credit_limit: number;
    created_at: string;
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        age: "",
        credit_limit: "",
    });

    async function loadCustomers() {
        try {
            const data = await getCustomers();
            setCustomers(data.customers);
        } catch {
            setError("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCustomers();
    }, []);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSubmitting(true);
        setError("");

        try {
            await createCustomer({
                name: form.name,
                email: form.email,
                age: Number(form.age),
                credit_limit: Number(form.credit_limit),
            });

            setForm({
                name: "",
                email: "",
                age: "",
                credit_limit: "",
            });

            await loadCustomers();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create customer."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Customers
                </h1>

                <p className="mt-2 text-slate-500">
                    Manage customers for credit risk assessment.
                </p>
            </div>

            {/* Add Customer Form */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    Add New Customer
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <input
                        type="text"
                        placeholder="Customer Name"
                        required
                        value={form.name}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                name: e.target.value,
                            })
                        }
                        className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                    />

                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={form.email}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                email: e.target.value,
                            })
                        }
                        className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                    />

                    <input
                        type="number"
                        placeholder="Age"
                        required
                        min="18"
                        value={form.age}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                age: e.target.value,
                            })
                        }
                        className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                    />

                    <input
                        type="number"
                        placeholder="Credit Limit"
                        required
                        min="0"
                        value={form.credit_limit}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                credit_limit: e.target.value,
                            })
                        }
                        className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                    />

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting
                                ? "Adding Customer..."
                                : "Add Customer"}
                        </button>
                    </div>
                </form>

                {error && (
                    <p className="mt-4 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>

            {/* Customer List */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Customer List
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Total customers: {customers.length}
                    </p>
                </div>

                {loading ? (
                    <p className="text-slate-500">
                        Loading customers...
                    </p>
                ) : customers.length === 0 ? (
                    <p className="text-slate-500">
                        No customers available.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="pb-3">ID</th>
                                    <th className="pb-3">Name</th>
                                    <th className="pb-3">Email</th>
                                    <th className="pb-3">Age</th>
                                    <th className="pb-3">Credit Limit</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="border-b border-slate-100 text-sm"
                                    >
                                        <td className="py-4 text-slate-500">
                                            #{customer.id}
                                        </td>

                                        <td className="py-4 font-medium text-slate-900">
                                            {customer.name}
                                        </td>

                                        <td className="py-4 text-slate-600">
                                            {customer.email}
                                        </td>

                                        <td className="py-4 text-slate-600">
                                            {customer.age}
                                        </td>

                                        <td className="py-4 text-slate-600">
                                            {customer.credit_limit.toLocaleString()}
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