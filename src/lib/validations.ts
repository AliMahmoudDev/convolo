import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be under 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ═══════════════════════════════════════════
// Conversation Validation Schemas
// ═══════════════════════════════════════════

/**
 * Schema for starting a new conversation.
 *
 * Validates:
 * - languagePair: Must be "xx-yy" format (e.g., "en-ar")
 * - scenarioId: Optional, must be a valid UUID if provided
 * - difficultyLevel: Optional, must be one of the enum values
 */
export const conversationStartSchema = z.object({
  languagePair: z
    .string()
    .regex(/^[a-z]{2}-[a-z]{2}$/, "Language pair must be in format: xx-yy (e.g., en-ar)"),
  scenarioId: z.string().uuid().optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

/**
 * Schema for sending a message in a conversation.
 *
 * Validates:
 * - content: Must be 1-2000 characters (not empty, not too long)
 *
 * WHY 2000 char limit?
 * - Prevents abuse (someone sending huge texts to waste API credits)
 * - Gemini has token limits — very long messages could fail
 * - Normal conversation messages are typically under 500 chars
 */
export const messageSendSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long (maximum 2000 characters)"),
});

export type ConversationStartInput = z.infer<typeof conversationStartSchema>;
export type MessageSendInput = z.infer<typeof messageSendSchema>;
