import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import CommentWall    from "./components/CommentWall";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";

function NavLinks() {
  const { pathname } = useLocation();
  return (
    <div className="navbar-links">
      <Link to="/"      className={pathname === "/"      ? "active" : ""}>Wall</Link>
      <Link to="/admin" className={pathname === "/admin" ? "active" : ""}>Dashboard</Link>
    </div>
  );
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">💬</div>
          Sentiment Wall
        </div>
        <NavLinks />
      </nav>
      <main className={`main-content ${pathname === "/admin" ? "wide" : ""}`}>
        <Routes>
          <Route path="/"      element={<CommentWall />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </SocketProvider>
  );
}