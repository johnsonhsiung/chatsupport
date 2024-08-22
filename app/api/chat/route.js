import { NextResponse } from "next/server";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "openai";

const systemPrompt = `
You are a knowledgeable and supportive vocal coach designed to help individuals learn how to sing and improve their vocal techniques. Your primary role is to provide personalized guidance on vocal exercises, breathing techniques, pitch control, and other aspects of singing. You also offer insights on maintaining vocal health, selecting appropriate songs, and developing a strong singing voice.
Each user question will contain helpful context that might enhance your answer. Provide the youtube link if any of the content was used to generate your answer. 

Capabilities:

Vocal Training: Offer step-by-step instructions for vocal exercises, warm-ups, and techniques to improve range, tone, pitch, and breath control.
Feedback and Improvement: Provide constructive feedback on vocal practices and suggest areas for improvement.
Educational Resources: Recommend reliable websites, articles, and videos on singing techniques, vocal health, and performance tips when asked.
Song Selection and Interpretation: Assist users in choosing songs suitable for their vocal range and style, and offer tips on interpreting lyrics and conveying emotions through singing.
Motivation and Support: Encourage users to stay motivated, practice regularly, and celebrate progress, fostering a positive and confident approach to singing.
Tone:
Maintain a friendly, encouraging, and professional tone. Be patient and supportive, understanding that learning to sing can be a challenging and personal journey.

Limitations:
You provide general guidance and suggestions based on common vocal practices but do not replace personalized advice from a professional vocal coach or medical professional. Avoid diagnosing vocal health issues and instead, suggest seeking professional advice if any vocal discomfort arises.

Also, incorporate some emojis to provide levity and a welcoming environment to our users

Make sure to also properly format your responses for legibility with no looking too cluttered or overwhelming with proper indentation for bullet points and spacing between headers and content"

Because you are only a vocal coach, do not answer any questions that are irrelvant to singing. 
`
;

const systemPromptParseQuestion = `
You are an assistant specialized in extracting keywords from user queries related to singing. When the user asks a question, identify and output the most relevant keywords from the query. These keywords will be used to search an online database for scholarly articles on the topic. Focus on key terms, phrases, and concepts that capture the essence of the user's query.

Ensure that the keywords are specific enough to yield relevant academic results, but broad enough to cover the general topic of interest.

Do not prepend your response with the word "Keywords." Only respond with the keywords themselves. 

Example:

User Query: "What are the effects of vocal warm-ups on pitch accuracy in classical singers?"
Keywords: "vocal warm-ups, pitch accuracy, classical singers"
`

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  })
  const data = await req.json();
  // console.log(data[data.length - 1].content)
  const context = await getYouTubeContext(data[data.length - 1].content)
  const augmentedQuery = context + "\n\n\n\nMy question: \n" + data[data.length - 1].content
  data[data.length - 1].content = augmentedQuery
  // console.log(data)

  // console.log(context)
  // console.log(data)
  

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data

    ],
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

async function parseUserQuestion(question){
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  })


  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPromptParseQuestion }, ...question],
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

// Parse the user question into keywords.
// Use the keyword in as the request
// Get the abstracts of each scholarly article.
// Feed it as context and generate reply. 

// Actually, look at the RAG workshop for headstarter first. 
// RAG workshop says basically. Put your data into an embedding in pinecone
// calculate the most similar context 
// Feed that into the prompt
// Get top few youtube videos.
// Get the transcripts of each.
// Skip embedding for now. 

async function searchYouTube(query){

}

 async function getYouTubeContext(searchTerm) {
  const { google } = require('googleapis');
  const youtube = google.youtube('v3');
  const apiKey = process.env.YOUTUBE_API_KEY;
  const youtubeCaptions = require('youtube-captions-scraper');

  const contextArray = [];
  
  try {
    const response = await youtube.search.list({
      key: apiKey,
      part: 'snippet',
      q: searchTerm,
      type: 'video',
      maxResults: 5
    });

    const videos = response.data.items;
    for (const video of videos) {
      //console.log(`Title: ${video.snippet.title}`);
      //console.log(`URL: https://www.youtube.com/watch?v=${video.id.videoId}`);
      const videoId = `${video.id.videoId}`;

      try {
        const captions = await youtubeCaptions.getSubtitles({
          videoID: videoId,
          lang: 'en' // Language code, e.g., 'en' for English
        });

        const combinedText = captions.map(captionSnippet => captionSnippet.text).join(' '); 
        const videoContext = `Video Title: ${video.snippet.title}, ` + `URL: https://www.youtube.com/watch?v=${video.id.videoId}\n\n` + `Content: ${combinedText}`
        contextArray.push(videoContext)
        // Will figure this out later. 
        // const splitter = new RecursiveCharacterTextSplitter({
        //   chunkSize: 2000,
        //   chunkOverlap: 200,
        // });

        // const docOutput = await splitter.splitDocuments([
        //   new Document({ pageContent: combinedText }), // Corrected text variable name
        // ]);

        //console.log(docOutput); // Optionally log the result

      } catch (captionError) {
        console.error('Error fetching captions:', captionError);
      }

      console.log('---');
    }
    const augmentedQuery = "<CONTEXT>\n" + contextArray.join("\n\n\n") + "</CONTEXT>"
    
    return augmentedQuery
  } catch (error) {
    console.error('Error fetching data from YouTube API:', error);
  }
}

// export async function GET(req) {
//   try {
//     const documents = await retrieveDocuments("singing");

//     return new Response(JSON.stringify(documents), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
// }