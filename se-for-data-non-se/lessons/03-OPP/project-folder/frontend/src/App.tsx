import { Routes, Route, Navigate } from "react-router";
import Sidebar from "./components/layout/Sidebar";
import Page1Classes from "./pages/Page1Classes";
import Page2Inheritance from "./pages/Page2Inheritance";
import Page3Encapsulation from "./pages/Page3Encapsulation";
import Page4Polymorphism from "./pages/Page4Polymorphism";
import Page5Factory from "./pages/Page5Factory";

export default function App() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route path="/classes" element={<Page1Classes />} />
          <Route path="/inheritance" element={<Page2Inheritance />} />
          <Route path="/encapsulation" element={<Page3Encapsulation />} />
          <Route path="/polymorphism" element={<Page4Polymorphism />} />
          <Route path="/factory" element={<Page5Factory />} />
        </Routes>
      </main>
    </div>
  );
}
