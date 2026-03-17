import AuthButtons from "./components/AuthButtons";
import UserMenu from "./components/UserMenu";
import { useAuth } from "../../context/AppContext";

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = "" }: NavbarProps) {
  const { isLoggedIn, username, email, role } = useAuth();

  return (
    <header
      className="h-14 w-full flex items-center justify-between
                       sticky top-0 z-30 pl-12 sm:pl-0"
    >
      <h1 className="font-medium text-text-primary">{title}</h1>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <UserMenu email={email} role={role} username={username} />
        ) : (
          <AuthButtons />
        )}
      </div>
    </header>
  );
}
