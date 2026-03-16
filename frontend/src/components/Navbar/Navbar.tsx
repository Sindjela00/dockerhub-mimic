import AuthButtons from "./AuthButtons";
import UserMenu from "./UserMenu";

interface NavbarProps {
  title?: string;
  isLoggedIn?: boolean;
  username?: string;
  plan?: string;
}

export default function Navbar({
  title = "Home",
  isLoggedIn = false,
  username = "john.doe",
  plan = "Free",
}: NavbarProps) {
  return (
    <header
      className="h-14 w-full flex items-center justify-between
                 sticky top-0 z-30 pl-12 sm:pl-0"
    >
      <h1 className="font-medium text-text-primary">{title}</h1>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <UserMenu username={username} plan={plan} />
        ) : (
          <AuthButtons />
        )}
      </div>
    </header>
  );
}
