export interface ContactFields {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export function validateContact(
  f: ContactFields
): Partial<Record<"name" | "email" | "message", string>> {
  const errors: Partial<Record<"name" | "email" | "message", string>> = {};
  if (!f.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    errors.email = "Please enter a valid email address.";
  if (!f.message.trim()) errors.message = "Please enter a message.";
  return errors;
}
