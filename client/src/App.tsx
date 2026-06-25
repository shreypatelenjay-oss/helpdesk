import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div>
      <h1>Ticket Management</h1>
      {status === null && <p>Checking server...</p>}
      {status === "ok" && <p>Server is online</p>}
      {status === "error" && <p>Could not reach server</p>}
    </div>
  );
}

export default App;
