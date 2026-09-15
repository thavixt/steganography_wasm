import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../logic/hooks/useAuth";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Inputs = {
  email: string;
};

export function Login() {
  const [open, setOpen] = useState(false);
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setLoading(true);
      await login({
        email: data.email,
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
      trigger={<Button variant="secondary">Log in</Button>}
      title={"Register an account"}
      description={"Please provide the email address for your account."}
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
              Please provide the email adress you registered with previously
            </span>
          ) : null}
        </div>
        <div className="w-full flex gap-2 justify-end pt-4">
          <Button type="submit" loading={loading}>
            Log in
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
