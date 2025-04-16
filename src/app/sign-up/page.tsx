
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { isUsernameAvailable } from "@/services/username-availability";

const formSchema = z
  .object({
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .max(100)
      .refine((password) => /[a-z]/.test(password), {
        message: "Password must contain at least one lowercase letter.",
      })
      .refine((password) => /[A-Z]/.test(password), {
        message: "Password must contain at least one uppercase letter.",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Password must contain at least one number.",
      })
      .refine((password) => /[^a-zA-Z0-9\s]/.test(password), {
        message: "Password must contain at least one special character.",
      }),
    passwordConfirm: z.string(),
    code: z.string().min(6, {
      message: "Verification code must be 6 characters",
    }),
    username: z
      .string()
      .min(3, {
        message: "Username must be at least 3 characters.",
      })
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, {
        message:
          "Username must contain only letters, numbers, and underscores.",
      }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"],
  });

const SignUp = () => {
  const [stage, setStage] = useState<"email" | "code" | "username">("email");
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      code: "",
      username: "",
    },
  });

  const { isLoading } = form.formState;
  const passwordValue = form.watch("password");

  // Password validation states
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [isMinLength, setIsMinLength] = useState(false);

  // Update validation states when password changes
  useEffect(() => {
    setHasLowercase(/[a-z]/.test(passwordValue));
    setHasUppercase(/[A-Z]/.test(passwordValue));
    setHasNumber(/[0-9]/.test(passwordValue));
    setHasSpecialChar(/[^a-zA-Z0-9\s]/.test(passwordValue));
    setIsMinLength(passwordValue.length >= 8);
  }, [passwordValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Simulate API call - replace with actual Firebase authentication logic
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (stage === "email") {
        // Simulate sending verification email
        toast({
          title: "Verification email sent.",
          description: "Please check your inbox.",
        });
        setStage("code");
        return;
      }

      if (stage === "code") {
        // Simulate verifying code
        toast({
          title: "Code verified.",
          description: "Please create a username.",
        });
        setStage("username");
        return;
      }

      if (stage === "username") {
        const available = await isUsernameAvailable(values.username);
        if (!available) {
          form.setError("username", {
            type: "manual",
            message: "This username is already taken.",
          });
          return;
        }

        toast({
          title: "Account created.",
          description: "You have successfully created an account.",
        });
        router.push("/");
        return;
      }
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description: "There was an error creating your account.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container relative flex h-screen w-screen flex-col items-center justify-center md:grid lg:max-w-none">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.shield className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to create an account.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {stage === "email" && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1">
                  <p className="text-sm font-medium">Password must contain:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li
                      className={cn({
                        "text-green-500": hasLowercase,
                        "text-muted-foreground": !hasLowercase,
                      })}
                    >
                      At least one lowercase letter
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasUppercase,
                        "text-muted-foreground": !hasUppercase,
                      })}
                    >
                      At least one uppercase letter
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasNumber,
                        "text-muted-foreground": !hasNumber,
                      })}
                    >
                      At least one number
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasSpecialChar,
                        "text-muted-foreground": !hasSpecialChar,
                      })}
                    >
                      At least one special character
                    </li>
                    <li
                      className={cn({
                        "text-green-500": isMinLength,
                        "text-muted-foreground": !isMinLength,
                      })}
                    >
                      At least 8 characters
                    </li>
                  </ul>
                </div>

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {stage === "code" && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {stage === "username" && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="sparky_auth" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;
