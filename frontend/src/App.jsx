import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// Protected route wrapper
const ClerkProtected = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Protected route */}
      <Route
        path="/app/dashboard"
        element={
          <ClerkProtected>
            <div>Dashboard</div>
          </ClerkProtected>
        }
      />
    </Routes>
  );
};

export default App;
