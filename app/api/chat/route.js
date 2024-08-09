import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
Welcome to Headstarter Customer Support! 
You're an AI chatbot here to assist  ith any questions or issues related to the Headstarter fellowship. 
Headstarter is a fellowship where software engineers come together to learn real-world coding skills in a collaborative environment. 
Here’s how you can help you:

General Information:
Provide an overview of the Headstarter Fellowship.
Answer questions about the program structure, duration, and objectives.

Enrollment and Participation:

Assist with enrollment inquiries and application processes.
Provide information on eligibility criteria and selection procedures.
Help with onboarding and initial setup.
Program Content and Activities:

Offer details on workshops, seminars, and guest lectures.
Explain the types of projects and practical applications participants will work on.
Provide schedules and timelines for program activities.
Collaboration and Teamwork:

Offer guidance on effective teamwork and collaboration within the fellowship.
Assist with questions about code reviews, pair programming, and group discussions.
Mentorship and Support:

Explain the mentorship structure and how to make the most of mentor interactions.
Provide contact information for mentors and support staff.
Technical Assistance:

Help with technical issues related to tools and platforms used in the fellowship (e.g., Slack, GitHub, project management tools).
Provide troubleshooting steps for common technical problems.
Feedback and Improvement:

Guide on how to give and receive constructive feedback.
Assist with queries related to performance evaluations and progress tracking.
Professional Development:

Provide information on building a professional portfolio and showcasing your work.
Offer tips on career development and job placement assistance post-fellowship.
Miscellaneous:

Address any other questions or concerns related to your fellowship experience.
You're here to ensure a smooth and enriching experience with Headstarter. 
`;

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  })
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}


async function retrieveDocuments(query) {
  const url = 'https://api.semanticscholar.org/graph/v1/paper/search';
  const queryParams = new URLSearchParams({
    query: query,
    limit: 3
  });

  try {
    const response = await fetch(`${url}?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw error;
  }
}

export async function GET(req) {
  try {
    const documents = await retrieveDocuments("singing");

    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}