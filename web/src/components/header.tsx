import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          Self Kanban
        </Link>
      </div>
    </header>
  );
}
