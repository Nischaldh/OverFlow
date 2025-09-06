import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import { AIAnswerSchema } from "@/lib/validations";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const { question, content, userAnswer } = await req.json();
  try {
    const validatedData = AIAnswerSchema.safeParse({
      question,
      content,
    });
    if (!validatedData.success) {
      throw new ValidationError(validatedData.error.flatten().fieldErrors);
    }
    const { text } = await generateText({
      model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
      prompt: `Generate a markdown-formatted response to the following question: "${question}"
              Consider the provided context: *Context:* ${content}
              Also, prioritize and incorporate the user's answer when formulating your response: *User's Answer:* ${userAnswer}
              Prioritize the user's answer only if it's correct. If it's incomplete or incorrect, improve or correct it while keeping the response concise and to the point.
              *Important:* Always include a short language identifier for code blocks (like 'js', 'py', 'ts', 'html', 'css') and never leave it blank.
              Provide the final answer in markdown format.`,
      system: `You are a helpful assistant that provides informative responses in markdown format. Use appropriate markdown syntax for headings, lists, code blocks, and emphasis where necessary. For code blocks, always include a short-form language identifier (e.g., 'js', 'py', 'ts', 'html', 'css').`,
    });
    console.log("Generated AI answer:", text);
    return NextResponse.json({ success: true, data: text }, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
