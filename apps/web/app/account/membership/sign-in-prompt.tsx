import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bowerbird-poc/ui/components/breadcrumb';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Info, LogIn, User } from 'lucide-react';

export function SignInPrompt({ loginWithRedirect }: { loginWithRedirect: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Sign In</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="py-12">
        <div className="bg-card mx-auto max-w-md rounded-xl border p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
              <User className="text-primary size-8" />
            </div>
            <h2 className="text-2xl font-bold">Sign in to manage your membership</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Sign in with your account to view and manage your membership
            </p>
          </div>
          <Button className="w-full gap-2" onClick={() => loginWithRedirect()}>
            <LogIn className="size-4" />
            Sign in
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex gap-3">
          <Info className="size-5 shrink-0 text-amber-600" />
          <div>
            <h4 className="font-bold text-amber-800">Secure Sign In</h4>
            <p className="mt-1 text-sm text-amber-700">
              Sign in or create an account to view your membership status, billing details, and
              manage your subscription.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
