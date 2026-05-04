import { Outlet } from "react-router-dom";

function App() {
  return (
    <>
      <div>
        <main className="bg-white dark:bg-black">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default App;
