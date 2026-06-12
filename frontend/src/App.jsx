import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import AdminRoute from "./components/routes/AdminRoute.jsx";
import ProtectedRoute from "./components/routes/ProtectedRoute.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Billing from "./pages/Billing.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Inventory from "./pages/Inventory.jsx";
import Invoice from "./pages/Invoice.jsx";
import Login from "./pages/Login.jsx";
import CustomerDetails from "./pages/CustomerDetails.jsx";
import Customers from "./pages/Customers.jsx";
import LowStock from "./pages/LowStock.jsx";
import NotFound from "./pages/NotFound.jsx";
import PlaceholderModule from "./pages/PlaceholderModule.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ProductForm from "./pages/ProductForm.jsx";
import ProductsList from "./pages/ProductsList.jsx";
import Register from "./pages/Register.jsx";
import Reports from "./pages/Reports.jsx";
import Suppliers from "./pages/Suppliers.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/invoice/:invoiceNo" element={<Invoice />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/products/add" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/low-stock" element={<LowStock />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<PlaceholderModule title="Settings" />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
