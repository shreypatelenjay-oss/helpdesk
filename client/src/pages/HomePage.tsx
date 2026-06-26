import { Navbar } from "../components/Navbar";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </main>
    </div>
  );
}
