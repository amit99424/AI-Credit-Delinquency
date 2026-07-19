const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/*
==========================================
Get JWT Token
==========================================
*/

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}


/*
==========================================
Handle Authentication Errors
==========================================
*/

function handleAuthError() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  }
}


/*
==========================================
Get All Customers
==========================================
*/

export async function getCustomers() {
  const token = getToken();

  if (!token) {
    handleAuthError();
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/customers`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    handleAuthError();
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch customers"
    );
  }

  return data;
}


/*
==========================================
Get All Predictions
==========================================
*/

export async function getPredictions() {
  const token = getToken();

  if (!token) {
    handleAuthError();
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/predictions`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    handleAuthError();
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch predictions"
    );
  }

  return data;
}


/*
==========================================
Create Customer
==========================================
*/

export async function createCustomer(customer: {
  name: string;
  email: string;
  age: number;
  credit_limit: number;
}) {
  const token = getToken();

  if (!token) {
    handleAuthError();
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/customers`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(customer),
  });

  if (response.status === 401 || response.status === 403) {
    handleAuthError();
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to create customer"
    );
  }

  return data;
}


/*
==========================================
Create AI Prediction
==========================================
*/

export async function createPrediction(
  data: Record<string, number>
) {
  const token = getToken();

  if (!token) {
    handleAuthError();
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(data),
  });

  if (response.status === 401 || response.status === 403) {
    handleAuthError();
    throw new Error("Session expired. Please login again.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.detail || "Prediction failed"
    );
  }

  if (result.status === "error") {
    throw new Error(
      result.error || "Prediction failed"
    );
  }

  return result;
}