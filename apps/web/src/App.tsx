import { Outlet } from "react-router-dom";

function App() {
  return (
    <>
      <div>
        <main className="flex-1 bg-white dark:bg-black p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default App;
