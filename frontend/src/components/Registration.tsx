import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../logic/hooks/useAuth";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Inputs = {
  name: string;
  username: string;
};

export function Registration() {
  const [open, setOpen] = useState(false);
  const { register: registerAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    await registerAccount({
      name: data.name,
      username: data.username,
    });
    setLoading(false);
    setOpen(false);
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
          <Label>Name</Label>
          <Input
            placeholder="My name"
            defaultValue="Peter Komlosi"
            {...register("name", { required: true })}
          />
          {formState.errors.name ? (
            <span className="text-red-400">Please provide your name</span>
          ) : null}
          <Label>Username</Label>
          <Input
            placeholder="user123"
            defaultValue="thavixt"
            {...register("username", { required: true })}
          />
          {formState.errors.username ? (
            <span className="text-red-400">Please provide a username</span>
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
