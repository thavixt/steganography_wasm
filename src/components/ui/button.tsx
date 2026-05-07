import { type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "#lib/utils";
import { buttonVariants } from "./button-variants";
import { Spinner } from "./spinner";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & { loading?: boolean } & VariantProps<
  typeof buttonVariants
> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner /> Loading ...
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button };
