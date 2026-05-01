import React from "react";
import { Layout } from "../bonents/mainpage/Layout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Button } from "../ui/button.jsx";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";

export default function SignIn() {
  const { signInWithGoogle, user } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  return (
    <>
    <Helmet>
      <title>Sign In | Xclusive Shop</title>

      <meta
        name="description"
        content="Sign in to your Xclusive Shop account to access orders, wishlist, and faster checkout."
      />

      <meta
        name="keywords"
        content="sign in, login, Xclusive Shop, account, ecommerce login"
      />

      {/* Open Graph */}
      <meta property="og:title" content="Sign In | Xclusive Shop" />
      <meta
        property="og:description"
        content="Access your Xclusive Shop account to manage orders and shopping activity."
      />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Xclusive Shop" />

      {/* Twitter */}
      <meta name="twitter:title" content="Sign In | Xclusive Shop" />
      <meta
        name="twitter:description"
        content="Login to your Xclusive Shop account."
      />
    </Helmet>
    <Layout>
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Sign In</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to track orders and manage your account.
          </p>

          <Button
            size="lg"
            className="w-full flex items-center justify-center gap-3 bg-foreground hover:bg-foreground/90 text-background h-12"
            onClick={signInWithGoogle}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264,51.509 C -3.264,50.719 -3.334,49.969 -3.454,49.239 L -14.754,49.239 L -14.754,53.749 L -8.284,53.749 C -8.574,55.229 -9.424,56.479 -10.684,57.329 L -10.684,60.329 L -6.824,60.329 C -4.564,58.239 -3.264,55.159 -3.264,51.509 z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754,63.239 C -11.514,63.239 -8.804,62.159 -6.824,60.329 L -10.684,57.329 C -11.764,58.049 -13.134,58.489 -14.754,58.489 C -17.884,58.489 -20.534,56.379 -21.484,53.529 L -25.464,53.529 L -25.464,56.619 C -23.494,60.539 -19.444,63.239 -14.754,63.239 z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484,53.529 C -21.734,52.809 -21.864,52.039 -21.864,51.239 C -21.864,50.439 -21.724,49.669 -21.484,48.949 L -21.484,45.859 L -25.464,45.859 C -26.284,47.479 -26.754,49.299 -26.754,51.239 C -26.754,53.179 -26.284,54.999 -25.464,56.619 L -21.484,53.529 z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754,43.989 C -12.984,43.989 -11.404,44.599 -10.154,45.789 L -6.734,41.939 C -8.804,40.009 -11.514,38.989 -14.754,38.989 C -19.444,38.989 -23.494,41.689 -25.464,45.859 L -21.484,48.949 C -20.534,46.099 -17.884,43.989 -14.754,43.989 z"
                />
              </g>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-5 text-xs text-muted-foreground text-center">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
    </>
  );
}