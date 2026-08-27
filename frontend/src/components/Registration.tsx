import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../logic/hooks/useAuth";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Inputs = {
  email: string;
  name: string;
};

export function Registration() {
  const [open, setOpen] = useState(false);
  const { register: registerAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    try {
      setLoading(true);
      await registerAccount({
        email: data.email,
        name: data.name,
      });
      setOpen(false);
    } catch (ex) {
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      onOpenChange={setOpen}
      open={open}
      trigger={<Button variant="secondary">Register</Button>}
      title={"Register an account"}
      description={
        "Please provide your name and a unique username you'd like to use."
      }
      loading={loading}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input
            defaultValue={
              import.meta.env.DEV ? "peter.komlosi@gmail.com" : undefined
            }
            {...register("email", { required: true })}
          />
          {formState.errors.email ? (
            <span className="text-red-400">
              Please provide your email address
            </span>
          ) : null}
          <Label>Name</Label>
          <Input
            defaultValue={import.meta.env.DEV ? "Peter Komlosi" : undefined}
            {...register("name", { required: true })}
          />
          {formState.errors.name ? (
            <span className="text-red-400">Please provide your name</span>
          ) : null}
        </div>
        <div className="w-full flex gap-2 justify-end pt-4">
          <Button type="submit" loading={loading}>
            Submit
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
