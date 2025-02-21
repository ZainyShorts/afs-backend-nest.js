import { HttpStatus, Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import { ResponseDto } from '../dto/response.dto';
import { Observable } from 'rxjs';
import { ASSISTANT } from './enum/Assistant.enum';
import * as path from 'path';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  //Assistant part Start ----------------------------------------------------------------

  // You are a professional medical report analyst.
  // I will ask you questions about the stock market and you will answer them.
  // If you're not 100% sure of the answer, you can say "I don't know"

  async createAssistant(role: string,name:string): Promise<ResponseDto> {
    try {
      const assistant = await this.openai.beta.assistants.create({
        instructions: role,
        name: name,
        tools: [{ type: 'code_interpreter' }],
        model: 'gpt-4o',
      });
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: assistant,
        msg: 'Assistant created',
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async deleteAssistant(assistantId: string): Promise<ResponseDto> {
    if (!assistantId)
      return {
        success: true,
        msg: ' Provide assistantId',
        statusCode: HttpStatus.BAD_REQUEST,
      };

    try {
      await this.openai.beta.assistants.del(assistantId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: 'Assistant deleted',
      };
    } catch (e) {
      return {
        success: false,
        msg: e?.error?.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async assistantList(): Promise<ResponseDto> {
    try {
      const list = await this.openai.beta.assistants.list({
        order: 'desc',
      });
      return { data: list.data, success: true, statusCode: HttpStatus.OK };
    } catch (e) {
      return {
        success: false,
        data: [],
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  //Assistant part End ------------------------------------------------------------

  //Thread part Start -------------------------------------------------------------

  async createThread(): Promise<ResponseDto> {
    try {
      const Thread = await this.openai.beta.threads.create(); //thread_Y0MvSLsaTUDULfAHsYzEYPzY
      return {
        data: Thread,
        success: true,
        statusCode: HttpStatus.CREATED,
        msg: 'Thread Created',
      };
    } catch (e) {
      return {
        msg: e?.error?.message,
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async deleteThread(threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    try {
      await this.openai.beta.threads.del(threadId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: 'Thread deleted',
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  //Thread part End ----------------------------------------------------------------

  //Message part Start -------------------------------------------------------------

  async createMessage(message: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!message)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Message content missing',
      };
    try {
      const threadMessage = await this.openai.beta.threads.messages.create(
        threadId,
        {
          role: 'user',
          content: message,
        },
      );
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: threadMessage,
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async messagesList(threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };

    try {
      const list = await this.openai.beta.threads.messages.list(threadId);
      return { success: true, statusCode: HttpStatus.OK, data: list };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: [],
        msg: e?.error?.message,
      };
    }
  }

  //Message part End ----------------------------------------------------------------

  //Run part Start --------------------------------------------------------------------
  async createRun(
    agent: string,
    type: string,
    threadId: string,
  ): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!agent || !type) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Assistant Id missing',
      };
    }

    try {
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: 'asst_6R2LDwnthDwzriDZhLrlUNly',
      });
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: run,
        msg: 'Run created',
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async cancelRun(runId: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!runId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Run Id missing',
      };
    try {
      const run = await this.openai.beta.threads.runs.cancel(threadId, runId);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: run,
        msg: 'Run cancelled',
      };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }

  async runStatus(runId: string, threadId: string): Promise<ResponseDto> {
    if (!threadId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Thread Id missing',
      };
    if (!runId)
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        msg: 'Run Id missing',
      };
    try {
      const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      return { success: true, statusCode: HttpStatus.OK, data: run };
    } catch (e) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: e?.error?.message,
      };
    }
  }
  //Run part End   --------------------------------------------------------------------


  //Speech-To-Text
  async speechToText(audioPath: string): Promise<ResponseDto> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: transcription.text,
      };
    } catch (e) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: '',
        msg: e?.error?.message,
      };
    } finally {
      fs.unlink(audioPath, (err) => {
        if (err) console.error(err);
      });
    }
  }


  // Image-to-text data Vision Model
  async imageToText(url: string[],userPrompt:string): Promise<ResponseDto> {
      try {
          const length = url.length
          if(length>3){
              return {
                  success: false,
                  statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                  msg:"Too Many Images"
              };
          }

          if(length<=0){
              return {
                  success: false,
                  statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                  msg:"Empty Image List"
              };
          }

          const messages:any = [
              { type: "text", text: userPrompt ??  "Explain the image" },
              ...url.map((url) => ({
              type: "image_url",
              image_url: { url },
              })),
          ];
          
          const response = await this.openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: messages }],
              store: true,
          });
      return {
          success: true,
          statusCode: HttpStatus.OK,
          data: response.choices[0]?.message?.content || "No response generated",
      };
      } catch (e) {
      return {
          success: true,
          statusCode: HttpStatus.OK,
          msg: e?.error?.message || "An unexpected error occurred",
      };
      }
  }

  // Stream Image-to-text data Vision Model
  async streamImageToText(url: string[],userPrompt:string,token:number):Promise<Observable<string>>{
      return new Observable(  (observer)=> {
          (async()=>{
      try {
          const length = url.length
          if(length>3){
              observer.error("Too many images");
          }

          if(length<=0){
              observer.error("Empty Image List");
              return {
                  success: false,
                  statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                  msg:"Empty Image List"
              };
          }

          const messages:any = [
              { type: "text", text: userPrompt ??  "Explain the image" },
              ...url.map((url) => ({
              type: "image_url",
              image_url: { url },
              })),
          ];
          
          const response = await this.openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: messages }],
              max_tokens:token,
              store: true,
              stream:true
          });
          for await (const part of response) {
              const text = part.choices[0]?.delta?.content || "";
              observer.next(text); // Send each token to the client
          }

          observer.complete();
      } catch (e) {
          console.error("ChatCompletion Streaming Error:", e);
          observer.error(e?.error?.message || "An unexpected error occurred");
      }
  })()
  })
  }

  // Text-Completion 
  async chatCompletion(assistantType: keyof typeof ASSISTANT, subType: string,userPrompt:string, token:number): Promise<ResponseDto> {
      try {
          // Ensure the requested subtype exists within the selected assistant type
          if (!(subType in ASSISTANT[assistantType])) {
              return {
                  success: false,
                  statusCode: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                  msg:`Invalid subtype: ${subType} for assistant type: ${assistantType}`
              };
          }

          // Get the dynamic assistant role content
          const assistantRole = ASSISTANT[assistantType][subType as keyof typeof ASSISTANT[typeof assistantType]];

          const completion = await this.openai.chat.completions.create({
              model: "gpt-4o",
              temperature:0,
              max_tokens:token,
              messages: [
                  { role: "system", content: assistantRole },
                  { role: "user", content: userPrompt },
              ],
              store: true,
          });

          return {
              success: true,
              statusCode: HttpStatus.OK,
              data: completion.choices[0]?.message?.content || "No response generated",
          };
      } catch (e) {
          console.error("ChatCompletion Error:", e);

          return {
              success: false,
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              msg: e?.error?.message || "An unexpected error occurred",
          };
      }
  }

  // Text-Completion via stream
  async streamChatCompletion(
      assistantType: keyof typeof ASSISTANT,
      subType: string,
      userPrompt: string,
      token: number
  ): Promise<Observable<string>> {
      return new Observable(  (observer)=> {
          (async()=>{
          try {
              if (!(subType in ASSISTANT[assistantType])) {
                  observer.error(`Invalid subtype: ${subType} for assistant type: ${assistantType}`);
                  return;
              }
              const assistantRole = ASSISTANT[assistantType][subType as keyof typeof ASSISTANT[typeof assistantType]];

              const stream = await this.openai.chat.completions.create({
                  model: "gpt-4o",
                  temperature: 0,
                  max_tokens: token,
                  messages: [
                      { role: "system", content: assistantRole },
                      { role: "user", content: userPrompt },
                  ],
                  stream: true, // Enable streaming
              });

              for await (const part of stream) {
                  const text = part.choices[0]?.delta?.content || "";
                  observer.next(text); // Send each token to the client
              }

              observer.complete();
          } catch (e) {
              console.error("ChatCompletion Streaming Error:", e);
              observer.error(e?.error?.message || "An unexpected error occurred");
          }
      })()
      });
  }


  async tts(inputText: string,userId: string): Promise<ResponseDto> {
    const filPath = path.resolve(`./uploads/${userId}+${Date.now()}+speech.mp3`)
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: inputText,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(filPath, buffer);

      if (!fs.existsSync(filPath)) {
        return {
          success: false,
          msg:'File not found',
          statusCode:HttpStatus.BAD_REQUEST
        }
      }


      const stat = fs.statSync(filPath);
      console.log(stat)
      const stream = fs.createReadStream(filPath);


      return {
        success: true,
        msg:'File not found',
        statusCode:HttpStatus.BAD_REQUEST,
        data:{ stream, size: stat.size, filPath }
      }

    } catch (error) {
      return {
          success: false,
          msg:'Error generating speech:',
          statusCode:HttpStatus.BAD_REQUEST
        }

      }
  }
  
  

  async startNewQuiz(
    subject: string,
    difficulty: string,
    totalQuestions: number,
    subBranch:string,
    topic:string,
    level:string,
    usState:string
  ): Promise<ResponseDto> {
    try {
      const systemPrompt = `
      Subject: ${subject} ${subBranch} ${topic},
      Difficulty of the quiz: ${difficulty},
      Total quiz questions ${totalQuestions},
      Education Level: ${level},
      ${usState}
      `
      console.log(systemPrompt)


      if(!subject){
        return {
          success: false,
          statusCode: HttpStatus.BAD_GATEWAY,
        };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'quiz_generation',
            schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  description:
                    'List of quiz questions with multiple-choice answers.',
                  items: {
                    type: 'object',
                    properties: {
                      question: {
                        type: 'string',
                        description: 'The quiz question',
                      },
                      answers: {
                        type: 'array',
                        description:
                          'Four possible answers, one of which is correct.',
                        items: { type: 'string' },
                      },
                      correct_answer: {
                        type: 'string',
                        description:
                          'The correct answer from the answers array.',
                      },
                      id: {
                        type: 'number',
                        description:
                          'index id of each quesstion like 1 2 3 4',
                      },
                    },
                    required: ['question', 'answers', 'correct_answer', 'id'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['questions'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      // Validate and process the response
      if (!response || !response.choices || !response.choices[0]) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg: 'Invalid response structure from AI model',
        };
      }

      // return response.choices[0].message.content;
      return {
        success: true,
        statusCode: HttpStatus.OK,
        data: JSON.parse(response.choices[0].message.content),
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: error.message,
      };
    }
  }

  async generateCourseOutline(
    subjectName: string,
    difficulty: string,
    educationLevel: string,
    course: string,
  ) {
    try {
      const systemPrompt = `
      Subject: ${subjectName},
      courseOutline: ${course},
      Difficulty: ${difficulty},
      Education Level: ${educationLevel}
      Generate a structured course outline with sections and topics. Follow this format:
      
      const initialSections = [
        {
          topics: [
            { title: "Overview", status: "remaining" },
            { title: "Getting Started", status: "remaining" },
            { title: "Key Terminology", status: "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Definitions", status: "remaining" },
            { title: "Examples", status: "remaining" },
            { title: "Practice Questions", status: "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Deep Dive", status: "remaining" },
            { title: "Complex Scenarios", status: "remaining" },
          ],
          courseComplete: false
        },
        {
          topics: [
            { title: "Timed Quiz", status: "remaining" },
            { title: "Mixed Difficulty", status: "remaining" },
          ],
          courseComplete: false
        },
      ];
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'course_outline',
            schema: {
              type: 'object',
              properties: {
                sections: {
                  type: 'array',
                  description: 'List of course sections with topics.',
                  items: {
                    type: 'object',
                    properties: {
                      topics: {
                        type: 'array',
                        description: 'Topics covered in this section.',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string', description: 'Topic title' },
                            status: { type: 'string', enum: ['remaining'], description: 'Initial status' },
                          },
                          required: ['title', 'status'],
                          additionalProperties: false,
                        },
                      },
                      courseComplete: { type: 'boolean', description: 'Completion status of the course section always set false',  },
                    },
                    required: ['topics', 'courseComplete'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['sections'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      if (!response || !response.choices || !response.choices[0]) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg: 'Invalid response structure from AI model',
        };
      }

      return {
        success: true,
        data: response.choices[0].message.content,
      };
    } catch (error) {
      return {
        success: false,
        msg: error.message,
      };
    }
  }

  


}
